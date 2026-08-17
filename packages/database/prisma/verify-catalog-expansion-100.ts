import { PrismaClient } from "../generated/client";
import {
  CATALOG_EXPANSION_100_DEVICES,
  CATALOG_EXPANSION_100_MODULES,
} from "./catalog-expansion-100";

const prisma = new PrismaClient();

async function main() {
  const expectedSlugs = CATALOG_EXPANSION_100_DEVICES.map(
    (device) => device.modelSlug,
  );
  const moduleBySlug = new Map(
    CATALOG_EXPANSION_100_MODULES.map((profile) => [
      profile.modelSlug,
      profile,
    ]),
  );
  const categoryBySlug = new Map(
    CATALOG_EXPANSION_100_DEVICES.map((device) => [
      device.modelSlug,
      device.categorySlug,
    ]),
  );
  const aiCategories = new Set([
    "smartphone",
    "tablet",
    "laptop",
    "smartwatch",
    "television",
    "gaming-handheld",
  ]);

  const models = await prisma.device_models.findMany({
    where: {
      slug: { in: expectedSlugs },
      deleted_at: null,
    },
    select: {
      slug: true,
      description: true,
      product_family: {
        select: { device_category: { select: { slug: true } } },
      },
      device_variants: {
        where: { deleted_at: null, is_default: true },
        take: 1,
        select: {
          id: true,
          variant_physical_specs: { select: { device_variant_id: true } },
          variant_io_specs: { select: { device_variant_id: true } },
          variant_thermal_specs: { select: { device_variant_id: true } },
          variant_chipsets: { select: { id: true } },
          variant_cpus: { select: { id: true } },
          variant_gpus: { select: { id: true } },
          variant_npus: { select: { id: true } },
          variant_modems: { select: { id: true } },
          variant_memory_configs: { select: { id: true } },
          variant_storage_configs: { select: { id: true } },
          variant_displays: { select: { id: true } },
          variant_batteries: { select: { id: true } },
          variant_camera_modules: { select: { id: true } },
          variant_operating_systems: { select: { id: true } },
          device_variant_benchmarks: { select: { id: true } },
          variant_module_scores: { select: { id: true } },
          variant_scorecards: {
            select: {
              id: true,
              coverage_percent: true,
              module_scores: { select: { id: true } },
            },
          },
        },
      },
    },
  });

  const failures: string[] = [];
  const categoryCounts = new Map<string, number>();
  let scorecardModuleCount = 0;
  let moduleScoreCount = 0;

  for (const model of models) {
    const categorySlug = model.product_family.device_category.slug;
    categoryCounts.set(
      categorySlug,
      (categoryCounts.get(categorySlug) ?? 0) + 1,
    );
    const variant = model.device_variants[0];
    const profile = moduleBySlug.get(model.slug);
    if (!variant || !profile) {
      failures.push(`${model.slug}: thiếu default variant hoặc module profile`);
      continue;
    }

    const requiredChecks: Array<[string, boolean]> = [
      ["physical", Boolean(variant.variant_physical_specs)],
      ["io", Boolean(variant.variant_io_specs)],
      ["thermal", Boolean(variant.variant_thermal_specs)],
      ["chipset", variant.variant_chipsets.length > 0],
      ["cpu", variant.variant_cpus.length > 0],
      ["memory", variant.variant_memory_configs.length > 0],
      ["storage", variant.variant_storage_configs.length > 0],
      ["operating-system", variant.variant_operating_systems.length > 0],
      ["benchmark-reference", variant.device_variant_benchmarks.length > 0],
      ["module-scores", variant.variant_module_scores.length > 0],
      ["scorecard", variant.variant_scorecards.length > 0],
      [
        "scorecard-modules",
        variant.variant_scorecards.some(
          (scorecard) => scorecard.module_scores.length > 0,
        ),
      ],
      [
        "description-7-sections",
        (model.description?.match(/^##\s+/gm) ?? []).length === 7,
      ],
    ];
    if (aiCategories.has(categorySlug)) {
      requiredChecks.push(["npu", variant.variant_npus.length > 0]);
    }
    if (profile.chipset.gpuName || aiCategories.has(categorySlug)) {
      requiredChecks.push(["gpu", variant.variant_gpus.length > 0]);
    }
    if (profile.wireless.includes("cellular5g")) {
      requiredChecks.push(["modem", variant.variant_modems.length > 0]);
    }
    if (profile.display) {
      requiredChecks.push(["display", variant.variant_displays.length > 0]);
    }
    if (profile.battery) {
      requiredChecks.push(["battery", variant.variant_batteries.length > 0]);
    }
    if (profile.camera) {
      requiredChecks.push([
        "camera",
        variant.variant_camera_modules.length > 0,
      ]);
    }
    for (const [label, passed] of requiredChecks) {
      if (!passed) failures.push(`${model.slug}: thiếu ${label}`);
    }

    moduleScoreCount += variant.variant_module_scores.length;
    scorecardModuleCount += variant.variant_scorecards.reduce(
      (total, scorecard) => total + scorecard.module_scores.length,
      0,
    );
  }

  if (models.length !== 100) {
    failures.push(`chỉ tìm thấy ${models.length}/100 device model`);
  }
  if (categoryCounts.size !== 8) {
    failures.push(`chỉ phủ ${categoryCounts.size}/8 danh mục`);
  }
  const missingSlugs = expectedSlugs.filter(
    (slug) => !models.some((model) => model.slug === slug),
  );
  if (missingSlugs.length) {
    failures.push(`thiếu model: ${missingSlugs.join(", ")}`);
  }

  if (failures.length) {
    throw new Error(
      `Catalog expansion verification failed (${failures.length}):\n- ${failures.join("\n- ")}`,
    );
  }

  console.log("Catalog expansion 100 verified:", {
    deviceModels: models.length,
    categories: Object.fromEntries(
      [...categoryCounts.entries()].sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
    moduleScores: moduleScoreCount,
    scorecardModules: scorecardModuleCount,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
