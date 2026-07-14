import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@spechub/database";
import {
  createPaginationMeta,
  type PaginationMeta,
} from "../../common/dto/pagination.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateDataSourceDto } from "./dto/create-data-source.dto";
import { CreateRawPageDto } from "./dto/create-raw-page.dto";
import { QueryRawPagesDto } from "./dto/query-raw-pages.dto";
import { ReviewRawPageDto } from "./dto/review-raw-page.dto";
import { UpdateDataSourceDto } from "./dto/update-data-source.dto";

const DATA_SOURCE_SELECT = {
  id: true,
  name: true,
  slug: true,
  base_url: true,
  reliability: true,
  last_crawled_at: true,
  crawl_config: true,
  is_active: true,
  created_at: true,
  updated_at: true,
  _count: {
    select: {
      raw_pages: true,
    },
  },
} satisfies Prisma.data_sourcesSelect;

const RAW_PAGE_SELECT = {
  id: true,
  source_id: true,
  url: true,
  raw_html: true,
  raw_text: true,
  parsed_data: true,
  status: true,
  device_model_id: true,
  error_message: true,
  attempts: true,
  crawled_at: true,
  parsed_at: true,
  source: {
    select: {
      id: true,
      name: true,
      slug: true,
      reliability: true,
    },
  },
  device_model: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.raw_pagesSelect;

export type DataSourceItem = Prisma.data_sourcesGetPayload<{
  select: typeof DATA_SOURCE_SELECT;
}>;

export type RawPageItem = Prisma.raw_pagesGetPayload<{
  select: typeof RAW_PAGE_SELECT;
}>;

export type RawPageListResult = {
  data: RawPageItem[];
  meta: PaginationMeta;
};

@Injectable()
export class DataIngestionService {
  constructor(private readonly prisma: PrismaService) {}

  async listSources(): Promise<{ data: DataSourceItem[] }> {
    const sources = await this.prisma.data_sources.findMany({
      select: DATA_SOURCE_SELECT,
      orderBy: [{ is_active: "desc" }, { reliability: "desc" }, { name: "asc" }],
    });

    return { data: sources };
  }

  async createSource(dto: CreateDataSourceDto): Promise<DataSourceItem> {
    return this.prisma.data_sources.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        base_url: dto.base_url,
        reliability: dto.reliability ?? 50,
        crawl_config: this.toJson(dto.crawl_config ?? {}),
        is_active: dto.is_active ?? true,
      },
      select: DATA_SOURCE_SELECT,
    });
  }

  async updateSource(
    id: string,
    dto: UpdateDataSourceDto,
  ): Promise<DataSourceItem> {
    await this.ensureSource(id);

    return this.prisma.data_sources.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.base_url !== undefined && { base_url: dto.base_url }),
        ...(dto.reliability !== undefined && { reliability: dto.reliability }),
        ...(dto.crawl_config !== undefined && {
          crawl_config: this.toJson(dto.crawl_config),
        }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      },
      select: DATA_SOURCE_SELECT,
    });
  }

  async listRawPages(query: QueryRawPagesDto): Promise<RawPageListResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildRawPageWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.raw_pages.findMany({
        where,
        select: RAW_PAGE_SELECT,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: this.buildRawPageOrderBy(query),
      }),
      this.prisma.raw_pages.count({ where }),
    ]);

    return {
      data: items,
      meta: createPaginationMeta(total, page, pageSize),
    };
  }

  async getRawPage(id: string): Promise<RawPageItem> {
    const rawPage = await this.prisma.raw_pages.findUnique({
      where: { id },
      select: RAW_PAGE_SELECT,
    });

    if (!rawPage) {
      throw new NotFoundException(`Raw page ${id} not found`);
    }

    return rawPage;
  }

  async upsertRawPage(dto: CreateRawPageDto): Promise<RawPageItem> {
    await this.ensureSource(dto.source_id);

    return this.prisma.raw_pages.upsert({
      where: { url: dto.url },
      update: {
        source_id: dto.source_id,
        raw_html: dto.raw_html,
        raw_text: dto.raw_text,
        parsed_data:
          dto.parsed_data === undefined ? undefined : this.toJson(dto.parsed_data),
        status: dto.status ?? "pending",
        device_model_id: dto.device_model_id,
        error_message: null,
        attempts: { increment: 1 },
        crawled_at: new Date(),
        parsed_at: dto.parsed_data ? new Date() : undefined,
      },
      create: {
        source_id: dto.source_id,
        url: dto.url,
        raw_html: dto.raw_html,
        raw_text: dto.raw_text,
        parsed_data:
          dto.parsed_data === undefined ? undefined : this.toJson(dto.parsed_data),
        status: dto.status ?? "pending",
        device_model_id: dto.device_model_id,
        parsed_at: dto.parsed_data ? new Date() : undefined,
      },
      select: RAW_PAGE_SELECT,
    });
  }

  async reviewRawPage(
    id: string,
    dto: ReviewRawPageDto,
  ): Promise<RawPageItem> {
    await this.getRawPage(id);

    return this.prisma.raw_pages.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.parsed_data !== undefined && {
          parsed_data: this.toJson(dto.parsed_data),
        }),
        ...(dto.device_model_id !== undefined && {
          device_model_id: dto.device_model_id,
        }),
        error_message: dto.error_message,
        parsed_at: ["parsed", "approved"].includes(dto.status)
          ? new Date()
          : undefined,
      },
      select: RAW_PAGE_SELECT,
    });
  }

  private async ensureSource(id: string) {
    const source = await this.prisma.data_sources.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!source) {
      throw new NotFoundException(`Data source ${id} not found`);
    }
  }

  private buildRawPageWhere(
    query: QueryRawPagesDto,
  ): Prisma.raw_pagesWhereInput {
    const q = query.q?.trim();

    return {
      ...(query.status && { status: query.status }),
      ...(query.source_id && { source_id: query.source_id }),
      ...(query.device_model_id && { device_model_id: query.device_model_id }),
      ...(q && {
        OR: [
          { url: { contains: q, mode: "insensitive" } },
          { raw_text: { contains: q, mode: "insensitive" } },
          { error_message: { contains: q, mode: "insensitive" } },
          { source: { name: { contains: q, mode: "insensitive" } } },
          { device_model: { name: { contains: q, mode: "insensitive" } } },
        ],
      }),
    };
  }

  private buildRawPageOrderBy(
    query: QueryRawPagesDto,
  ): Prisma.raw_pagesOrderByWithRelationInput[] {
    const allowedSortFields = new Set([
      "status",
      "attempts",
      "crawled_at",
      "parsed_at",
    ]);
    const explicitSortBy =
      query.sortBy && allowedSortFields.has(query.sortBy)
        ? query.sortBy
        : undefined;

    if (explicitSortBy) {
      return [{ [explicitSortBy]: query.sortOrder ?? "desc" }];
    }

    return [{ crawled_at: "desc" }];
  }

  private toJson(value: Record<string, unknown>): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }
}
