import { PrismaClient } from "../generated/client";
import { MODULE_SPEC_FIELDS, type ModuleKind } from "./catalog-module-enrichment";

const prisma = new PrismaClient();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const variants = await prisma.device_variants.findMany({
    where: { deleted_at: null, device_model: { deleted_at: null } },
    select: {
      variant_chipsets: { select: { chipset_id: true } },
      variant_cpus: { select: { cpu_id: true } },
      variant_gpus: { select: { gpu_id: true } },
      variant_npus: { select: { npu_id: true } },
      variant_modems: { select: { modem_id: true } },
      variant_memory_configs: { select: { memory_standard_id: true } },
      variant_storage_configs: { select: { storage_standard_id: true } },
      variant_operating_systems: {
        select: { os_version: { select: { operating_system_id: true } } },
      },
      variant_camera_modules: { select: { camera_module_id: true } },
      variant_displays: { select: { display_unit_id: true } },
      variant_batteries: { select: { battery_unit_id: true } },
    },
  });

  const ids: Record<ModuleKind, Set<string>> = {
    chipset: new Set(variants.flatMap((v) => v.variant_chipsets.map((x) => x.chipset_id))),
    cpu: new Set(variants.flatMap((v) => v.variant_cpus.map((x) => x.cpu_id))),
    gpu: new Set(variants.flatMap((v) => v.variant_gpus.map((x) => x.gpu_id))),
    npu: new Set(variants.flatMap((v) => v.variant_npus.map((x) => x.npu_id))),
    modem: new Set(variants.flatMap((v) => v.variant_modems.map((x) => x.modem_id))),
    "memory-standard": new Set(
      variants.flatMap((v) => v.variant_memory_configs.map((x) => x.memory_standard_id)),
    ),
    "storage-standard": new Set(
      variants.flatMap((v) => v.variant_storage_configs.map((x) => x.storage_standard_id)),
    ),
    "operating-system": new Set(
      variants.flatMap((v) =>
        v.variant_operating_systems.map((x) => x.os_version.operating_system_id),
      ),
    ),
    camera: new Set(variants.flatMap((v) => v.variant_camera_modules.map((x) => x.camera_module_id))),
    display: new Set(variants.flatMap((v) => v.variant_displays.map((x) => x.display_unit_id))),
    battery: new Set(variants.flatMap((v) => v.variant_batteries.map((x) => x.battery_unit_id))),
  };

  const allModuleIds = Object.values(ids).flatMap((values) => [...values]);
  const expectedCoverageRows = (Object.keys(MODULE_SPEC_FIELDS) as ModuleKind[]).reduce(
    (total, kind) => total + ids[kind].size * MODULE_SPEC_FIELDS[kind].length,
    0,
  );
  const coverage = await prisma.module_field_coverage.findMany({
    where: { module_id: { in: allModuleIds } },
  });
  assert(
    coverage.length === expectedCoverageRows,
    `Expected ${expectedCoverageRows} field coverage rows, found ${coverage.length}.`,
  );

  const keys = new Set(
    coverage.map((row) => `${row.module_kind}:${row.module_id}:${row.field_key}`),
  );
  for (const kind of Object.keys(MODULE_SPEC_FIELDS) as ModuleKind[]) {
    for (const moduleId of ids[kind]) {
      for (const field of MODULE_SPEC_FIELDS[kind]) {
        assert(
          keys.has(`${kind}:${moduleId}:${field}`),
          `Missing coverage for ${kind}:${moduleId}:${field}.`,
        );
      }
    }
  }

  const allowedStatuses = new Set([
    "populated",
    "derived",
    "not_disclosed",
    "not_applicable",
  ]);
  assert(
    coverage.every((row) => allowedStatuses.has(row.status)),
    "Unexpected field coverage status found.",
  );
  const documentedCount = coverage.length;
  const actualCount = coverage.filter((row) =>
    ["populated", "derived"].includes(row.status),
  ).length;
  const actualPercent = Math.round((actualCount / documentedCount) * 100);
  assert(
    actualPercent >= 45,
    `Actual module field coverage is ${actualPercent}%, expected at least 45%.`,
  );

  const descriptions = await Promise.all([
    prisma.chipsets.findMany({ where: { id: { in: [...ids.chipset] } }, select: { slug: true, description: true } }),
    prisma.cpus.findMany({ where: { id: { in: [...ids.cpu] } }, select: { slug: true, description: true } }),
    prisma.gpus.findMany({ where: { id: { in: [...ids.gpu] } }, select: { slug: true, description: true } }),
    prisma.npus.findMany({ where: { id: { in: [...ids.npu] } }, select: { slug: true, description: true } }),
    prisma.modems.findMany({ where: { id: { in: [...ids.modem] } }, select: { slug: true, description: true } }),
    prisma.memory_standards.findMany({ where: { id: { in: [...ids["memory-standard"]] } }, select: { slug: true, description: true } }),
    prisma.storage_standards.findMany({ where: { id: { in: [...ids["storage-standard"]] } }, select: { slug: true, description: true } }),
    prisma.operating_systems.findMany({ where: { id: { in: [...ids["operating-system"]] } }, select: { slug: true, description: true } }),
    prisma.camera_modules.findMany({ where: { id: { in: [...ids.camera] } }, select: { slug: true, description: true } }),
    prisma.display_units.findMany({ where: { id: { in: [...ids.display] } }, select: { slug: true, description: true } }),
    prisma.battery_units.findMany({ where: { id: { in: [...ids.battery] } }, select: { slug: true, description: true } }),
  ]);
  const weakDescriptions = descriptions
    .flat()
    .filter((row) => (row.description?.trim().length ?? 0) < 60)
    .map((row) => row.slug ?? "unknown");
  assert(
    weakDescriptions.length === 0,
    `Modules with missing/short descriptions: ${weakDescriptions.join(", ")}`,
  );

  const derivedDisplays = await prisma.display_units.count({
    where: {
      id: { in: [...ids.display] },
      aspect_ratio: { not: null },
      pixel_density_ppi: { not: null },
    },
  });
  assert(
    derivedDisplays === ids.display.size,
    `Only ${derivedDisplays}/${ids.display.size} displays have aspect ratio and pixel density.`,
  );

  const statusCounts = Object.fromEntries(
    ["populated", "derived", "not_disclosed", "not_applicable"].map((status) => [
      status,
      coverage.filter((row) => row.status === status).length,
    ]),
  );
  console.log(
    JSON.stringify(
      {
        activeVariants: variants.length,
        moduleCounts: Object.fromEntries(
          Object.entries(ids).map(([kind, values]) => [kind, values.size]),
        ),
        documentedFields: documentedCount,
        documentedCoveragePercent: 100,
        actualFields: actualCount,
        actualCoveragePercent: actualPercent,
        statusCounts,
        descriptionsVerified: descriptions.flat().length,
        displaysWithDerivedGeometry: derivedDisplays,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
