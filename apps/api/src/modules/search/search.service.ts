import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@spechub/database";
import { MeiliSearch } from "meilisearch";
import {
  createPaginationMeta,
  type PaginationMeta,
} from "../../common/dto/pagination.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { QuerySearchDto } from "./dto/query-search.dto";
import { DEVICE_SCORECARD_SELECT } from "../device-variants/device-variant-component-select";

const SEARCH_MODEL_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  release_date: true,
  announcement_date: true,
  cover_image_url: true,
  product_family: {
    select: {
      id: true,
      name: true,
      slug: true,
      brand_org: {
        select: {
          id: true,
          name: true,
          slug: true,
          short_name: true,
          logo_url: true,
        },
      },
      device_category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
  release_status: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
  device_variants: {
    where: { deleted_at: null },
    select: {
      id: true,
      variant_name: true,
      color_name: true,
      color_hex: true,
      launch_price: true,
      is_default: true,
      currency: {
        select: {
          code: true,
          symbol: true,
          decimal_digits: true,
        },
      },
      variant_module_scores: {
        select: {
          module_kind: true,
          module_id: true,
          score: true,
          score_source: true,
          score_version: true,
        },
        orderBy: [{ module_kind: "asc" as const }],
      },
      variant_scorecards: {
        select: DEVICE_SCORECARD_SELECT,
        orderBy: [{ calculated_at: "desc" as const }],
        take: 1,
      },
    },
    orderBy: [
      { is_default: "desc" as const },
      { launch_price: "asc" as const },
    ],
    take: 1,
  },
  _count: {
    select: {
      device_variants: true,
    },
  },
} satisfies Prisma.device_modelsSelect;

export type SearchResultItem = Prisma.device_modelsGetPayload<{
  select: typeof SEARCH_MODEL_SELECT;
}>;

export type SearchResult = {
  data: SearchResultItem[];
  meta: PaginationMeta & {
    query: string | null;
    source: "database" | "meilisearch";
  };
};

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async search(query: QuerySearchDto): Promise<SearchResult> {
    if (this.isMeilisearchEnabled()) {
      const result = await this.searchWithMeilisearch(query).catch(() => null);
      if (result) return result;
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.device_models.findMany({
        where,
        select: SEARCH_MODEL_SELECT,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ release_date: "desc" }, { name: "asc" }],
      }),
      this.prisma.device_models.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        ...createPaginationMeta(total, page, pageSize),
        query: query.q?.trim() || null,
        source: "database",
      },
    };
  }

  private async searchWithMeilisearch(
    query: QuerySearchDto,
  ): Promise<SearchResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const filters = this.buildMeilisearchFilters(query);
    const index = this.createMeilisearchClient().index(
      this.getMeilisearchIndexName(),
    );
    const response = await index.search<{ id: string }>(query.q?.trim() || "", {
      offset,
      limit: pageSize,
      filter: filters.length ? filters : undefined,
    });
    const ids = response.hits.map((hit) => hit.id);

    if (!ids.length) {
      return {
        data: [],
        meta: {
          ...createPaginationMeta(
            response.estimatedTotalHits ?? 0,
            page,
            pageSize,
          ),
          query: query.q?.trim() || null,
          source: "meilisearch",
        },
      };
    }

    const items = await this.prisma.device_models.findMany({
      where: {
        id: { in: ids },
        deleted_at: null,
      },
      select: SEARCH_MODEL_SELECT,
    });
    const byId = new Map(items.map((item) => [item.id, item]));

    return {
      data: ids
        .map((id) => byId.get(id))
        .filter((item): item is SearchResultItem => Boolean(item)),
      meta: {
        ...createPaginationMeta(
          response.estimatedTotalHits ?? ids.length,
          page,
          pageSize,
        ),
        query: query.q?.trim() || null,
        source: "meilisearch",
      },
    };
  }

  private isMeilisearchEnabled(): boolean {
    return this.configService.get<string>("MEILI_ENABLED") === "true";
  }

  private createMeilisearchClient(): MeiliSearch {
    return new MeiliSearch({
      host: this.configService.get<string>(
        "MEILI_HOST",
        "http://localhost:7700",
      ),
      apiKey: this.configService.get<string>("MEILI_API_KEY") || undefined,
    });
  }

  private getMeilisearchIndexName(): string {
    return this.configService.get<string>(
      "MEILI_DEVICE_MODELS_INDEX",
      "device_models",
    );
  }

  private buildMeilisearchFilters(query: QuerySearchDto): string[] {
    return [
      query.brand_slug ? `brand_slug = "${query.brand_slug}"` : undefined,
      query.category_slug
        ? `category_slug = "${query.category_slug}"`
        : undefined,
    ].filter((filter): filter is string => Boolean(filter));
  }

  private buildWhere(query: QuerySearchDto): Prisma.device_modelsWhereInput {
    const q = query.q?.trim();

    return {
      deleted_at: null,
      ...((query.brand_slug || query.category_slug) && {
        product_family: {
          deleted_at: null,
          ...(query.brand_slug && {
            brand_org: {
              slug: query.brand_slug,
              deleted_at: null,
            },
          }),
          ...(query.category_slug && {
            device_category: {
              slug: query.category_slug,
              deleted_at: null,
            },
          }),
        },
      }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { internal_codename: { contains: q, mode: "insensitive" } },
          { generation_label: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          {
            product_family: {
              name: { contains: q, mode: "insensitive" },
            },
          },
          {
            product_family: {
              brand_org: {
                name: { contains: q, mode: "insensitive" },
              },
            },
          },
          {
            device_variants: {
              some: {
                deleted_at: null,
                OR: [
                  {
                    variant_chipsets: {
                      some: {
                        chipset: {
                          deleted_at: null,
                          OR: [
                            { name: { contains: q, mode: "insensitive" } },
                            {
                              model_code: {
                                contains: q,
                                mode: "insensitive",
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                  {
                    variant_cpus: {
                      some: {
                        cpu: {
                          name: { contains: q, mode: "insensitive" },
                        },
                      },
                    },
                  },
                  {
                    variant_gpus: {
                      some: {
                        gpu: {
                          name: { contains: q, mode: "insensitive" },
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      }),
    };
  }
}
