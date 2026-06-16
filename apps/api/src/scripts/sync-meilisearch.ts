import { PrismaClient } from "@spechub/database";
import { MeiliSearch } from "meilisearch";

const prisma = new PrismaClient();

type DeviceModelDocument = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  release_date: string | null;
  announcement_date: string | null;
  brand_name: string;
  brand_slug: string;
  category_name: string;
  category_slug: string;
  family_name: string;
  family_slug: string;
  release_status: string;
};

async function main() {
  const host = process.env.MEILI_HOST ?? "http://localhost:7700";
  const apiKey = process.env.MEILI_API_KEY || undefined;
  const indexName = process.env.MEILI_DEVICE_MODELS_INDEX ?? "device_models";
  const client = new MeiliSearch({ host, apiKey });
  const index = client.index<DeviceModelDocument>(indexName);

  const models = await prisma.device_models.findMany({
    where: { deleted_at: null },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      release_date: true,
      announcement_date: true,
      product_family: {
        select: {
          name: true,
          slug: true,
          brand_org: {
            select: {
              name: true,
              slug: true,
            },
          },
          device_category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
      release_status: {
        select: {
          code: true,
        },
      },
    },
  });

  const documents: DeviceModelDocument[] = models.map((model) => ({
    id: model.id,
    name: model.name,
    slug: model.slug,
    description: model.description,
    release_date: model.release_date?.toISOString() ?? null,
    announcement_date: model.announcement_date?.toISOString() ?? null,
    brand_name: model.product_family.brand_org.name,
    brand_slug: model.product_family.brand_org.slug,
    category_name: model.product_family.device_category.name,
    category_slug: model.product_family.device_category.slug,
    family_name: model.product_family.name,
    family_slug: model.product_family.slug,
    release_status: model.release_status.code,
  }));

  await index.updateSearchableAttributes([
    "name",
    "slug",
    "description",
    "brand_name",
    "category_name",
    "family_name",
  ]);
  await index.updateFilterableAttributes([
    "brand_slug",
    "category_slug",
    "family_slug",
    "release_status",
  ]);
  await index.updateSortableAttributes([
    "release_date",
    "announcement_date",
    "name",
  ]);
  await index.addDocuments(documents, { primaryKey: "id" });

  console.log(
    `Synced ${documents.length} device models to Meilisearch index "${indexName}"`,
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
