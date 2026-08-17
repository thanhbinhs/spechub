import { PrismaClient } from "../generated/client";
import { HISTORIC_CATALOG_DEVICES } from "./catalog-history-expansion";

const prisma = new PrismaClient();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const expectedSlugs = HISTORIC_CATALOG_DEVICES.map(
    (device) => device.modelSlug,
  );
  const models = await prisma.device_models.findMany({
    where: { slug: { in: expectedSlugs }, deleted_at: null },
    select: {
      slug: true,
      description: true,
      device_variants: {
        where: { deleted_at: null, is_default: true },
        select: {
          variant_physical_specs: { select: { device_variant_id: true } },
          variant_io_specs: { select: { device_variant_id: true } },
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
            select: { module_scores: { select: { id: true } } },
          },
        },
      },
    },
  });

  const failures: string[] = [];
  if (models.length !== expectedSlugs.length) {
    const found = new Set(models.map((model) => model.slug));
    failures.push(
      `missing models: ${expectedSlugs.filter((slug) => !found.has(slug)).join(", ")}`,
    );
  }

  let scorecardModules = 0;
  for (const model of models) {
    assert(
      (model.description?.trim().length ?? 0) >= 600,
      `${model.slug} has an incomplete historical description.`,
    );
    const variant = model.device_variants[0];
    if (!variant) {
      failures.push(`${model.slug}: missing default variant`);
      continue;
    }
    const modules: Array<[string, boolean]> = [
      ["physical", Boolean(variant.variant_physical_specs)],
      ["I/O", Boolean(variant.variant_io_specs)],
      ["chipset", variant.variant_chipsets.length > 0],
      ["CPU", variant.variant_cpus.length > 0],
      ["GPU", variant.variant_gpus.length > 0],
      ["AI engine", variant.variant_npus.length > 0],
      ["modem", variant.variant_modems.length > 0],
      ["memory", variant.variant_memory_configs.length > 0],
      ["storage", variant.variant_storage_configs.length > 0],
      ["display", variant.variant_displays.length > 0],
      ["battery", variant.variant_batteries.length > 0],
      ["camera", variant.variant_camera_modules.length > 0],
      ["operating system", variant.variant_operating_systems.length > 0],
      ["benchmark reference", variant.device_variant_benchmarks.length > 0],
      ["module scores", variant.variant_module_scores.length > 0],
      ["scorecard", variant.variant_scorecards.length > 0],
    ];
    for (const [name, present] of modules) {
      if (!present) failures.push(`${model.slug}: missing ${name}`);
    }
    const moduleCount = variant.variant_scorecards.reduce(
      (total, scorecard) => total + scorecard.module_scores.length,
      0,
    );
    if (!moduleCount) failures.push(`${model.slug}: scorecard has no modules`);
    scorecardModules += moduleCount;
  }

  if (failures.length) {
    throw new Error(
      `Historic catalog verification failed (${failures.length}):\n- ${failures.join("\n- ")}`,
    );
  }

  console.log("Historic catalog verified:", {
    deviceModels: models.length,
    defaultVariants: models.length,
    scorecardModules,
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
