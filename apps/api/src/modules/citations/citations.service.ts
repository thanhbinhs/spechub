import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@spechub/database";
import {
  createPaginationMeta,
  type PaginationMeta,
} from "../../common/dto/pagination.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCitationDto } from "./dto/create-citation.dto";
import { CreateSourceDto } from "./dto/create-source.dto";
import { QueryCitationsDto } from "./dto/query-citations.dto";
import { UpdateCitationDto } from "./dto/update-citation.dto";
import { UpdateSourceDto } from "./dto/update-source.dto";

const SOURCE_SELECT = {
  id: true,
  name: true,
  slug: true,
  source_type: true,
  base_url: true,
  trust_level: true,
  description: true,
  created_at: true,
  updated_at: true,
  _count: {
    select: {
      citations: true,
    },
  },
} satisfies Prisma.sourcesSelect;

const CITATION_SELECT = {
  id: true,
  source_id: true,
  url: true,
  title: true,
  author: true,
  published_at: true,
  retrieved_at: true,
  excerpt: true,
  created_at: true,
  source: {
    select: {
      id: true,
      name: true,
      slug: true,
      source_type: true,
      trust_level: true,
    },
  },
} satisfies Prisma.citationsSelect;

export type SourceItem = Prisma.sourcesGetPayload<{
  select: typeof SOURCE_SELECT;
}>;

export type CitationItem = Prisma.citationsGetPayload<{
  select: typeof CITATION_SELECT;
}>;

export type CitationListResult = {
  data: CitationItem[];
  meta: PaginationMeta;
};

@Injectable()
export class CitationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listSources(): Promise<{ data: SourceItem[] }> {
    const sources = await this.prisma.sources.findMany({
      select: SOURCE_SELECT,
      orderBy: [{ trust_level: "desc" }, { name: "asc" }],
    });

    return { data: sources };
  }

  async createSource(dto: CreateSourceDto): Promise<SourceItem> {
    return this.prisma.sources.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        source_type: dto.source_type,
        base_url: dto.base_url,
        trust_level: dto.trust_level ?? 3,
        description: dto.description,
      },
      select: SOURCE_SELECT,
    });
  }

  async updateSource(id: string, dto: UpdateSourceDto): Promise<SourceItem> {
    await this.ensureSource(id);

    return this.prisma.sources.update({
      where: { id },
      data: dto,
      select: SOURCE_SELECT,
    });
  }

  async listCitations(query: QueryCitationsDto): Promise<CitationListResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildCitationWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.citations.findMany({
        where,
        select: CITATION_SELECT,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: this.buildCitationOrderBy(query),
      }),
      this.prisma.citations.count({ where }),
    ]);

    return {
      data: items,
      meta: createPaginationMeta(total, page, pageSize),
    };
  }

  async findCitation(id: string): Promise<CitationItem> {
    const citation = await this.prisma.citations.findUnique({
      where: { id },
      select: CITATION_SELECT,
    });

    if (!citation) {
      throw new NotFoundException(`Citation ${id} not found`);
    }

    return citation;
  }

  async createCitation(dto: CreateCitationDto): Promise<CitationItem> {
    await this.ensureSource(dto.source_id);

    return this.prisma.citations.create({
      data: {
        source_id: dto.source_id,
        url: dto.url,
        title: dto.title,
        author: dto.author,
        published_at: dto.published_at,
        retrieved_at: dto.retrieved_at ?? new Date(),
        excerpt: dto.excerpt,
      },
      select: CITATION_SELECT,
    });
  }

  async updateCitation(
    id: string,
    dto: UpdateCitationDto,
  ): Promise<CitationItem> {
    await this.findCitation(id);

    if (dto.source_id) {
      await this.ensureSource(dto.source_id);
    }

    return this.prisma.citations.update({
      where: { id },
      data: dto,
      select: CITATION_SELECT,
    });
  }

  private async ensureSource(id: string) {
    const source = await this.prisma.sources.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!source) {
      throw new NotFoundException(`Source ${id} not found`);
    }
  }

  private buildCitationWhere(
    query: QueryCitationsDto,
  ): Prisma.citationsWhereInput {
    const q = query.q?.trim();

    return {
      ...(query.source_id && { source_id: query.source_id }),
      ...(q && {
        OR: [
          { url: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
          { author: { contains: q, mode: "insensitive" } },
          { excerpt: { contains: q, mode: "insensitive" } },
          { source: { name: { contains: q, mode: "insensitive" } } },
        ],
      }),
    };
  }

  private buildCitationOrderBy(
    query: QueryCitationsDto,
  ): Prisma.citationsOrderByWithRelationInput[] {
    const allowedSortFields = new Set([
      "published_at",
      "retrieved_at",
      "created_at",
      "title",
    ]);
    const explicitSortBy =
      query.sortBy && allowedSortFields.has(query.sortBy)
        ? query.sortBy
        : undefined;

    if (explicitSortBy) {
      return [{ [explicitSortBy]: query.sortOrder ?? "desc" }];
    }

    return [{ published_at: "desc" }, { created_at: "desc" }];
  }
}
