import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@spechub/database";
import {
  createPaginationMeta,
  type PaginationMeta,
} from "../../common/dto/pagination.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateDeviceModelDto } from "./dto/create-device-model.dto";
import { QueryDeviceModelsDto } from "./dto/query-device-models.dto";
import { UpdateDeviceModelDto } from "./dto/update-device-model.dto";
import {
  DEVICE_SCORECARD_SELECT,
  DEVICE_VARIANT_BENCHMARK_SELECT,
  DEVICE_VARIANT_COMPONENT_SELECT,
} from "../device-variants/device-variant-component-select";

const VARIANT_SUMMARY_SELECT = {
  id: true,
  variant_name: true,
  market_name: true,
  sku_code: true,
  color_name: true,
  color_hex: true,
  launch_date: true,
  launch_price: true,
  is_default: true,
  currency: {
    select: {
      id: true,
      code: true,
      symbol: true,
      decimal_digits: true,
    },
  },
  release_status: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
  device_variant_benchmarks: {
    select: DEVICE_VARIANT_BENCHMARK_SELECT,
    orderBy: [{ benchmark: { name: "asc" as const } }],
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
} satisfies Prisma.device_variantsSelect;

const DEVICE_MODEL_LIST_SELECT = {
  id: true,
  product_family_id: true,
  name: true,
  slug: true,
  internal_codename: true,
  announcement_date: true,
  release_date: true,
  end_of_sale_date: true,
  end_of_support_date: true,
  generation_label: true,
  summary: true,
  description: true,
  cover_image_url: true,
  created_at: true,
  updated_at: true,
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
    where: {
      deleted_at: null,
    },
    select: VARIANT_SUMMARY_SELECT,
    orderBy: [
      { is_default: "desc" as const },
      { launch_date: "asc" as const },
      { variant_name: "asc" as const },
    ],
    take: 1,
  },
  _count: {
    select: {
      device_variants: {
        where: {
          deleted_at: null,
        },
      },
    },
  },
} satisfies Prisma.device_modelsSelect;

const DEVICE_MODEL_DETAIL_SELECT = {
  ...DEVICE_MODEL_LIST_SELECT,
  aliases: {
    select: {
      id: true,
      alias: true,
      alias_type: true,
      normalized_alias: true,
      region_code: true,
    },
    orderBy: [{ alias_type: "asc" as const }, { alias: "asc" as const }],
  },
  editorial_sections: {
    select: {
      id: true,
      section_key: true,
      title: true,
      body_markdown: true,
      display_order: true,
      is_published: true,
      updated_at: true,
    },
    orderBy: { display_order: "asc" as const },
  },
  device_variants: {
    where: {
      deleted_at: null,
    },
    select: {
      ...VARIANT_SUMMARY_SELECT,
      ...DEVICE_VARIANT_COMPONENT_SELECT,
    },
    orderBy: [
      { is_default: "desc" as const },
      { launch_date: "asc" as const },
      { variant_name: "asc" as const },
    ],
  },
} satisfies Prisma.device_modelsSelect;

export type DeviceModelListItem = Prisma.device_modelsGetPayload<{
  select: typeof DEVICE_MODEL_LIST_SELECT;
}>;

export type DeviceModelDetail = Prisma.device_modelsGetPayload<{
  select: typeof DEVICE_MODEL_DETAIL_SELECT;
}>;

export type DeviceModelMedia = {
  id: string;
  asset_type: string;
  url: string;
  role: string;
  display_order: number;
  is_primary: boolean;
  mime_type: string | null;
  alt_text: string | null;
  caption: string | null;
  width_px: number | null;
  height_px: number | null;
  duration_ms: string | null;
  file_size_bytes: string | null;
  original_filename: string | null;
};

export type DeviceModelDetailWithMedia = DeviceModelDetail & {
  media: DeviceModelMedia[];
};

export type DeviceModelListResult = {
  data: DeviceModelListItem[];
  meta: PaginationMeta;
};

@Injectable()
export class DeviceModelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config?: ConfigService,
  ) {}

  async listReleaseStatuses() {
    return this.prisma.release_statuses.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { sort_order: "asc" },
    });
  }

  async findMany(query: QueryDeviceModelsDto): Promise<DeviceModelListResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.device_models.findMany({
        where,
        select: DEVICE_MODEL_LIST_SELECT,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: this.buildOrderBy(query),
      }),
      this.prisma.device_models.count({ where }),
    ]);

    return {
      data: await this.withManagedCovers(items),
      meta: createPaginationMeta(total, page, pageSize),
    };
  }

  async findBySlug(slug: string): Promise<DeviceModelDetailWithMedia> {
    const model = await this.prisma.device_models.findFirst({
      where: {
        slug,
        deleted_at: null,
      },
      select: DEVICE_MODEL_DETAIL_SELECT,
    });

    if (!model) {
      throw new NotFoundException(`Device model ${slug} not found`);
    }

    const covered = (await this.withManagedCovers([model]))[0];
    return (await this.withManagedMedia([covered]))[0];
  }

  async findById(id: string): Promise<DeviceModelDetailWithMedia> {
    const model = await this.prisma.device_models.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: DEVICE_MODEL_DETAIL_SELECT,
    });

    if (!model) {
      throw new NotFoundException(`Device model ${id} not found`);
    }

    const covered = (await this.withManagedCovers([model]))[0];
    return (await this.withManagedMedia([covered]))[0];
  }

  async create(
    dto: CreateDeviceModelDto,
    actorUserId?: string,
  ): Promise<DeviceModelDetailWithMedia> {
    const { aliases, editorial_sections, ...modelData } = dto;
    this.assertUniqueAliases(aliases);
    const model = await this.prisma.$transaction(async (tx) => {
      const model = await tx.device_models.create({
        data: {
          ...modelData,
          ...(aliases !== undefined && {
            aliases: {
              create: aliases.map((alias) => ({
                alias: alias.alias.trim(),
                alias_type: alias.alias_type?.trim() || "alias",
                normalized_alias: this.normalizeSearch(alias.alias),
                region_code: alias.region_code?.trim().toUpperCase() || "",
              })),
            },
          }),
          ...(editorial_sections !== undefined && {
            editorial_sections: {
              create: editorial_sections.map((section, index) => ({
                section_key: section.section_key,
                title: section.title.trim(),
                body_markdown: section.body_markdown,
                display_order: section.display_order ?? index,
                is_published: section.is_published ?? false,
              })),
            },
          }),
        },
        select: DEVICE_MODEL_DETAIL_SELECT,
      });
      await tx.catalog_entity_versions.create({
        data: {
          entity_table: "device_models",
          entity_id: model.id,
          version: 1,
          actor_user_id: actorUserId,
          action: "create",
          snapshot: this.toJson(model),
        },
      });
      return model;
    });
    const covered = (await this.withManagedCovers([model]))[0];
    return (await this.withManagedMedia([covered]))[0];
  }

  async update(
    id: string,
    dto: UpdateDeviceModelDto,
    actorUserId?: string,
  ): Promise<DeviceModelDetailWithMedia> {
    const { aliases, editorial_sections, ...modelData } = dto;
    this.assertUniqueAliases(aliases);
    const model = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.device_models.findFirst({
        where: { id, deleted_at: null },
        select: { id: true },
      });
      if (!existing) {
        throw new NotFoundException(`Device model ${id} not found`);
      }
      const model = await tx.device_models.update({
        where: { id },
        data: {
          ...modelData,
          ...(aliases !== undefined && {
            aliases: {
              deleteMany: {},
              create: aliases.map((alias) => ({
                alias: alias.alias.trim(),
                alias_type: alias.alias_type?.trim() || "alias",
                normalized_alias: this.normalizeSearch(alias.alias),
                region_code: alias.region_code?.trim().toUpperCase() || "",
              })),
            },
          }),
          ...(editorial_sections !== undefined && {
            editorial_sections: {
              deleteMany: {},
              create: editorial_sections.map((section, index) => ({
                section_key: section.section_key,
                title: section.title.trim(),
                body_markdown: section.body_markdown,
                display_order: section.display_order ?? index,
                is_published: section.is_published ?? false,
              })),
            },
          }),
        },
        select: DEVICE_MODEL_DETAIL_SELECT,
      });
      const latest = await tx.catalog_entity_versions.aggregate({
        where: { entity_table: "device_models", entity_id: id },
        _max: { version: true },
      });
      await tx.catalog_entity_versions.create({
        data: {
          entity_table: "device_models",
          entity_id: id,
          version: (latest._max.version ?? 0) + 1,
          actor_user_id: actorUserId,
          action: "update",
          snapshot: this.toJson(model),
          change_set: this.toJson(dto),
        },
      });
      return model;
    });
    const covered = (await this.withManagedCovers([model]))[0];
    return (await this.withManagedMedia([covered]))[0];
  }

  async remove(id: string): Promise<DeviceModelDetail> {
    await this.findById(id);

    return this.prisma.device_models.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
      select: DEVICE_MODEL_DETAIL_SELECT,
    });
  }

  private buildWhere(
    query: QueryDeviceModelsDto,
  ): Prisma.device_modelsWhereInput {
    const q = query.q?.trim();

    return {
      deleted_at: null,
      ...(query.product_family_id && {
        product_family_id: query.product_family_id,
      }),
      ...(query.release_status && {
        release_status: {
          code: query.release_status,
        },
      }),
      ...((query.family_slug || query.brand_slug || query.category_slug) && {
        product_family: {
          deleted_at: null,
          ...(query.family_slug && { slug: query.family_slug }),
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
          { summary: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          {
            aliases: {
              some: { alias: { contains: q, mode: "insensitive" } },
            },
          },
          {
            device_variants: {
              some: {
                deleted_at: null,
                OR: [
                  { sku_code: { contains: q, mode: "insensitive" } },
                  { market_name: { contains: q, mode: "insensitive" } },
                  { variant_name: { contains: q, mode: "insensitive" } },
                ],
              },
            },
          },
          {
            product_family: {
              deleted_at: null,
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
                {
                  brand_org: {
                    deleted_at: null,
                    OR: [
                      { name: { contains: q, mode: "insensitive" } },
                      { slug: { contains: q, mode: "insensitive" } },
                      {
                        short_name: {
                          contains: q,
                          mode: "insensitive",
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      }),
    };
  }

  private buildOrderBy(
    query: QueryDeviceModelsDto,
  ): Prisma.device_modelsOrderByWithRelationInput[] {
    const allowedSortFields = new Set([
      "name",
      "slug",
      "announcement_date",
      "release_date",
      "created_at",
      "updated_at",
    ]);
    const explicitSortBy =
      query.sortBy && allowedSortFields.has(query.sortBy)
        ? query.sortBy
        : undefined;

    if (explicitSortBy) {
      return [{ [explicitSortBy]: query.sortOrder ?? "desc" }];
    }

    return [{ release_date: "desc" }, { name: "asc" }];
  }

  private assertUniqueAliases(
    aliases: CreateDeviceModelDto["aliases"] | undefined,
  ) {
    if (!aliases) return;
    const keys = aliases.map(
      (alias) =>
        `${this.normalizeSearch(alias.alias)}:${alias.region_code?.trim().toUpperCase() ?? ""}`,
    );
    if (new Set(keys).size !== keys.length) {
      throw new BadRequestException(
        "Alias bị trùng trong cùng thiết bị và khu vực.",
      );
    }
  }

  private normalizeSearch(value: string) {
    return value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private async withManagedCovers<
    T extends { id: string; cover_image_url: string | null },
  >(models: T[]): Promise<T[]> {
    const cdnBase = this.config
      ?.get<string>("STORAGE_CDN_BASE_URL")
      ?.replace(/\/+$/, "");
    if (!models.length) return models;
    const media = await this.prisma.entity_media.findMany({
      where: {
        entity_table: "device_models",
        entity_id: { in: models.map((model) => model.id) },
        role: "cover",
        media_asset: {
          upload_status: "ready",
          object_key: { not: null },
        },
      },
      select: {
        entity_id: true,
        is_primary: true,
        display_order: true,
        media_asset: {
          select: {
            url: true,
            cdn_url: true,
            object_key: true,
          },
        },
      },
      orderBy: [{ is_primary: "desc" }, { display_order: "asc" }],
    });
    const coverByModel = new Map<string, string>();
    for (const item of media) {
      if (coverByModel.has(item.entity_id)) {
        continue;
      }
      const mediaUrl =
        item.media_asset.cdn_url?.trim() ||
        item.media_asset.url?.trim() ||
        (cdnBase && item.media_asset.object_key
          ? `${cdnBase}/${item.media_asset.object_key
              .split("/")
              .map(encodeURIComponent)
              .join("/")}`
          : "");
      if (!mediaUrl) continue;
      coverByModel.set(
        item.entity_id,
        mediaUrl,
      );
    }
    return models.map((model) => ({
      ...model,
      cover_image_url: coverByModel.get(model.id) ?? model.cover_image_url,
    }));
  }

  private async withManagedMedia(
    models: DeviceModelDetail[],
  ): Promise<DeviceModelDetailWithMedia[]> {
    if (!models.length) return [];
    const cdnBase = this.config
      ?.get<string>("STORAGE_CDN_BASE_URL")
      ?.replace(/\/+$/, "");
    const media = await this.prisma.entity_media.findMany({
      where: {
        entity_table: "device_models",
        entity_id: { in: models.map((model) => model.id) },
        media_asset: {
          upload_status: "ready",
          asset_type: { in: ["image", "video"] },
        },
      },
      select: {
        entity_id: true,
        role: true,
        display_order: true,
        is_primary: true,
        media_asset: {
          select: {
            id: true,
            asset_type: true,
            url: true,
            cdn_url: true,
            object_key: true,
            mime_type: true,
            alt_text: true,
            caption: true,
            width_px: true,
            height_px: true,
            duration_ms: true,
            file_size_bytes: true,
            original_filename: true,
          },
        },
      },
      orderBy: [
        { is_primary: "desc" },
        { display_order: "asc" },
        { id: "asc" },
      ],
    });
    const mediaByModel = new Map<string, DeviceModelMedia[]>();
    for (const link of media) {
      const asset = link.media_asset;
      const url =
        asset.cdn_url?.trim() ||
        asset.url?.trim() ||
        (cdnBase && asset.object_key
          ? `${cdnBase}/${asset.object_key
              .split("/")
              .map(encodeURIComponent)
              .join("/")}`
          : "");
      if (!url) continue;
      const items = mediaByModel.get(link.entity_id) ?? [];
      items.push({
        id: asset.id,
        asset_type: asset.asset_type,
        url,
        role: link.role,
        display_order: link.display_order,
        is_primary: link.is_primary,
        mime_type: asset.mime_type,
        alt_text: asset.alt_text,
        caption: asset.caption,
        width_px: asset.width_px,
        height_px: asset.height_px,
        duration_ms: asset.duration_ms?.toString() ?? null,
        file_size_bytes: asset.file_size_bytes?.toString() ?? null,
        original_filename: asset.original_filename,
      });
      mediaByModel.set(link.entity_id, items);
    }
    return models.map((model) => ({
      ...model,
      media: mediaByModel.get(model.id) ?? [],
    }));
  }
}
