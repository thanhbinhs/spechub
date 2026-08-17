import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@spechub/database";
import {
  normalizeAperture,
  normalizeAspectRatio,
  normalizeChargingProtocol,
  normalizeColorGamut,
  normalizeCoolingType,
  normalizeDisplayTechnology,
  normalizeHdrFormats,
  normalizeHexColor,
  normalizeIngressProtection,
  normalizeSimType,
  normalizeText,
  normalizeVideoCapabilities,
} from "@spechub/utils";
import {
  AUTOMATIC_DEVICE_SCORE_RATIONALE,
  AUTOMATIC_DEVICE_SCORE_VERSION,
  calculateScorecard,
  extractAutomaticDeviceMetrics,
  SCORING_PROFILES,
  type ScoringProfile,
} from "@spechub/scoring-core";
import {
  createPaginationMeta,
  type PaginationMeta,
} from "../../common/dto/pagination.dto";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateDeviceBundleDto } from "./dto/create-device-bundle.dto";
import { CreateDeviceVariantDto } from "./dto/create-device-variant.dto";
import { QueryDeviceVariantsDto } from "./dto/query-device-variants.dto";
import { UpdateDeviceVariantDto } from "./dto/update-device-variant.dto";
import {
  DEVICE_SCORECARD_SELECT,
  DEVICE_VARIANT_BENCHMARK_SELECT,
  DEVICE_VARIANT_COMPONENT_SELECT,
} from "./device-variant-component-select";

const DEVICE_VARIANT_DETAIL_SELECT = {
  id: true,
  device_model_id: true,
  variant_name: true,
  sku_code: true,
  market_name: true,
  color_name: true,
  color_hex: true,
  launch_date: true,
  end_of_sale_date: true,
  launch_price: true,
  is_default: true,
  notes: true,
  created_at: true,
  updated_at: true,
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
  device_model: {
    select: {
      id: true,
      name: true,
      slug: true,
      cover_image_url: true,
      announcement_date: true,
      release_date: true,
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
    },
  },
  ...DEVICE_VARIANT_COMPONENT_SELECT,
} satisfies Prisma.device_variantsSelect;

const DEVICE_VARIANT_LIST_SELECT = {
  id: true,
  device_model_id: true,
  variant_name: true,
  sku_code: true,
  market_name: true,
  color_name: true,
  color_hex: true,
  launch_date: true,
  launch_price: true,
  is_default: true,
  created_at: true,
  updated_at: true,
  currency: DEVICE_VARIANT_DETAIL_SELECT.currency,
  release_status: DEVICE_VARIANT_DETAIL_SELECT.release_status,
  device_model: DEVICE_VARIANT_DETAIL_SELECT.device_model,
  device_variant_benchmarks: {
    select: DEVICE_VARIANT_BENCHMARK_SELECT,
    orderBy: [{ benchmark: { name: "asc" as const } }],
  },
  variant_scorecards: {
    select: DEVICE_SCORECARD_SELECT,
    orderBy: [{ calculated_at: "desc" as const }],
    take: 1,
  },
} satisfies Prisma.device_variantsSelect;

const CREATED_DEVICE_MODEL_SELECT = {
  id: true,
  product_family_id: true,
  name: true,
  slug: true,
  release_status_id: true,
  summary: true,
  description: true,
  cover_image_url: true,
  aliases: {
    select: {
      alias: true,
      alias_type: true,
      normalized_alias: true,
      region_code: true,
    },
  },
  editorial_sections: {
    select: {
      section_key: true,
      title: true,
      body_markdown: true,
      display_order: true,
      is_published: true,
    },
    orderBy: { display_order: "asc" as const },
  },
} satisfies Prisma.device_modelsSelect;

export type DeviceVariantListItem = Prisma.device_variantsGetPayload<{
  select: typeof DEVICE_VARIANT_LIST_SELECT;
}>;

export type DeviceVariantDetail = Prisma.device_variantsGetPayload<{
  select: typeof DEVICE_VARIANT_DETAIL_SELECT;
}>;

export type DeviceVariantListResult = {
  data: DeviceVariantListItem[];
  meta: PaginationMeta;
};

@Injectable()
export class DeviceVariantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    query: QueryDeviceVariantsDto,
  ): Promise<DeviceVariantListResult> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = this.buildWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.device_variants.findMany({
        where,
        select: DEVICE_VARIANT_LIST_SELECT,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: this.buildOrderBy(query),
      }),
      this.prisma.device_variants.count({ where }),
    ]);

    return {
      data: items,
      meta: createPaginationMeta(total, page, pageSize),
    };
  }

  async findById(id: string): Promise<DeviceVariantDetail> {
    const variant = await this.prisma.device_variants.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      select: DEVICE_VARIANT_DETAIL_SELECT,
    });

    if (!variant) {
      throw new NotFoundException(`Device variant ${id} not found`);
    }

    return variant;
  }

  async listCurrencies() {
    return this.prisma.currencies.findMany({
      select: { id: true, code: true, symbol: true, decimal_digits: true },
      orderBy: { code: "asc" },
    });
  }

  async listBenchmarks() {
    return this.prisma.benchmarks.findMany({
      where: {
        target_type: "device_variant",
        benchmark_type: { notIn: ["cpu", "gpu", "npu", "system"] },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        benchmark_type: true,
        target_type: true,
        version: true,
        higher_is_better: true,
        unit: { select: { name: true, symbol: true } },
      },
      orderBy: [{ benchmark_type: "asc" }, { name: "asc" }],
    });
  }

  async listScoringProfiles() {
    const configured = await this.prisma.scoring_profiles.findMany({
      where: {
        status: "published",
        effective_from: { lte: new Date() },
      },
      select: {
        name: true,
        version: true,
        device_category: { select: { slug: true } },
        modules: {
          select: {
            module_key: true,
            label: true,
            description: true,
            weight_percent: true,
            display_order: true,
            metrics: {
              select: {
                metric_key: true,
                label: true,
                weight_percent: true,
                min_value: true,
                max_value: true,
                direction: true,
                scale: true,
                display_order: true,
              },
              orderBy: { display_order: "asc" },
            },
          },
          orderBy: { display_order: "asc" },
        },
      },
      orderBy: { version: "desc" },
    });
    const profiles = new Map(
      Object.values(SCORING_PROFILES).map((profile) => [
        profile.categorySlug,
        profile,
      ]),
    );
    for (const record of configured.reverse()) {
      profiles.set(
        record.device_category.slug,
        this.configuredScoringProfile(record),
      );
    }
    return [...profiles.values()];
  }

  async create(dto: CreateDeviceVariantDto): Promise<DeviceVariantDetail> {
    const normalizedDto = this.normalizeVariantInput(dto);
    await this.validateScoreMetricInputs(
      normalizedDto.device_model_id,
      normalizedDto.score_metric_inputs,
    );
    const createdId = await this.prisma.$transaction(async (tx) => {
      const created = await this.createInTransaction(tx, normalizedDto);
      await this.recalculateAutomaticScorecard(created.id, tx);
      return created.id;
    });
    return this.findById(createdId);
  }

  async createWithDeviceModel(
    dto: CreateDeviceBundleDto,
    actorUserId?: string,
  ) {
    const normalizedDto = {
      ...dto,
      model: this.normalizeDeviceModelInput(dto.model),
      variant: this.normalizeVariantInput(dto.variant),
    };
    const { aliases, editorial_sections, ...modelData } = normalizedDto.model;
    this.assertUniqueModelAliases(aliases);

    const created = await this.prisma.$transaction(async (tx) => {
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
        select: CREATED_DEVICE_MODEL_SELECT,
      });
      const variantDto: CreateDeviceVariantDto = {
        ...normalizedDto.variant,
        device_model_id: model.id,
        is_default: normalizedDto.variant.is_default ?? true,
      };
      await this.validateScoreMetricInputs(
        model.id,
        variantDto.score_metric_inputs,
        tx,
      );
      const variant = await this.createInTransaction(tx, variantDto);
      await this.recalculateAutomaticScorecard(variant.id, tx);
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
      return { model, variant };
    });

    return {
      ...created,
      variant: await this.findById(created.variant.id),
    };
  }

  private async createInTransaction(
    tx: Prisma.TransactionClient,
    dto: CreateDeviceVariantDto,
  ): Promise<DeviceVariantDetail> {
    const {
      physical_specs,
      io_specs,
      thermal_specs,
      software_profile,
      connectivity_support,
      hardware_components,
      inline_modules,
      module_scores,
      score_metric_inputs,
      performance_results,
      ...variantData
    } = dto;
    if (dto.is_default) {
      await tx.device_variants.updateMany({
        where: {
          device_model_id: dto.device_model_id,
          deleted_at: null,
        },
        data: { is_default: false },
      });
    }
    const inlineHardware = await this.createInlineHardwareComponents(
      tx,
      dto.variant_name,
      inline_modules,
    );
    const resolvedHardware = this.mergeHardwareComponents(
      hardware_components,
      inlineHardware,
    );
    const variant = await tx.device_variants.create({
      data: {
        ...variantData,
        is_default: dto.is_default ?? false,
        ...(physical_specs && {
          variant_physical_specs: { create: physical_specs },
        }),
        ...(io_specs && { variant_io_specs: { create: io_specs } }),
        ...(thermal_specs && {
          variant_thermal_specs: { create: thermal_specs },
        }),
        ...(software_profile && {
          software_profile: { create: software_profile },
        }),
        ...(connectivity_support !== undefined && {
          connectivity_support: {
            create: connectivity_support.map((item) => ({
              connectivity_feature_id: item.connectivity_feature_id,
              version: item.version?.trim() || null,
              is_supported: item.is_supported ?? true,
              notes: item.notes?.trim() || null,
            })),
          },
        }),
        ...this.hardwareComponentCreates(resolvedHardware),
        ...(module_scores?.length && {
          variant_module_scores: {
            create: this.moduleScoreCreates(module_scores),
          },
        }),
        ...(score_metric_inputs?.length && {
          variant_score_metric_inputs: {
            create: this.scoreMetricInputCreates(score_metric_inputs),
          },
        }),
        ...(performance_results?.length && {
          device_variant_benchmarks: {
            create: performance_results.map((result) =>
              this.performanceResultCreate(result),
            ),
          },
        }),
      },
      select: DEVICE_VARIANT_DETAIL_SELECT,
    });
    await this.replaceCameraSystems(tx, variant.id, resolvedHardware?.cameras);
    return resolvedHardware?.cameras !== undefined
      ? tx.device_variants.findUniqueOrThrow({
          where: { id: variant.id },
          select: DEVICE_VARIANT_DETAIL_SELECT,
        })
      : variant;
  }

  async update(
    id: string,
    dto: UpdateDeviceVariantDto,
  ): Promise<DeviceVariantDetail> {
    const current = await this.findById(id);
    const normalizedDto = this.normalizeVariantInput(dto);
    const {
      physical_specs,
      io_specs,
      thermal_specs,
      software_profile,
      connectivity_support,
      hardware_components,
      inline_modules,
      module_scores,
      score_metric_inputs,
      performance_results,
      ...variantData
    } = normalizedDto;
    const deviceModelId =
      normalizedDto.device_model_id ?? current.device_model_id;
    await this.validateScoreMetricInputs(deviceModelId, score_metric_inputs);

    const obsoleteRunIds =
      performance_results === undefined
        ? []
        : (current.device_variant_benchmarks ?? [])
            .map((result) => result.benchmark_run?.id)
            .filter((runId): runId is string => Boolean(runId));
    const updated = await this.prisma.$transaction(async (tx) => {
      if (normalizedDto.is_default) {
        await tx.device_variants.updateMany({
          where: {
            device_model_id: deviceModelId,
            id: { not: id },
            deleted_at: null,
          },
          data: { is_default: false },
        });
      }
      const inlineHardware = await this.createInlineHardwareComponents(
        tx,
        normalizedDto.variant_name ?? current.variant_name,
        inline_modules,
      );
      const resolvedHardware = this.mergeHardwareComponents(
        hardware_components,
        inlineHardware,
      );
      const saved = await tx.device_variants.update({
        where: { id },
        data: {
          ...variantData,
          ...(physical_specs && {
            variant_physical_specs: {
              upsert: { create: physical_specs, update: physical_specs },
            },
          }),
          ...(io_specs && {
            variant_io_specs: {
              upsert: { create: io_specs, update: io_specs },
            },
          }),
          ...(thermal_specs && {
            variant_thermal_specs: {
              upsert: { create: thermal_specs, update: thermal_specs },
            },
          }),
          ...(software_profile !== undefined && {
            software_profile: {
              upsert: {
                create: software_profile,
                update: software_profile,
              },
            },
          }),
          ...(connectivity_support !== undefined && {
            connectivity_support: {
              deleteMany: {},
              create: connectivity_support.map((item) => ({
                connectivity_feature_id: item.connectivity_feature_id,
                version: item.version?.trim() || null,
                is_supported: item.is_supported ?? true,
                notes: item.notes?.trim() || null,
              })),
            },
          }),
          ...this.hardwareComponentUpdates(resolvedHardware),
          ...(module_scores !== undefined && {
            variant_module_scores: {
              deleteMany: {},
              ...(module_scores?.length && {
                create: this.moduleScoreCreates(module_scores),
              }),
            },
          }),
          ...(score_metric_inputs !== undefined && {
            variant_score_metric_inputs: {
              deleteMany: {},
              ...(score_metric_inputs.length && {
                create: this.scoreMetricInputCreates(score_metric_inputs),
              }),
            },
          }),
          ...(performance_results !== undefined && {
            device_variant_benchmarks: {
              deleteMany: {},
              ...(performance_results.length && {
                create: performance_results.map((result) =>
                  this.performanceResultCreate(result),
                ),
              }),
            },
          }),
        },
        select: DEVICE_VARIANT_DETAIL_SELECT,
      });
      if (obsoleteRunIds.length) {
        await tx.benchmark_runs.deleteMany({
          where: {
            id: { in: obsoleteRunIds },
            device_variant_benchmarks: { none: {} },
            chipset_benchmarks: { none: {} },
            cpu_benchmarks: { none: {} },
            gpu_benchmarks: { none: {} },
            npu_benchmarks: { none: {} },
          },
        });
      }
      await this.replaceCameraSystems(tx, id, resolvedHardware?.cameras);
      const result =
        resolvedHardware?.cameras !== undefined
          ? tx.device_variants.findUniqueOrThrow({
              where: { id },
              select: DEVICE_VARIANT_DETAIL_SELECT,
            })
          : saved;
      await this.recalculateAutomaticScorecard(id, tx);
      return result;
    });
    return this.findById(updated.id);
  }

  async remove(id: string): Promise<DeviceVariantDetail> {
    await this.findById(id);

    return this.prisma.device_variants.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
      select: DEVICE_VARIANT_DETAIL_SELECT,
    });
  }

  async compare(ids: string[]): Promise<{ data: DeviceVariantDetail[] }> {
    const uniqueIds = [...new Set(ids)];

    if (uniqueIds.length < 2 || uniqueIds.length > 4) {
      throw new BadRequestException(
        "Compare requires 2 to 4 unique variant IDs",
      );
    }

    const variants = await this.prisma.device_variants.findMany({
      where: {
        id: { in: uniqueIds },
        deleted_at: null,
      },
      select: DEVICE_VARIANT_DETAIL_SELECT,
    });

    if (variants.length !== uniqueIds.length) {
      throw new NotFoundException("One or more device variants were not found");
    }

    const byId = new Map(variants.map((variant) => [variant.id, variant]));
    return {
      data: uniqueIds.map((id) => byId.get(id)!),
    };
  }

  private buildWhere(
    query: QueryDeviceVariantsDto,
  ): Prisma.device_variantsWhereInput {
    const q = query.q?.trim();

    return {
      deleted_at: null,
      ...(query.default_only && { is_default: true }),
      ...(query.device_model_id && { device_model_id: query.device_model_id }),
      ...(query.model_slug && {
        device_model: {
          slug: query.model_slug,
          deleted_at: null,
        },
      }),
      ...(q && {
        OR: [
          { variant_name: { contains: q, mode: "insensitive" } },
          { market_name: { contains: q, mode: "insensitive" } },
          { sku_code: { contains: q, mode: "insensitive" } },
          { color_name: { contains: q, mode: "insensitive" } },
          {
            device_model: {
              deleted_at: null,
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { slug: { contains: q, mode: "insensitive" } },
              ],
            },
          },
          {
            variant_chipsets: {
              some: {
                chipset: {
                  deleted_at: null,
                  OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { model_code: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            },
          },
        ],
      }),
    };
  }

  private performanceResultCreate(
    result: NonNullable<CreateDeviceVariantDto["performance_results"]>[number],
  ): Prisma.device_variant_benchmarksCreateWithoutDevice_variantInput {
    const {
      benchmark_id,
      score,
      subscore_name,
      source_id,
      tested_at,
      test_environment_note,
      ambient_temp_c,
      os_version,
      app_version,
      power_mode,
      is_thermal_throttled,
    } = result;
    const hasRunContext = [
      test_environment_note,
      ambient_temp_c,
      os_version,
      app_version,
      power_mode,
      is_thermal_throttled,
    ].some((value) => value !== undefined && value !== null && value !== "");

    if (!hasRunContext) {
      return {
        benchmark: { connect: { id: benchmark_id } },
        score,
        subscore_name,
        ...(source_id && { source: { connect: { id: source_id } } }),
        tested_at,
      };
    }

    return {
      benchmark: { connect: { id: benchmark_id } },
      score,
      subscore_name,
      ...(source_id && { source: { connect: { id: source_id } } }),
      tested_at,
      benchmark_run: {
        create: {
          benchmark_id,
          source_id,
          tested_at,
          test_environment_note,
          ambient_temp_c,
          os_version,
          app_version,
          power_mode,
          is_thermal_throttled,
        },
      },
    };
  }

  private mergeHardwareComponents(
    components: CreateDeviceVariantDto["hardware_components"],
    inlineComponents: CreateDeviceVariantDto["hardware_components"],
  ): CreateDeviceVariantDto["hardware_components"] {
    if (!components && !inlineComponents) return undefined;
    return {
      ...components,
      ...(inlineComponents?.displays !== undefined && {
        displays: inlineComponents.displays,
      }),
      ...(inlineComponents?.batteries !== undefined && {
        batteries: inlineComponents.batteries,
      }),
      ...(inlineComponents?.cameras !== undefined && {
        cameras: inlineComponents.cameras,
      }),
    };
  }

  /**
   * The variant endpoint is shared by Catalog Studio, the administrator form,
   * imports, and third-party clients.  Canonicalize free-form specs here so
   * each route writes the same representation to the catalog.
   */
  private normalizeVariantInput<
    T extends CreateDeviceVariantDto | UpdateDeviceVariantDto,
  >(dto: T): T {
    const display = dto.inline_modules?.display;
    const battery = dto.inline_modules?.battery;

    return {
      ...dto,
      variant_name: dto.variant_name
        ? normalizeText(dto.variant_name)
        : dto.variant_name,
      sku_code: normalizeText(dto.sku_code),
      market_name: normalizeText(dto.market_name),
      color_name: normalizeText(dto.color_name),
      color_hex: normalizeHexColor(dto.color_hex),
      notes: normalizeText(dto.notes),
      physical_specs: dto.physical_specs && {
        ...dto.physical_specs,
        frame_material: normalizeText(dto.physical_specs.frame_material),
        back_material: normalizeText(dto.physical_specs.back_material),
        front_glass: normalizeText(dto.physical_specs.front_glass),
        ingress_protection: normalizeIngressProtection(
          dto.physical_specs.ingress_protection,
        ),
        notes: normalizeText(dto.physical_specs.notes),
      },
      io_specs: dto.io_specs && {
        ...dto.io_specs,
        sim_type: normalizeSimType(dto.io_specs.sim_type),
        audio_brand_tuning: normalizeText(dto.io_specs.audio_brand_tuning),
        notes: normalizeText(dto.io_specs.notes),
      },
      thermal_specs: dto.thermal_specs && {
        ...dto.thermal_specs,
        cooling_type: normalizeCoolingType(dto.thermal_specs.cooling_type),
        notes: normalizeText(dto.thermal_specs.notes),
      },
      software_profile: dto.software_profile && {
        ...dto.software_profile,
        notes: normalizeText(dto.software_profile.notes),
      },
      connectivity_support: dto.connectivity_support?.map((item) => ({
        ...item,
        version: normalizeText(item.version),
        notes: normalizeText(item.notes),
      })),
      inline_modules: dto.inline_modules && {
        ...dto.inline_modules,
        display: display && {
          ...display,
          technology:
            normalizeDisplayTechnology(display.technology) ??
            display.technology,
          aspect_ratio: normalizeAspectRatio(display.aspect_ratio),
          ltpo_version: normalizeText(display.ltpo_version),
          color_gamut: normalizeColorGamut(display.color_gamut),
          hdr_formats: normalizeHdrFormats(display.hdr_formats),
          protection_glass: normalizeText(display.protection_glass),
        },
        cameras: dto.inline_modules.cameras?.map((camera) => ({
          ...camera,
          aperture: normalizeAperture(camera.aperture),
          video_capabilities: normalizeVideoCapabilities(
            camera.video_capabilities,
          ),
        })),
        battery: battery && {
          ...battery,
          wired_charging_protocol: normalizeChargingProtocol(
            battery.wired_charging_protocol,
          ),
          wireless_charging_protocol: normalizeChargingProtocol(
            battery.wireless_charging_protocol,
          ),
        },
      },
    } as T;
  }

  private normalizeDeviceModelInput(dto: CreateDeviceBundleDto["model"]) {
    return {
      ...dto,
      name: normalizeText(dto.name) ?? dto.name,
      slug: dto.slug.trim().toLowerCase(),
      internal_codename: normalizeText(dto.internal_codename),
      generation_label: normalizeText(dto.generation_label),
      summary: normalizeText(dto.summary) ?? dto.summary,
      description: dto.description.trim(),
      cover_image_url: normalizeText(dto.cover_image_url),
      aliases: dto.aliases?.map((alias) => ({
        ...alias,
        alias: normalizeText(alias.alias) ?? alias.alias,
        alias_type: normalizeText(alias.alias_type),
        region_code: normalizeText(alias.region_code)?.toUpperCase(),
      })),
      editorial_sections: dto.editorial_sections?.map((section) => ({
        ...section,
        title: normalizeText(section.title) ?? section.title,
        body_markdown: section.body_markdown.trim(),
      })),
    };
  }

  private async createInlineHardwareComponents(
    tx: Prisma.TransactionClient,
    variantName: string,
    inlineModules: CreateDeviceVariantDto["inline_modules"],
  ): Promise<CreateDeviceVariantDto["hardware_components"]> {
    if (!inlineModules) return undefined;
    const components: NonNullable<
      CreateDeviceVariantDto["hardware_components"]
    > = {};

    if (inlineModules.display) {
      const display = inlineModules.display;
      const technologyName = display.technology.trim();
      const technologySlug = this.catalogSlug(technologyName);
      if (!technologySlug) {
        throw new BadRequestException("Display technology is required");
      }
      const technology = await tx.display_technologies.upsert({
        where: { slug: technologySlug },
        update: {},
        create: { name: technologyName, slug: technologySlug },
        select: { id: true },
      });
      const created = await tx.display_units.create({
        data: {
          display_technology_id: technology.id,
          name: this.inlineModuleName(variantName, "Màn hình chính"),
          size_inch: display.size_inch,
          aspect_ratio: display.aspect_ratio?.trim() || null,
          resolution_width: display.resolution_width,
          resolution_height: display.resolution_height,
          pixel_density_ppi: display.pixel_density_ppi,
          refresh_rate_hz: display.refresh_rate_hz,
          refresh_rate_min_hz: display.refresh_rate_min_hz,
          ltpo_version: display.ltpo_version?.trim() || null,
          touch_sampling_hz: display.touch_sampling_hz,
          brightness_typical_nits: display.brightness_typical_nits,
          brightness_hbm_nits: display.brightness_hbm_nits,
          brightness_peak_nits: display.brightness_peak_nits,
          color_gamut: display.color_gamut?.trim() || null,
          hdr_formats: display.hdr_formats?.trim() || null,
          protection_glass: display.protection_glass?.trim() || null,
          has_always_on: display.has_always_on,
          has_dc_dimming: display.has_dc_dimming,
          pwm_frequency_hz: display.pwm_frequency_hz,
        },
        select: { id: true },
      });
      components.displays = [
        { display_unit_id: created.id, role: "main", display_order: 1 },
      ];
    }

    if (inlineModules.battery) {
      const battery = inlineModules.battery;
      const created = await tx.battery_units.create({
        data: {
          name: this.inlineModuleName(variantName, "Pin chính"),
          capacity_mah: battery.capacity_mah,
          energy_wh: battery.energy_wh,
          wired_charging_w: battery.wired_charging_w,
          wired_charging_protocol:
            battery.wired_charging_protocol?.trim() || null,
          wireless_charging_w: battery.wireless_charging_w,
          wireless_charging_protocol:
            battery.wireless_charging_protocol?.trim() || null,
          removable: battery.removable ?? false,
        },
        select: { id: true },
      });
      components.batteries = [
        { battery_unit_id: created.id, role: "main", is_primary: true },
      ];
    }

    if (inlineModules.cameras !== undefined) {
      const cameraRoleNames: Record<string, string> = {
        main: "Camera sau chính",
        ultrawide: "Camera góc siêu rộng",
        telephoto: "Camera tele / tiềm vọng",
        selfie: "Camera trước",
      };
      const createdCameras: Array<{ id: string; role: string }> = [];
      for (const camera of inlineModules.cameras) {
        const cameraRole = await tx.camera_roles.upsert({
          where: { code: camera.role },
          update: {},
          create: {
            code: camera.role,
            name: cameraRoleNames[camera.role] ?? camera.role,
          },
          select: { id: true },
        });
        const created = await tx.camera_modules.create({
          data: {
            camera_role_id: cameraRole.id,
            name: this.inlineModuleName(
              variantName,
              cameraRoleNames[camera.role] ?? camera.role,
            ),
            effective_megapixel: camera.effective_megapixel,
            aperture: camera.aperture?.trim() || null,
            focal_length_mm_eq: camera.focal_length_mm_eq,
            optical_zoom: camera.optical_zoom,
            field_of_view_deg: camera.field_of_view_deg,
            has_ois: camera.has_ois,
            has_eis: camera.has_eis,
            has_af: camera.has_af,
            video_capabilities: camera.video_capabilities?.trim() || null,
          },
          select: { id: true },
        });
        createdCameras.push({ id: created.id, role: camera.role });
      }
      const rear = createdCameras
        .filter((camera) => camera.role !== "selfie")
        .map((camera, index) => ({
          camera_module_id: camera.id,
          role: camera.role,
          module_order: index + 1,
          is_primary: camera.role === "main",
        }));
      const front = createdCameras
        .filter((camera) => camera.role === "selfie")
        .map((camera, index) => ({
          camera_module_id: camera.id,
          role: camera.role,
          module_order: index + 1,
          is_primary: index === 0,
        }));
      components.cameras = [
        ...(rear.length
          ? [{ position: "rear", system_name: "Rear", modules: rear }]
          : []),
        ...(front.length
          ? [{ position: "front", system_name: "Front", modules: front }]
          : []),
      ];
    }

    return components;
  }

  private inlineModuleName(variantName: string, suffix: string) {
    return `${variantName.trim()} · ${suffix}`.slice(0, 160);
  }

  private catalogSlug(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  private hardwareComponentCreates(
    components: CreateDeviceVariantDto["hardware_components"],
  ) {
    if (!components) return {};

    return {
      ...(components.chipsets !== undefined && {
        variant_chipsets: {
          create: components.chipsets.map((item) => ({
            chipset_id: item.module_id,
            chip_role: item.role?.trim() || "main",
            is_primary: item.is_primary ?? true,
          })),
        },
      }),
      ...(components.cpus !== undefined && {
        variant_cpus: {
          create: components.cpus.map((item) => ({
            cpu_id: item.module_id,
            cpu_role: item.role?.trim() || "main",
            is_primary: item.is_primary ?? true,
          })),
        },
      }),
      ...(components.gpus !== undefined && {
        variant_gpus: {
          create: components.gpus.map((item) => ({
            gpu_id: item.module_id,
            gpu_role: item.role?.trim() || "main",
            is_primary: item.is_primary ?? true,
          })),
        },
      }),
      ...(components.npus !== undefined && {
        variant_npus: {
          create: components.npus.map((item) => ({
            npu_id: item.module_id,
            npu_role: item.role?.trim() || "main",
            is_primary: item.is_primary ?? true,
          })),
        },
      }),
      ...(components.modems !== undefined && {
        variant_modems: {
          create: components.modems.map((item) => ({
            modem_id: item.module_id,
            modem_role: item.role?.trim() || "main",
            is_primary: item.is_primary ?? true,
          })),
        },
      }),
      ...(components.memory !== undefined && {
        variant_memory_configs: {
          create: components.memory.map((item) => ({
            memory_standard_id: item.memory_standard_id,
            capacity_gb: item.capacity_gb,
            bandwidth_gbps: item.bandwidth_gbps,
            channel_count: item.channel_count,
            is_primary: item.is_primary ?? true,
            notes: item.notes?.trim() || undefined,
          })),
        },
      }),
      ...(components.storage !== undefined && {
        variant_storage_configs: {
          create: components.storage.map((item) => ({
            storage_standard_id: item.storage_standard_id,
            total_capacity_gb: item.total_capacity_gb,
            module_count: item.module_count,
            is_expandable: item.is_expandable ?? false,
            expansion_max_gb: item.expansion_max_gb,
          })),
        },
      }),
      ...(components.displays !== undefined && {
        variant_displays: {
          create: components.displays.map((item) => ({
            display_unit_id: item.display_unit_id,
            display_role: item.role?.trim() || "main",
            display_order: item.display_order ?? 1,
          })),
        },
      }),
      ...(components.batteries !== undefined && {
        variant_batteries: {
          create: components.batteries.map((item) => ({
            battery_unit_id: item.battery_unit_id,
            battery_role: item.role?.trim() || "main",
            is_primary: item.is_primary ?? true,
          })),
        },
      }),
    };
  }

  private moduleScoreCreates(
    scores: NonNullable<CreateDeviceVariantDto["module_scores"]>,
  ): Prisma.variant_module_scoresCreateWithoutDevice_variantInput[] {
    return scores.map((item) => ({
      module_kind: item.module_kind,
      module_id: item.module_id,
      score: item.score,
      score_source: "manual_admin",
      score_version: "manual-admin-v1",
      rationale:
        item.rationale?.trim() ||
        "Điểm mô-đun do quản trị viên nhập khi cấu hình phiên bản thiết bị.",
      factors: {
        entry_method: "admin_variant_form",
      },
    }));
  }

  private scoreMetricInputCreates(
    inputs: NonNullable<CreateDeviceVariantDto["score_metric_inputs"]>,
  ): Prisma.variant_score_metric_inputsCreateWithoutDevice_variantInput[] {
    return inputs.map((item) => ({
      metric_key: item.metric_key.trim(),
      raw_value: item.raw_value,
      unit: item.unit?.trim() || undefined,
      normalized_score: item.normalized_score,
      source_label: item.source_label?.trim() || undefined,
    }));
  }

  private async validateScoreMetricInputs(
    deviceModelId: string,
    inputs: CreateDeviceVariantDto["score_metric_inputs"],
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    if (inputs === undefined) return;
    const context = await this.scoringContext(deviceModelId, db);
    const allowedKeys = new Set(
      context.profile.modules.flatMap((module) =>
        module.metrics.map((metric) => metric.key),
      ),
    );
    const invalidKeys = inputs
      .map((item) => item.metric_key.trim())
      .filter((key) => !allowedKeys.has(key));
    if (invalidKeys.length) {
      throw new BadRequestException(
        `Chỉ số không thuộc hồ sơ ${context.categorySlug}: ${[
          ...new Set(invalidKeys),
        ].join(", ")}`,
      );
    }
  }

  private async scoringContext(
    deviceModelId: string,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const model = await db.device_models.findFirst({
      where: { id: deviceModelId, deleted_at: null },
      select: {
        product_family: {
          select: {
            device_category: { select: { slug: true } },
          },
        },
      },
    });
    if (!model) {
      throw new BadRequestException(
        `Device model ${deviceModelId} is not available`,
      );
    }
    const categorySlug = model.product_family.device_category.slug;
    const configured = await db.scoring_profiles.findFirst({
      where: {
        status: "published",
        effective_from: { lte: new Date() },
        device_category: { slug: categorySlug },
      },
      select: {
        name: true,
        version: true,
        device_category: { select: { slug: true } },
        modules: {
          select: {
            module_key: true,
            label: true,
            description: true,
            weight_percent: true,
            display_order: true,
            metrics: {
              select: {
                metric_key: true,
                label: true,
                weight_percent: true,
                min_value: true,
                max_value: true,
                direction: true,
                scale: true,
                display_order: true,
              },
              orderBy: { display_order: "asc" },
            },
          },
          orderBy: { display_order: "asc" },
        },
      },
      orderBy: { version: "desc" },
    });
    const profile = configured
      ? this.configuredScoringProfile(configured)
      : SCORING_PROFILES[categorySlug];
    if (!profile) {
      throw new BadRequestException(
        `Chưa có công thức chấm điểm cho danh mục ${categorySlug}.`,
      );
    }
    return { categorySlug, profile };
  }

  private assertUniqueModelAliases(
    aliases: CreateDeviceBundleDto["model"]["aliases"],
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

  private async recalculateAutomaticScorecard(
    deviceVariantId: string,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const variant = await db.device_variants.findUniqueOrThrow({
      where: { id: deviceVariantId },
      select: {
        device_model_id: true,
        ...DEVICE_VARIANT_COMPONENT_SELECT,
      },
    });
    const { categorySlug, profile } = await this.scoringContext(
      variant.device_model_id,
      db,
    );
    const rawMetrics = extractAutomaticDeviceMetrics(
      variant as unknown as Record<string, any>,
      categorySlug,
    );
    const calculated = calculateScorecard(profile, rawMetrics);
    const scorecard = await db.variant_scorecards.upsert({
      where: {
        device_variant_id_score_version: {
          device_variant_id: deviceVariantId,
          score_version: profile.version,
        },
      },
      update: {
        category_slug: categorySlug,
        overall_score: calculated.overallScore,
        coverage_percent: calculated.coverage,
        score_source: calculated.source,
        raw_metric_count: calculated.rawMetricCount,
        rationale: AUTOMATIC_DEVICE_SCORE_RATIONALE,
        factors: {
          calculation_mode: "automatic_from_composed_device",
          input_priority: [
            "verified_benchmark",
            "catalog_specification",
            "derived_feature",
            "neutral_reference",
          ],
          normalization: "profile_min_max_with_log_for_wide_distributions",
          missing_data_policy: "category_reference_prior_50",
          observed_metric_count: calculated.observedMetricCount,
          reference_metric_count: calculated.referenceMetricCount,
          profile_label: profile.label,
          module_weights: Object.fromEntries(
            profile.modules.map((module) => [module.key, module.weight]),
          ),
        },
        calculated_at: new Date(),
      },
      create: {
        device_variant_id: deviceVariantId,
        category_slug: categorySlug,
        score_version: profile.version,
        overall_score: calculated.overallScore,
        coverage_percent: calculated.coverage,
        score_source: calculated.source,
        raw_metric_count: calculated.rawMetricCount,
        rationale: AUTOMATIC_DEVICE_SCORE_RATIONALE,
        factors: {
          calculation_mode: "automatic_from_composed_device",
          input_priority: [
            "verified_benchmark",
            "catalog_specification",
            "derived_feature",
            "neutral_reference",
          ],
          normalization: "profile_min_max_with_log_for_wide_distributions",
          missing_data_policy: "category_reference_prior_50",
          observed_metric_count: calculated.observedMetricCount,
          reference_metric_count: calculated.referenceMetricCount,
          profile_label: profile.label,
          module_weights: Object.fromEntries(
            profile.modules.map((module) => [module.key, module.weight]),
          ),
        },
      },
    });
    await db.variant_scorecard_modules.deleteMany({
      where: { scorecard_id: scorecard.id },
    });
    if (calculated.modules.length) {
      await db.variant_scorecard_modules.createMany({
        data: calculated.modules.map((module) => ({
          scorecard_id: scorecard.id,
          module_key: module.key,
          module_name: module.label,
          score: module.score,
          weight_percent: module.weight,
          coverage_percent: module.coverage,
          rationale: module.description,
          raw_metrics: module.metrics,
        })),
      });
    }
  }

  private configuredScoringProfile(record: {
    name: string;
    version: number;
    device_category: { slug: string };
    modules: Array<{
      module_key: string;
      label: string;
      description: string | null;
      weight_percent: Prisma.Decimal;
      metrics: Array<{
        metric_key: string;
        label: string;
        weight_percent: Prisma.Decimal;
        min_value: Prisma.Decimal;
        max_value: Prisma.Decimal;
        direction: string;
        scale: string;
      }>;
    }>;
  }): ScoringProfile {
    return {
      categorySlug: record.device_category.slug,
      label: record.name,
      version: `${AUTOMATIC_DEVICE_SCORE_VERSION}-profile-${record.version}`,
      modules: record.modules.map((module) => ({
        key: module.module_key,
        label: module.label,
        description: module.description ?? "",
        weight: Number(module.weight_percent),
        metrics: module.metrics.map((metric) => ({
          key: metric.metric_key,
          label: metric.label,
          weight: Number(metric.weight_percent),
          min: Number(metric.min_value),
          max: Number(metric.max_value),
          direction: metric.direction as "higher" | "lower",
          scale: metric.scale as "linear" | "log",
        })),
      })),
    };
  }

  private hardwareComponentUpdates(
    components: CreateDeviceVariantDto["hardware_components"],
  ) {
    if (!components) return {};
    const creates = this.hardwareComponentCreates(components);

    return {
      ...("variant_chipsets" in creates && {
        variant_chipsets: {
          deleteMany: {},
          ...creates.variant_chipsets,
        },
      }),
      ...("variant_cpus" in creates && {
        variant_cpus: { deleteMany: {}, ...creates.variant_cpus },
      }),
      ...("variant_gpus" in creates && {
        variant_gpus: { deleteMany: {}, ...creates.variant_gpus },
      }),
      ...("variant_npus" in creates && {
        variant_npus: { deleteMany: {}, ...creates.variant_npus },
      }),
      ...("variant_modems" in creates && {
        variant_modems: { deleteMany: {}, ...creates.variant_modems },
      }),
      ...("variant_memory_configs" in creates && {
        variant_memory_configs: {
          deleteMany: {},
          ...creates.variant_memory_configs,
        },
      }),
      ...("variant_storage_configs" in creates && {
        variant_storage_configs: {
          deleteMany: {},
          ...creates.variant_storage_configs,
        },
      }),
      ...("variant_displays" in creates && {
        variant_displays: {
          deleteMany: {},
          ...creates.variant_displays,
        },
      }),
      ...("variant_batteries" in creates && {
        variant_batteries: {
          deleteMany: {},
          ...creates.variant_batteries,
        },
      }),
    };
  }

  private async replaceCameraSystems(
    tx: Prisma.TransactionClient,
    deviceVariantId: string,
    systems: NonNullable<
      CreateDeviceVariantDto["hardware_components"]
    >["cameras"],
  ) {
    if (systems === undefined) return;
    await tx.variant_camera_modules.deleteMany({
      where: { device_variant_id: deviceVariantId },
    });
    await tx.variant_camera_systems.deleteMany({
      where: { device_variant_id: deviceVariantId },
    });
    for (const system of systems) {
      const cameraSystem = await tx.variant_camera_systems.create({
        data: {
          device_variant_id: deviceVariantId,
          position: system.position,
          system_name: system.system_name?.trim() || null,
          notes: system.notes?.trim() || null,
        },
        select: { id: true },
      });
      if (system.modules.length) {
        await tx.variant_camera_modules.createMany({
          data: system.modules.map((module, index) => ({
            device_variant_id: deviceVariantId,
            camera_system_id: cameraSystem.id,
            camera_module_id: module.camera_module_id,
            position: system.position,
            role: module.role,
            module_order: module.module_order ?? index + 1,
            is_primary: module.is_primary ?? index === 0,
            usage_type: module.usage_type?.trim() || null,
            notes: module.notes?.trim() || null,
          })),
        });
      }
    }
  }

  private buildOrderBy(
    query: QueryDeviceVariantsDto,
  ): Prisma.device_variantsOrderByWithRelationInput[] {
    const allowedSortFields = new Set([
      "variant_name",
      "launch_date",
      "launch_price",
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

    return [
      { is_default: "desc" },
      { launch_date: "desc" },
      { variant_name: "asc" },
    ];
  }
}
