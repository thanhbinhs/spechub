-- Chuyển toàn bộ điểm cấu hình hiện có sang chính sách benchmark-first v2.
-- Benchmark gốc luôn được ưu tiên; chỉ số cấu hình chỉ là dữ liệu dự phòng.
UPDATE "variant_module_scores"
SET
  "score_version" = 'benchmark-first-config-fallback-v2',
  "rationale" = 'Chỉ số cấu hình dự phòng khi thiết bị chưa có benchmark phù hợp; giao diện luôn ưu tiên điểm đo gốc cùng tên, phiên bản và hạng mục.',
  "factors" = COALESCE("factors", '{}'::jsonb) || jsonb_build_object(
    'scoring_policy', 'benchmark_first',
    'score_role', 'configuration_fallback'
  ),
  "updated_at" = CURRENT_TIMESTAMP
WHERE "score_source" = 'configuration_model';
