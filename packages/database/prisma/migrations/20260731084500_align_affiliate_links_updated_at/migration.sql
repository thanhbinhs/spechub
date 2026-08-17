-- Keep the database definition aligned with Prisma's @updatedAt behavior.
ALTER TABLE "affiliate_links"
  ALTER COLUMN "updated_at" DROP DEFAULT;
