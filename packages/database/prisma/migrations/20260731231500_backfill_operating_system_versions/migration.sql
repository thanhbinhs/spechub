-- The admin hardware catalog historically stored concrete releases such as
-- "Android 16" only in operating_systems. Device software profiles reference
-- os_versions, so backfill one usable version for every OS record that has no
-- concrete release yet.
INSERT INTO "os_versions" (
  "id",
  "operating_system_id",
  "version_name",
  "release_date"
)
SELECT
  gen_random_uuid(),
  os."id",
  COALESCE(
    NULLIF(
      substring(os."name" FROM '([0-9]+([.][0-9]+)*)[[:space:]]*$'),
      ''
    ),
    os."name"
  ),
  os."initial_release_date"
FROM "operating_systems" os
WHERE NOT EXISTS (
  SELECT 1
  FROM "os_versions" version
  WHERE version."operating_system_id" = os."id"
)
ON CONFLICT ("operating_system_id", "version_name") DO NOTHING;
