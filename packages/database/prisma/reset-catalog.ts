import { PrismaClient } from "../generated/client";

const prisma = new PrismaClient();

const resetConfirmed = process.argv.includes("--confirm-reset");

if (!resetConfirmed) {
  throw new Error(
    "Catalog reset cancelled. Re-run with --confirm-reset after creating a backup.",
  );
}

const entityTables = [
  "organizations",
  "organization",
  "product_families",
  "product_family",
  "device_models",
  "device_model",
  "device_variants",
  "device_variant",
];

async function catalogCounts() {
  const [organizations, productFamilies, deviceModels, deviceVariants] =
    await Promise.all([
      prisma.organizations.count(),
      prisma.product_families.count(),
      prisma.device_models.count(),
      prisma.device_variants.count(),
    ]);
  return { organizations, productFamilies, deviceModels, deviceVariants };
}

async function main() {
  const before = await catalogCounts();
  console.log("Catalog before reset:", before);

  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(
        'TRUNCATE TABLE "device_variants" RESTART IDENTITY CASCADE',
      );

      await tx.model_lineage.deleteMany();
      await tx.model_similarity.deleteMany();

      await tx.translations.deleteMany({
        where: { entity_table: { in: entityTables } },
      });
      await tx.entity_tags.deleteMany({
        where: { entity_table: { in: entityTables } },
      });
      const linkedMedia = await tx.entity_media.findMany({
        where: { entity_table: { in: entityTables } },
        select: { media_asset_id: true },
      });
      await tx.entity_media.deleteMany({
        where: { entity_table: { in: entityTables } },
      });
      const linkedMediaIds = [
        ...new Set(linkedMedia.map((item) => item.media_asset_id)),
      ];
      if (linkedMediaIds.length) {
        await tx.media_assets.deleteMany({
          where: {
            id: { in: linkedMediaIds },
            entity_media: { none: {} },
          },
        });
      }

      await tx.$executeRawUnsafe(`
        UPDATE "comments"
        SET "parent_comment_id" = NULL
        WHERE "parent_comment_id" IN (
          SELECT "id"
          FROM "comments"
          WHERE "entity_table" IN (
            'organizations', 'organization',
            'product_families', 'product_family',
            'device_models', 'device_model',
            'device_variants', 'device_variant'
          )
        )
      `);
      await tx.comments.deleteMany({
        where: { entity_table: { in: entityTables } },
      });

      await tx.$executeRawUnsafe(`
        UPDATE "wiki_articles"
        SET "current_revision_id" = NULL
        WHERE "entity_table" IN (
          'organizations', 'organization',
          'product_families', 'product_family',
          'device_models', 'device_model',
          'device_variants', 'device_variant'
        )
      `);
      await tx.$executeRawUnsafe(`
        DELETE FROM "wiki_article_citations"
        WHERE "article_id" IN (
          SELECT "id"
          FROM "wiki_articles"
          WHERE "entity_table" IN (
            'organizations', 'organization',
            'product_families', 'product_family',
            'device_models', 'device_model',
            'device_variants', 'device_variant'
          )
        )
      `);
      await tx.$executeRawUnsafe(`
        DELETE FROM "wiki_revisions"
        WHERE "article_id" IN (
          SELECT "id"
          FROM "wiki_articles"
          WHERE "entity_table" IN (
            'organizations', 'organization',
            'product_families', 'product_family',
            'device_models', 'device_model',
            'device_variants', 'device_variant'
          )
        )
      `);
      await tx.wiki_articles.deleteMany({
        where: { entity_table: { in: entityTables } },
      });
      await tx.embeddings.deleteMany({
        where: { entity_type: { in: entityTables } },
      });
      await tx.catalog_drafts.deleteMany({
        where: {
          OR: [
            { entity_table: { in: entityTables } },
            { draft_type: { in: ["device", "organization", "product_family"] } },
          ],
        },
      });
      await tx.catalog_entity_versions.deleteMany({
        where: { entity_table: { in: entityTables } },
      });

      await tx.device_models.deleteMany();
      await tx.product_families.deleteMany();
      await tx.organization_role_assignments.deleteMany();
      await tx.organizations.deleteMany();
    },
    { timeout: 60_000 },
  );

  const after = await catalogCounts();
  console.log("Catalog after reset:", after);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
