import { PrismaClient } from "../generated/client";
import { ADDITIONAL_CATALOG_DEVICES } from "./catalog-expansion-50";

const prisma = new PrismaClient();

const FOUNDATIONAL_MODEL_SLUGS = [
  "iphone-16-pro",
  "galaxy-s25-ultra",
  "pixel-9-pro",
  "xiaomi-14-ultra",
  "ipad-pro-13-m4",
  "macbook-pro-14-m4-pro",
  "galaxy-watch7-44mm",
  "airpods-pro-2-usbc",
] as const;

const EXPECTED_MODEL_SLUGS = [
  ...FOUNDATIONAL_MODEL_SLUGS,
  ...ADDITIONAL_CATALOG_DEVICES.map((device) => device.modelSlug),
];
const EXPANSION_MODEL_SLUGS = new Set(
  ADDITIONAL_CATALOG_DEVICES.map((device) => device.modelSlug),
);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertDescription(
  kind: string,
  name: string,
  description: string | null,
) {
  assert(
    (description?.trim().length ?? 0) >= 60,
    `${kind} ${name} has an incomplete description.`,
  );
}

async function main() {
  assert(
    new Set(EXPECTED_MODEL_SLUGS).size === 58,
    "The curated catalog definition must contain 58 unique models.",
  );

  const activeModelCount = await prisma.device_models.count({
    where: { deleted_at: null },
  });
  assert(
    activeModelCount >= EXPECTED_MODEL_SLUGS.length,
    `Expected at least ${EXPECTED_MODEL_SLUGS.length} active device models, found ${activeModelCount}.`,
  );

  const models = await prisma.device_models.findMany({
    where: { slug: { in: EXPECTED_MODEL_SLUGS }, deleted_at: null },
    select: {
      id: true,
      slug: true,
      name: true,
      summary: true,
      description: true,
      cover_image_url: true,
    },
  });
  assert(models.length === 58, `Found ${models.length}/58 curated models.`);

  for (const model of models) {
    assert(
      model.summary.trim().length >= 80,
      `${model.slug} has a summary shorter than 80 characters.`,
    );
    assert(
      model.description.trim().length >= 600,
      `${model.slug} has a description shorter than 600 characters.`,
    );
    assert(
      model.cover_image_url === `/images/devices/${model.slug}.webp`,
      `${model.slug} does not use its verified local cover image.`,
    );
  }

  const defaultVariants = await prisma.device_variants.findMany({
    where: {
      device_model: { slug: { in: EXPECTED_MODEL_SLUGS } },
      is_default: true,
      deleted_at: null,
    },
    include: {
      device_model: {
        include: {
          product_family: { include: { device_category: true } },
        },
      },
      variant_chipsets: { include: { chipset: true } },
      variant_cpus: { include: { cpu: true } },
      variant_gpus: { include: { gpu: true } },
      variant_npus: { include: { npu: true } },
      variant_modems: { include: { modem: true } },
      variant_displays: { include: { display_unit: true } },
      variant_batteries: { include: { battery_unit: true } },
      variant_camera_modules: { include: { camera_module: true } },
      variant_memory_configs: true,
      variant_storage_configs: true,
      variant_operating_systems: true,
      variant_physical_specs: true,
    },
  });
  assert(
    defaultVariants.length === 58,
    `Expected one default variant per model, found ${defaultVariants.length}.`,
  );

  for (const variant of defaultVariants) {
    const slug = variant.device_model.slug;
    const category = variant.device_model.product_family.device_category.slug;
    const isEarbuds = category === "earbuds";
    const requiresAiModule = [
      "smartphone",
      "tablet",
      "laptop",
      "smartwatch",
    ].includes(category);

    assert(variant.variant_chipsets.length > 0, `${slug} is missing chipset.`);
    assert(variant.variant_cpus.length > 0, `${slug} is missing CPU.`);
    assert(
      isEarbuds || variant.variant_gpus.length > 0,
      `${slug} is missing GPU.`,
    );
    assert(
      !requiresAiModule || variant.variant_npus.length > 0,
      `${slug} is missing NPU/AI engine.`,
    );
    assert(
      category !== "smartphone" || variant.variant_modems.length > 0,
      `${slug} is missing cellular modem.`,
    );
    assert(
      isEarbuds || variant.variant_displays.length > 0,
      `${slug} is missing display.`,
    );
    assert(variant.variant_batteries.length > 0, `${slug} is missing battery.`);
    assert(
      variant.variant_memory_configs.length > 0,
      `${slug} is missing memory configuration.`,
    );
    assert(
      isEarbuds || variant.variant_storage_configs.length > 0,
      `${slug} is missing storage configuration.`,
    );
    assert(
      variant.variant_operating_systems.length > 0,
      `${slug} is missing operating system version.`,
    );
    assert(
      variant.variant_physical_specs !== null,
      `${slug} is missing physical specifications.`,
    );
    assert(
      category !== "smartphone" || variant.variant_camera_modules.length > 0,
      `${slug} is missing its main camera module.`,
    );
    assert(
      !EXPANSION_MODEL_SLUGS.has(slug) ||
        variant.variant_camera_modules.length > 0,
      `${slug} expansion profile is missing its camera module.`,
    );

    for (const link of variant.variant_chipsets) {
      assertDescription("Chipset", link.chipset.name, link.chipset.description);
    }
    for (const link of variant.variant_cpus) {
      assertDescription("CPU", link.cpu.name, link.cpu.description);
    }
    for (const link of variant.variant_gpus) {
      assertDescription("GPU", link.gpu.name, link.gpu.description);
    }
    for (const link of variant.variant_npus) {
      assertDescription("NPU", link.npu.name, link.npu.description);
    }
    for (const link of variant.variant_modems) {
      assertDescription("Modem", link.modem.name, link.modem.description);
    }
    for (const link of variant.variant_displays) {
      assertDescription(
        "Display",
        link.display_unit.name ??
          link.display_unit.slug ??
          link.display_unit.id,
        link.display_unit.description,
      );
    }
    for (const link of variant.variant_batteries) {
      assertDescription(
        "Battery",
        link.battery_unit.name ??
          link.battery_unit.slug ??
          link.battery_unit.id,
        link.battery_unit.description,
      );
    }
    for (const link of variant.variant_camera_modules) {
      assertDescription(
        "Camera",
        link.camera_module.name ??
          link.camera_module.slug ??
          link.camera_module.id,
        link.camera_module.description,
      );
    }
  }

  const modelIds = models.map((model) => model.id);
  const media = await prisma.entity_media.findMany({
    where: {
      entity_table: "device_models",
      entity_id: { in: modelIds },
      media_asset: { upload_status: "ready" },
    },
    include: { media_asset: true },
  });
  const imageModelIds = new Set(
    media
      .filter((item) => item.media_asset.asset_type === "image")
      .map((item) => item.entity_id),
  );
  const videos = media.filter(
    (item) => item.media_asset.asset_type === "video",
  );
  assert(
    imageModelIds.size === 58,
    `Expected verified image media for all 58 models, found ${imageModelIds.size}.`,
  );
  assert(
    videos.length >= 3,
    `Expected at least 3 official product videos, found ${videos.length}.`,
  );
  assert(
    videos.every(
      (item) =>
        item.media_asset.source_id &&
        item.media_asset.url?.startsWith("https://www.youtube.com/watch?v="),
    ),
    "Every seeded video must retain an official source and a playable YouTube URL.",
  );

  const aiProfilesWithTops = await prisma.npus.findMany({
    where: {
      slug: { endsWith: "-ai-engine" },
      tops: { not: null },
      variant_npus: {
        some: {
          device_variant: {
            device_model: {
              slug: { in: ADDITIONAL_CATALOG_DEVICES.map((d) => d.modelSlug) },
            },
          },
        },
      },
    },
    select: { id: true, slug: true },
  });
  const sourcedTopsCoverage = await prisma.module_field_coverage.findMany({
    where: {
      module_kind: "npu",
      module_id: { in: aiProfilesWithTops.map((profile) => profile.id) },
      field_key: "tops",
      status: "populated",
      source_url: { not: null },
    },
    select: { module_id: true },
  });
  assert(
    sourcedTopsCoverage.length === aiProfilesWithTops.length,
    "Every curated AI TOPS value must retain a manufacturer source; guessed values are forbidden.",
  );

  console.log(
    JSON.stringify(
      {
        deviceModels: models.length,
        defaultVariants: defaultVariants.length,
        images: imageModelIds.size,
        officialVideos: videos.length,
        categories: Object.fromEntries(
          [
            ...new Set(
              defaultVariants.map(
                (variant) =>
                  variant.device_model.product_family.device_category.slug,
              ),
            ),
          ].map((category) => [
            category,
            defaultVariants.filter(
              (variant) =>
                variant.device_model.product_family.device_category.slug ===
                category,
            ).length,
          ]),
        ),
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
