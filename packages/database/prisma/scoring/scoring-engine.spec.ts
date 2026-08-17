import assert from "node:assert/strict";
import test from "node:test";
import {
  AUTOMATIC_DEVICE_SCORE_VERSION,
  calculateScorecard,
  extractAutomaticDeviceMetrics,
  type ScoringProfile,
} from "./scoring-engine";
import { SCORING_PROFILES } from "./scoring-profiles";

const profile: ScoringProfile = {
  categorySlug: "test-device",
  label: "Thiết bị thử nghiệm",
  version: "test-v1",
  modules: [
    {
      key: "performance",
      label: "Hiệu năng",
      description: "Kiểm tra dữ liệu đầu vào.",
      weight: 100,
      metrics: [
        {
          key: "cpu_single",
          label: "CPU đơn nhân",
          weight: 50,
          min: 100,
          max: 1000,
        },
        {
          key: "gpu",
          label: "Đồ họa",
          weight: 50,
          min: 0,
          max: 100,
        },
      ],
    },
  ],
};

test("bổ sung mốc tham chiếu để scorecard luôn phủ 100%", () => {
  const result = calculateScorecard(profile, {
    cpu_single: {
      value: 550,
      source: "benchmark",
      sourceLabel: "Benchmark thử nghiệm",
    },
  });

  assert.equal(result.coverage, 100);
  assert.equal(result.modules[0]?.coverage, 100);
  assert.equal(result.rawMetricCount, 2);
  assert.equal(result.observedMetricCount, 1);
  assert.equal(result.referenceMetricCount, 1);
  assert.equal(result.modules[0]?.metrics[1]?.source, "reference");
  assert.equal(result.modules[0]?.metrics[1]?.score, 50);
});

test("giữ nguyên dữ liệu đo thực khi đã có đủ chỉ số", () => {
  const result = calculateScorecard(profile, {
    cpu_single: {
      value: 1000,
      source: "benchmark",
      sourceLabel: "CPU benchmark",
    },
    gpu: {
      value: 80,
      source: "specification",
      sourceLabel: "Thông số GPU",
    },
  });

  assert.equal(result.coverage, 100);
  assert.equal(result.referenceMetricCount, 0);
  assert.equal(result.observedMetricCount, 2);
  assert.equal(result.modules[0]?.metrics[0]?.source, "benchmark");
  assert.equal(result.modules[0]?.metrics[1]?.source, "specification");
});

test("ưu tiên điểm chuẩn hóa do quản trị viên nhập và giữ nguồn thủ công", () => {
  const result = calculateScorecard(profile, {
    cpu_single: {
      value: 550,
      source: "manual",
      sourceLabel: "Quản trị viên kiểm duyệt",
      normalizedScore: 82.5,
    },
    gpu: {
      value: 70,
      source: "manual",
      sourceLabel: "Phiếu đánh giá nội bộ",
    },
  });

  assert.equal(result.overallScore, 76.3);
  assert.equal(result.modules[0]?.metrics[0]?.score, 82.5);
  assert.equal(result.modules[0]?.metrics[0]?.source, "manual");
  assert.equal(result.modules[0]?.metrics[1]?.score, 70);
  assert.equal(result.referenceMetricCount, 0);
});

test("mọi hồ sơ danh mục đều có tổng trọng số hợp lệ", () => {
  for (const scoringProfile of Object.values(SCORING_PROFILES)) {
    const result = calculateScorecard(scoringProfile, {});
    assert.equal(result.overallScore, 50);
    assert.equal(result.coverage, 100);
  }
});

test("tự suy ra metric từ module và gom nhiều tùy chọn dung lượng", () => {
  const metrics = extractAutomaticDeviceMetrics(
    {
      variant_chipsets: [
        {
          is_primary: true,
          chipset: {
            name: "SoC thử nghiệm",
            process_node: { node_nm: 3 },
            chipset_cpu_links: [
              {
                is_primary: true,
                cpu: {
                  name: "CPU thử nghiệm",
                  core_count: 8,
                  max_frequency_mhz: 3600,
                },
              },
            ],
            chipset_gpu_links: [
              {
                is_primary: true,
                gpu: { name: "GPU thử nghiệm", fp32_gflops: 4200 },
              },
            ],
            chipset_npu_links: [
              {
                is_primary: true,
                npu: { name: "NPU thử nghiệm", tops: 45 },
              },
            ],
          },
        },
      ],
      variant_memory_configs: [
        { capacity_gb: 8, memory_standard: { name: "LPDDR5X" } },
        { capacity_gb: 16, memory_standard: { name: "LPDDR5X" } },
      ],
      variant_storage_configs: [
        { total_capacity_gb: 256, storage_standard: { name: "UFS 4.0" } },
        { total_capacity_gb: 512, storage_standard: { name: "UFS 4.0" } },
      ],
    },
    "smartphone",
  );

  assert.equal(AUTOMATIC_DEVICE_SCORE_VERSION, "automatic-device-score-v1.0.0");
  assert.equal(metrics.cpu_single?.source, "derived");
  assert.equal(metrics.gpu?.source, "specification");
  assert.equal(metrics.npu_tops?.value, 45);
  assert.equal(metrics.memory_capacity?.value, 16);
  assert.equal(metrics.storage_capacity?.value, 512);
});
