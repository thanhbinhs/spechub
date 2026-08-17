-- These tables are introduced by the later
-- 20260727090000_category_scorecards_v3 migration. Keep this migration
-- replayable for databases where the tables already existed, while allowing
-- a clean shadow database to continue to the table-creation migration.
DO $$
BEGIN
    IF to_regclass('public.variant_scorecard_modules') IS NOT NULL THEN
        ALTER TABLE "variant_scorecard_modules"
            ALTER COLUMN "id" DROP DEFAULT,
            ALTER COLUMN "updated_at" DROP DEFAULT;
    END IF;

    IF to_regclass('public.variant_scorecards') IS NOT NULL THEN
        ALTER TABLE "variant_scorecards"
            ALTER COLUMN "id" DROP DEFAULT,
            ALTER COLUMN "updated_at" DROP DEFAULT;
    END IF;
END
$$;
