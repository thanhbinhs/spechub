import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@spechub/database";
import {
  createPaginationMeta,
  type PaginationMeta,
} from "../../common/dto/pagination.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { QueryChipsetsDto } from "./dto/query-chipsets.dto";

const CHIPSET_SELECT = {
  id: true,
  manufacturer_org_id: true,
  technology_family_id: true,
  process_node_id: true,
  chip_kind: true,
  name: true,
  slug: true,
  model_code: true,
  supports_64bit: true,
  integrated_5g: true,
  integrated_wifi: true,
  max_ram_gb: true,
  max_display_resolution: true,
  max_camera_mp: true,
  announcement_date: true,
  release_date: true,
  description: true,
  created_at: true,
  updated_at: true,
  manufacturer: {
    select: {
      id: true,
      name: true,
      slug: true,
      short_name: true,
      logo_url: true,
    },
  },
  technology_family: {
    select: {
      id: true,
      name: true,
      slug: true,
      family_type: true,
    },
  },
  process_node: {
    select: {
      id: true,
      name: true,
      slug: true,
      marketing_name: true,
      node_nm: true,
      release_year: true,
    },
  },
  _count: {
    select: {
      variant_chipsets: true,
    },
  },
} satisfies Prisma.chipsetsSelect;

export type ChipsetItem = Prisma.chipsetsGetPayload<{
  select: typeof CHIPSET_SELECT;
}>;

export type ChipsetListResult = {
  data: ChipsetItem[];
  meta: PaginationMeta;
};

@Injectable()
export class ChipsetsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: QueryChipsetsDto): Promise<ChipsetListResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.chipsets.findMany({
        where,
        select: CHIPSET_SELECT,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: this.buildOrderBy(query),
      }),
      this.prisma.chipsets.count({ where }),
    ]);

    return {
      data: items,
      meta: createPaginationMeta(total, page, pageSize),
    };
  }

  async findBySlug(slug: string): Promise<ChipsetItem> {
    const chipset = await this.prisma.chipsets.findFirst({
      where: { slug, deleted_at: null },
      select: CHIPSET_SELECT,
    });

    if (!chipset) {
      throw new NotFoundException(`Chipset ${slug} not found`);
    }

    return chipset;
  }

  async findById(id: string): Promise<ChipsetItem> {
    const chipset = await this.prisma.chipsets.findFirst({
      where: { id, deleted_at: null },
      select: CHIPSET_SELECT,
    });

    if (!chipset) {
      throw new NotFoundException(`Chipset ${id} not found`);
    }

    return chipset;
  }

  private buildWhere(query: QueryChipsetsDto): Prisma.chipsetsWhereInput {
    const q = query.q?.trim();

    return {
      deleted_at: null,
      ...(query.chip_kind && { chip_kind: query.chip_kind }),
      ...(query.manufacturer_slug && {
        manufacturer: {
          slug: query.manufacturer_slug,
          deleted_at: null,
        },
      }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { model_code: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      }),
    };
  }

  private buildOrderBy(
    query: QueryChipsetsDto,
  ): Prisma.chipsetsOrderByWithRelationInput[] {
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
      return [{ [explicitSortBy]: query.sortOrder ?? "asc" }];
    }

    return [{ release_date: "desc" }, { name: "asc" }];
  }
}
