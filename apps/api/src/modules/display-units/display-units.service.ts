import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@spechub/database";
import {
  createPaginationMeta,
  type PaginationMeta,
} from "../../common/dto/pagination.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { QueryDisplayUnitsDto } from "./dto/query-display-units.dto";

const DISPLAY_UNIT_SELECT = {
  id: true,
  manufacturer_org_id: true,
  display_technology_id: true,
  name: true,
  slug: true,
  size_inch: true,
  aspect_ratio: true,
  resolution_width: true,
  resolution_height: true,
  pixel_density_ppi: true,
  refresh_rate_hz: true,
  refresh_rate_min_hz: true,
  touch_sampling_hz: true,
  brightness_typical_nits: true,
  brightness_hbm_nits: true,
  brightness_peak_nits: true,
  contrast_ratio: true,
  color_depth_bits: true,
  color_gamut: true,
  hdr_formats: true,
  protection_glass: true,
  has_always_on: true,
  has_dc_dimming: true,
  pwm_frequency_hz: true,
  description: true,
  manufacturer: {
    select: {
      id: true,
      name: true,
      slug: true,
      short_name: true,
    },
  },
  display_technology: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.display_unitsSelect;

export type DisplayUnitItem = Prisma.display_unitsGetPayload<{
  select: typeof DISPLAY_UNIT_SELECT;
}>;

export type DisplayUnitListResult = {
  data: DisplayUnitItem[];
  meta: PaginationMeta;
};

@Injectable()
export class DisplayUnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: QueryDisplayUnitsDto): Promise<DisplayUnitListResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.display_units.findMany({
        where,
        select: DISPLAY_UNIT_SELECT,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: this.buildOrderBy(query),
      }),
      this.prisma.display_units.count({ where }),
    ]);

    return {
      data: items,
      meta: createPaginationMeta(total, page, pageSize),
    };
  }

  async findBySlug(slug: string): Promise<DisplayUnitItem> {
    const display = await this.prisma.display_units.findFirst({
      where: { slug },
      select: DISPLAY_UNIT_SELECT,
    });

    if (!display) {
      throw new NotFoundException(`Display unit ${slug} not found`);
    }

    return display;
  }

  async findById(id: string): Promise<DisplayUnitItem> {
    const display = await this.prisma.display_units.findFirst({
      where: { id },
      select: DISPLAY_UNIT_SELECT,
    });

    if (!display) {
      throw new NotFoundException(`Display unit ${id} not found`);
    }

    return display;
  }

  private buildWhere(
    query: QueryDisplayUnitsDto,
  ): Prisma.display_unitsWhereInput {
    const q = query.q?.trim();

    return {
      ...(query.technology_slug && {
        display_technology: { slug: query.technology_slug },
      }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { hdr_formats: { contains: q, mode: "insensitive" } },
        ],
      }),
    };
  }

  private buildOrderBy(
    query: QueryDisplayUnitsDto,
  ): Prisma.display_unitsOrderByWithRelationInput[] {
    const allowedSortFields = new Set([
      "name",
      "size_inch",
      "refresh_rate_hz",
      "brightness_peak_nits",
    ]);
    const explicitSortBy =
      query.sortBy && allowedSortFields.has(query.sortBy)
        ? query.sortBy
        : undefined;

    if (explicitSortBy) {
      return [{ [explicitSortBy]: query.sortOrder ?? "desc" }];
    }

    return [{ size_inch: "desc" }, { name: "asc" }];
  }
}
