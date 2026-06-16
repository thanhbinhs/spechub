import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@spechub/database";
import {
  createPaginationMeta,
  type PaginationMeta,
} from "../../common/dto/pagination.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { QueryBatteryUnitsDto } from "./dto/query-battery-units.dto";

const BATTERY_UNIT_SELECT = {
  id: true,
  manufacturer_org_id: true,
  battery_chemistry_id: true,
  name: true,
  slug: true,
  capacity_mah: true,
  rated_capacity_mah: true,
  energy_wh: true,
  voltage_nominal_v: true,
  cell_count: true,
  cycle_life: true,
  wired_charging_w: true,
  wired_charging_protocol: true,
  wireless_charging_w: true,
  wireless_charging_protocol: true,
  reverse_wired_charging_w: true,
  reverse_wireless_charging_w: true,
  removable: true,
  description: true,
  manufacturer: {
    select: {
      id: true,
      name: true,
      slug: true,
      short_name: true,
    },
  },
  battery_chemistry: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} satisfies Prisma.battery_unitsSelect;

export type BatteryUnitItem = Prisma.battery_unitsGetPayload<{
  select: typeof BATTERY_UNIT_SELECT;
}>;

export type BatteryUnitListResult = {
  data: BatteryUnitItem[];
  meta: PaginationMeta;
};

@Injectable()
export class BatteryUnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: QueryBatteryUnitsDto): Promise<BatteryUnitListResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.battery_units.findMany({
        where,
        select: BATTERY_UNIT_SELECT,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: this.buildOrderBy(query),
      }),
      this.prisma.battery_units.count({ where }),
    ]);

    return {
      data: items,
      meta: createPaginationMeta(total, page, pageSize),
    };
  }

  async findBySlug(slug: string): Promise<BatteryUnitItem> {
    const battery = await this.prisma.battery_units.findFirst({
      where: { slug },
      select: BATTERY_UNIT_SELECT,
    });

    if (!battery) {
      throw new NotFoundException(`Battery unit ${slug} not found`);
    }

    return battery;
  }

  async findById(id: string): Promise<BatteryUnitItem> {
    const battery = await this.prisma.battery_units.findFirst({
      where: { id },
      select: BATTERY_UNIT_SELECT,
    });

    if (!battery) {
      throw new NotFoundException(`Battery unit ${id} not found`);
    }

    return battery;
  }

  private buildWhere(
    query: QueryBatteryUnitsDto,
  ): Prisma.battery_unitsWhereInput {
    const q = query.q?.trim();
    const numericQ = q ? Number.parseInt(q, 10) : undefined;

    return {
      ...(query.chemistry_slug && {
        battery_chemistry: { slug: query.chemistry_slug },
      }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { wired_charging_protocol: { contains: q, mode: "insensitive" } },
          { wireless_charging_protocol: { contains: q, mode: "insensitive" } },
          ...(!Number.isNaN(numericQ) && numericQ
            ? [{ capacity_mah: { equals: numericQ } }]
            : []),
        ],
      }),
    };
  }

  private buildOrderBy(
    query: QueryBatteryUnitsDto,
  ): Prisma.battery_unitsOrderByWithRelationInput[] {
    const allowedSortFields = new Set([
      "capacity_mah",
      "wired_charging_w",
      "wireless_charging_w",
      "name",
    ]);
    const explicitSortBy =
      query.sortBy && allowedSortFields.has(query.sortBy)
        ? query.sortBy
        : undefined;

    if (explicitSortBy) {
      return [{ [explicitSortBy]: query.sortOrder ?? "desc" }];
    }

    return [{ capacity_mah: "desc" }, { wired_charging_w: "desc" }];
  }
}
