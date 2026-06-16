import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@spechub/database";
import {
  createPaginationMeta,
  type PaginationMeta,
} from "../../common/dto/pagination.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { QueryCameraModulesDto } from "./dto/query-camera-modules.dto";

const CAMERA_MODULE_SELECT = {
  id: true,
  manufacturer_org_id: true,
  camera_role_id: true,
  name: true,
  slug: true,
  effective_megapixel: true,
  aperture: true,
  focal_length_mm_eq: true,
  focal_length_mm_native: true,
  optical_zoom: true,
  digital_zoom_max: true,
  has_ois: true,
  ois_type: true,
  has_af: true,
  af_system: true,
  field_of_view_deg: true,
  video_capabilities: true,
  has_macro: true,
  description: true,
  manufacturer: {
    select: {
      id: true,
      name: true,
      slug: true,
      short_name: true,
    },
  },
  camera_role: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
  camera_module_sensor_links: {
    select: {
      is_primary: true,
      camera_sensor: {
        select: {
          id: true,
          name: true,
          slug: true,
          sensor_format: true,
          optical_format: true,
          resolution_mp: true,
          pixel_size_um: true,
          sensor_type: true,
          manufacturer: {
            select: {
              id: true,
              name: true,
              slug: true,
              short_name: true,
            },
          },
        },
      },
    },
    orderBy: [{ is_primary: "desc" as const }],
  },
} satisfies Prisma.camera_modulesSelect;

export type CameraModuleItem = Prisma.camera_modulesGetPayload<{
  select: typeof CAMERA_MODULE_SELECT;
}>;

export type CameraModuleListResult = {
  data: CameraModuleItem[];
  meta: PaginationMeta;
};

@Injectable()
export class CameraModulesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    query: QueryCameraModulesDto,
  ): Promise<CameraModuleListResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.camera_modules.findMany({
        where,
        select: CAMERA_MODULE_SELECT,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: this.buildOrderBy(query),
      }),
      this.prisma.camera_modules.count({ where }),
    ]);

    return {
      data: items,
      meta: createPaginationMeta(total, page, pageSize),
    };
  }

  async findBySlug(slug: string): Promise<CameraModuleItem> {
    const cameraModule = await this.prisma.camera_modules.findFirst({
      where: { slug },
      select: CAMERA_MODULE_SELECT,
    });

    if (!cameraModule) {
      throw new NotFoundException(`Camera module ${slug} not found`);
    }

    return cameraModule;
  }

  async findById(id: string): Promise<CameraModuleItem> {
    const cameraModule = await this.prisma.camera_modules.findFirst({
      where: { id },
      select: CAMERA_MODULE_SELECT,
    });

    if (!cameraModule) {
      throw new NotFoundException(`Camera module ${id} not found`);
    }

    return cameraModule;
  }

  private buildWhere(
    query: QueryCameraModulesDto,
  ): Prisma.camera_modulesWhereInput {
    const q = query.q?.trim();

    return {
      ...(query.role_code && {
        camera_role: { code: query.role_code },
      }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { aperture: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { video_capabilities: { contains: q, mode: "insensitive" } },
        ],
      }),
    };
  }

  private buildOrderBy(
    query: QueryCameraModulesDto,
  ): Prisma.camera_modulesOrderByWithRelationInput[] {
    const allowedSortFields = new Set([
      "name",
      "effective_megapixel",
      "focal_length_mm_eq",
      "optical_zoom",
    ]);
    const explicitSortBy =
      query.sortBy && allowedSortFields.has(query.sortBy)
        ? query.sortBy
        : undefined;

    if (explicitSortBy) {
      return [{ [explicitSortBy]: query.sortOrder ?? "desc" }];
    }

    return [{ effective_megapixel: "desc" }, { name: "asc" }];
  }
}
