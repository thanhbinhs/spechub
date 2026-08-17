import { PrismaClient } from "../generated/client";

const prisma = new PrismaClient();

if (!process.argv.includes("--confirm-reset")) {
  throw new Error(
    "Content reset cancelled. Re-run with --confirm-reset after creating a backup.",
  );
}

const contentEntityTables = [
  "organizations",
  "organization",
  "device_categories",
  "device_category",
  "product_families",
  "product_family",
  "device_models",
  "device_model",
  "device_variants",
  "device_variant",
  "chipsets",
  "chipset",
  "cpus",
  "cpu",
  "gpus",
  "gpu",
  "npus",
  "npu",
  "modems",
  "modem",
  "camera_sensors",
  "camera_sensor",
  "camera_modules",
  "camera_module",
  "display_units",
  "display_unit",
  "battery_units",
  "battery_unit",
  "memory_standards",
  "memory_standard",
  "storage_standards",
  "storage_standard",
  "operating_systems",
  "operating_system",
  "wiki_articles",
  "wiki_article",
  "wiki_topics",
];

async function contentCounts(client: PrismaClient) {
  const [
    organizations,
    categories,
    productFamilies,
    deviceModels,
    deviceVariants,
    wikiArticles,
    chipsets,
    cpus,
    gpus,
    npus,
    modems,
    cameras,
    displays,
    batteries,
    memoryStandards,
    storageStandards,
    operatingSystems,
    affiliatePartners,
    affiliateLinks,
  ] = await Promise.all([
    client.organizations.count(),
    client.device_categories.count(),
    client.product_families.count(),
    client.device_models.count(),
    client.device_variants.count(),
    client.wiki_articles.count(),
    client.chipsets.count(),
    client.cpus.count(),
    client.gpus.count(),
    client.npus.count(),
    client.modems.count(),
    client.camera_modules.count(),
    client.display_units.count(),
    client.battery_units.count(),
    client.memory_standards.count(),
    client.storage_standards.count(),
    client.operating_systems.count(),
    client.affiliate_partners.count(),
    client.affiliate_links.count(),
  ]);

  return {
    organizations,
    categories,
    productFamilies,
    deviceModels,
    deviceVariants,
    wikiArticles,
    hardwareModules:
      chipsets +
      cpus +
      gpus +
      npus +
      modems +
      cameras +
      displays +
      batteries +
      memoryStandards +
      storageStandards +
      operatingSystems,
    affiliatePartners,
    affiliateLinks,
  };
}

async function main() {
  const before = await contentCounts(prisma);
  console.log("Content before reset:", before);

  await prisma.$transaction(
    async (tx) => {
      const linkedMedia = await tx.entity_media.findMany({
        where: { entity_table: { in: contentEntityTables } },
        select: { media_asset_id: true },
      });
      const linkedMediaIds = [
        ...new Set(linkedMedia.map((item) => item.media_asset_id)),
      ];

      await tx.$executeRawUnsafe(`
        UPDATE "comments"
        SET "parent_comment_id" = NULL
        WHERE "parent_comment_id" IN (
          SELECT "id"
          FROM "comments"
          WHERE "entity_table" IN (${contentEntityTables
            .map((table) => `'${table}'`)
            .join(", ")})
        )
      `);

      await Promise.all([
        tx.translations.deleteMany({
          where: { entity_table: { in: contentEntityTables } },
        }),
        tx.entity_tags.deleteMany({
          where: { entity_table: { in: contentEntityTables } },
        }),
        tx.entity_media.deleteMany({
          where: { entity_table: { in: contentEntityTables } },
        }),
        tx.comments.deleteMany({
          where: { entity_table: { in: contentEntityTables } },
        }),
        tx.embeddings.deleteMany({
          where: { entity_type: { in: contentEntityTables } },
        }),
        tx.catalog_drafts.deleteMany({
          where: {
            OR: [
              { entity_table: { in: contentEntityTables } },
              {
                draft_type: {
                  in: [
                    "device",
                    "organization",
                    "product_family",
                    "hardware",
                    "wiki",
                  ],
                },
              },
            ],
          },
        }),
        tx.catalog_entity_versions.deleteMany({
          where: { entity_table: { in: contentEntityTables } },
        }),
        tx.ai_query_cache.deleteMany(),
      ]);

      await tx.$executeRawUnsafe(`
        TRUNCATE TABLE
          "organizations",
          "device_categories",
          "wiki_articles"
        RESTART IDENTITY CASCADE
      `);

      await tx.citations.deleteMany();

      if (linkedMediaIds.length > 0) {
        await tx.media_assets.deleteMany({
          where: {
            id: { in: linkedMediaIds },
            entity_media: { none: {} },
          },
        });
      }
    },
    { timeout: 120_000 },
  );

  const after = await contentCounts(prisma);
  console.log("Content after reset:", after);

  if (
    after.organizations !== 0 ||
    after.categories !== 0 ||
    after.productFamilies !== 0 ||
    after.deviceModels !== 0 ||
    after.deviceVariants !== 0 ||
    after.wikiArticles !== 0 ||
    after.hardwareModules !== 0
  ) {
    throw new Error("Content reset verification failed.");
  }

  if (after.affiliatePartners !== before.affiliatePartners) {
    throw new Error("Affiliate partner preservation check failed.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
