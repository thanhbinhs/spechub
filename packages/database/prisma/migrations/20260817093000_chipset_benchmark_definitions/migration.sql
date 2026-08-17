-- Benchmark definitions used by the chipset creation workflow.
-- Keep versions separate because AnTuTu scores are not comparable across versions.
INSERT INTO "units" ("id", "symbol", "name", "quantity_type")
VALUES (gen_random_uuid(), 'points', 'benchmark points', 'dimensionless')
ON CONFLICT ("symbol") DO UPDATE SET
  "name" = EXCLUDED."name",
  "quantity_type" = EXCLUDED."quantity_type";

INSERT INTO "benchmarks" (
  "id",
  "name",
  "slug",
  "benchmark_type",
  "target_type",
  "version",
  "higher_is_better",
  "unit_id",
  "description"
)
SELECT
  gen_random_uuid(),
  definition.name,
  definition.slug,
  definition.benchmark_type,
  'chipset',
  definition.version,
  true,
  units.id,
  definition.description
FROM (
  VALUES
    (
      'AnTuTu Benchmark · chipset',
      'antutu-v10-chipset',
      'system',
      '10',
      'Điểm tham chiếu AnTuTu v10 của chipset. Lưu overall, CPU, GPU, memory và UX bằng subscore_name.'
    ),
    (
      'AnTuTu Benchmark · chipset',
      'antutu-v11-chipset',
      'system',
      '11',
      'Điểm tham chiếu AnTuTu v11 của chipset. Lưu overall, CPU, GPU, memory và UX bằng subscore_name.'
    ),
    (
      'Geekbench 6 CPU · chipset',
      'geekbench-6-cpu-chipset',
      'cpu',
      '6',
      'Điểm CPU tham chiếu của chipset; dùng subscore_name single_core và multi_core.'
    )
) AS definition(name, slug, benchmark_type, version, description)
JOIN "units" ON "units"."symbol" = 'points'
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "benchmark_type" = EXCLUDED."benchmark_type",
  "target_type" = EXCLUDED."target_type",
  "version" = EXCLUDED."version",
  "higher_is_better" = EXCLUDED."higher_is_better",
  "unit_id" = EXCLUDED."unit_id",
  "description" = EXCLUDED."description";
