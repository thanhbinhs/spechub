import type { VariantPerformanceResult } from "@spechub/api-client";

export type BenchmarkMetric = {
  key: string;
  label: string;
  shortLabel: string;
  score: number;
  unit: string;
  higherIsBetter: boolean;
  record: VariantPerformanceResult;
};

export type BenchmarkMetricExplanation = {
  title: string;
  purpose: string;
};

export type ConfigurationScoreRecord = {
  module_kind: string;
  module_id?: string | null;
  score: string | number;
  score_source?: string | null;
  score_version?: string | null;
};

export type ConfigurationIndex = {
  score: number;
  coverage: number;
  version: string;
};

const CONFIGURATION_WEIGHTS: Record<string, number> = {
  chipset: 20,
  cpu: 25,
  gpu: 20,
  npu: 10,
  "memory-standard": 15,
  "storage-standard": 10,
};

const SUBSCORE_LABELS: Record<string, string> = {
  overall: "Tổng",
  total: "Tổng",
  single_core: "Đơn nhân",
  singlecore: "Đơn nhân",
  multi_core: "Đa nhân",
  multicore: "Đa nhân",
  cpu: "CPU",
  gpu: "GPU",
  opencl: "OpenCL",
  memory: "Bộ nhớ",
  ux: "Trải nghiệm",
  claimed_runtime: "Thời lượng tham chiếu",
  input_lag_4k_120hz: "Độ trễ 4K 120 Hz",
};

export function selectPrimaryBenchmarks(
  records: VariantPerformanceResult[] | null | undefined,
  categorySlug?: string | null,
  limit = 2,
) {
  const metrics = validMetrics(records);
  const category = (categorySlug ?? "").toLowerCase();

  return metrics
    .sort(
      (left, right) =>
        benchmarkPriority(left, category) -
          benchmarkPriority(right, category) ||
        left.label.localeCompare(right.label, "vi"),
    )
    .filter(
      (metric, index, all) =>
        all.findIndex((candidate) => candidate.key === metric.key) === index,
    )
    .slice(0, limit);
}

export function findCommonBenchmarks(
  leftRecords: VariantPerformanceResult[] | null | undefined,
  rightRecords: VariantPerformanceResult[] | null | undefined,
) {
  const right = new Map(
    validMetrics(rightRecords).map((metric) => [metric.key, metric]),
  );

  return validMetrics(leftRecords)
    .flatMap((left) => {
      const peer = right.get(left.key);
      return peer ? [{ key: left.key, left, right: peer }] : [];
    })
    .sort(
      (left, rightMetric) =>
        benchmarkPriority(left.left, "") -
          benchmarkPriority(rightMetric.left, "") ||
        left.left.label.localeCompare(rightMetric.left.label, "vi"),
    );
}

export function benchmarkMetric(
  record: VariantPerformanceResult,
): BenchmarkMetric | null {
  const score = Number(record.score);
  if (!Number.isFinite(score)) return null;

  const subscore = localizeSubscore(record.subscore_name);
  const version = record.benchmark.version?.trim();
  const benchmarkName = [
    record.benchmark.name,
    version && !record.benchmark.name.includes(version) ? version : null,
  ]
    .filter(Boolean)
    .join(" ");
  const label = [subscore, benchmarkName].filter(Boolean).join(" · ");
  const shortLabel = [
    subscore,
    cleanBenchmarkName(record.benchmark.name),
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    key: benchmarkComparisonKey(record),
    label,
    shortLabel,
    score,
    unit: localizeUnit(record.benchmark.unit?.symbol),
    higherIsBetter: record.benchmark.higher_is_better,
    record,
  };
}

export function benchmarkComparisonKey(record: VariantPerformanceResult) {
  return [
    record.benchmark.slug,
    record.benchmark.version ?? "",
    normalizeSubscore(record.subscore_name),
  ].join(":");
}

export function formatBenchmarkScore(score: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits,
  }).format(score);
}

export function formatBenchmarkValue(metric: BenchmarkMetric) {
  return `${formatBenchmarkScore(metric.score)} ${metric.unit}`;
}

export function explainBenchmarkMetric(
  metric: BenchmarkMetric,
): BenchmarkMetricExplanation {
  const subscore = normalizeSubscore(metric.record.subscore_name);
  const benchmarkType = metric.record.benchmark.benchmark_type.toLowerCase();

  if (subscore === "multi_core") {
    return {
      title: "Điểm đa nhân",
      purpose:
        "Đánh giá khả năng xử lý nhiều tác vụ hoặc công việc nặng cùng lúc.",
    };
  }
  if (subscore === "single_core") {
    return {
      title: "Điểm đơn nhân",
      purpose:
        "Phản ánh độ nhanh khi mở ứng dụng, phản hồi và xử lý một tác vụ.",
    };
  }
  if (subscore === "opencl" || benchmarkType === "gpu") {
    return {
      title: "Điểm đồ họa",
      purpose:
        "Đánh giá xử lý hình ảnh, hiệu ứng và các tác vụ tính toán song song.",
    };
  }
  if (subscore === "claimed_runtime" || benchmarkType === "battery") {
    return {
      title: "Thời lượng pin",
      purpose: "Thời gian sử dụng theo điều kiện thử hoặc công bố tương ứng.",
    };
  }
  if (subscore === "input_lag_4k_120hz" || benchmarkType === "latency") {
    return {
      title: "Độ trễ đầu vào",
      purpose:
        "Thời gian từ thao tác điều khiển đến hình ảnh; giá trị thấp hơn tốt hơn.",
    };
  }
  if (isOverall(subscore)) {
    return {
      title: "Điểm hiệu năng tổng",
      purpose:
        "Tổng hợp sức mạnh xử lý, đồ họa, bộ nhớ và trải nghiệm của thiết bị.",
    };
  }
  if (benchmarkType === "cpu") {
    return {
      title: "Điểm bộ xử lý",
      purpose: "Đánh giá năng lực tính toán của bộ xử lý trong thiết bị.",
    };
  }

  return {
    title: metric.shortLabel,
    purpose: "Kết quả của phép đo hiệu năng tương ứng trên thiết bị.",
  };
}

export function benchmarkProvenanceLabel(metric: BenchmarkMetric) {
  const slug = metric.record.benchmark.slug.toLowerCase();
  if (slug.includes("chipset-reference")) return "Tham chiếu chipset";
  if (slug.includes("manufacturer") && slug.includes("reference")) {
    return "Tham chiếu hãng";
  }
  if (slug.includes("input-lag") && slug.includes("reference")) {
    return "Tham chiếu phòng thử";
  }
  if (slug.includes("reference")) return "Điểm tham chiếu";
  return "Kết quả đo";
}

export function benchmarkMethodLabel(metric: BenchmarkMetric) {
  const benchmark = metric.record.benchmark;
  const name = cleanBenchmarkName(benchmark.name);
  const version = benchmark.version?.trim();

  const referenceVersion = version?.match(
    /(?:ref|claim)-(\d{4})\.(\d{2})$/i,
  );
  if (referenceVersion) {
    return `${name} · dữ liệu ${referenceVersion[2]}/${referenceVersion[1]}`;
  }
  if (version === "source-protocol") {
    return `${name} · theo giao thức nguồn`;
  }
  if (version && !name.toLowerCase().includes(version.toLowerCase())) {
    return `${name} ${version}`;
  }
  return name;
}

export function benchmarkWinnerIndex(
  values: [BenchmarkMetric, BenchmarkMetric],
) {
  const [left, right] = values;
  if (left.score === right.score) return undefined;
  if (left.higherIsBetter) return left.score > right.score ? 0 : 1;
  return left.score < right.score ? 0 : 1;
}

export function benchmarkDeltaText(values: [BenchmarkMetric, BenchmarkMetric]) {
  const [left, right] = values;
  if (left.score === right.score) {
    return "Hai thiết bị có cùng kết quả ở phép đo này.";
  }
  const better = left.higherIsBetter
    ? Math.max(left.score, right.score)
    : Math.min(left.score, right.score);
  const other = left.higherIsBetter
    ? Math.min(left.score, right.score)
    : Math.max(left.score, right.score);
  const percent =
    other > 0 ? Math.round((Math.abs(better - other) / other) * 100) : 0;
  return `Kết quả tốt hơn chênh khoảng ${percent}% trong cùng phép đo.`;
}

export function calculateConfigurationIndex(
  records: ConfigurationScoreRecord[] | null | undefined,
): ConfigurationIndex | null {
  const grouped = new Map<string, number[]>();
  for (const record of records ?? []) {
    const score = Number(record.score);
    if (!Number.isFinite(score)) continue;
    const current = grouped.get(record.module_kind) ?? [];
    current.push(score);
    grouped.set(record.module_kind, current);
  }

  let weightedTotal = 0;
  let availableWeight = 0;
  for (const [kind, weight] of Object.entries(CONFIGURATION_WEIGHTS)) {
    const values = grouped.get(kind);
    if (!values?.length) continue;
    weightedTotal += average(values) * weight;
    availableWeight += weight;
  }

  if (!availableWeight) {
    const values = [...grouped.values()].flat();
    if (!values.length) return null;
    weightedTotal = average(values);
    availableWeight = 1;
  }

  const totalWeight = Object.values(CONFIGURATION_WEIGHTS).reduce(
    (total, weight) => total + weight,
    0,
  );
  const version =
    (records ?? []).find((record) => record.score_version)?.score_version ??
    "v1";

  return {
    score: Math.round((weightedTotal / availableWeight) * 10) / 10,
    coverage:
      availableWeight === 1
        ? 0
        : Math.round((availableWeight / totalWeight) * 100),
    version,
  };
}

export function formatConfigurationScore(score: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
  }).format(score);
}

export function configurationVersionLabel(version?: string | null) {
  if (!version) return "v1";
  const match = version.match(/v(\d+)$/i);
  return match ? `v${match[1]}` : version;
}

function validMetrics(records: VariantPerformanceResult[] | null | undefined) {
  return (records ?? [])
    .map(benchmarkMetric)
    .filter((metric): metric is BenchmarkMetric => metric !== null);
}

function benchmarkPriority(metric: BenchmarkMetric, category: string) {
  const slug = metric.record.benchmark.slug.toLowerCase();
  const type = metric.record.benchmark.benchmark_type.toLowerCase();
  const subscore = normalizeSubscore(metric.record.subscore_name);
  const mobile =
    category.includes("smartphone") ||
    category.includes("phone") ||
    category.includes("tablet");

  if (slug.includes("antutu") && isOverall(subscore) && (mobile || !category)) {
    return 0;
  }
  if (
    slug.includes("geekbench") &&
    !slug.includes("reference") &&
    subscore === "multi_core"
  ) {
    return 10;
  }
  if (
    slug.includes("geekbench") &&
    !slug.includes("reference") &&
    subscore === "single_core"
  ) {
    return 11;
  }
  if (slug.includes("geekbench") && subscore === "multi_core") return 14;
  if (slug.includes("geekbench") && subscore === "single_core") return 15;
  if (type === "system" && isOverall(subscore)) return 20;
  if (type === "gpu") return 30;
  if (type === "cpu") return 40;
  if (type === "battery") return 80;
  return 60;
}

function normalizeSubscore(value?: string | null) {
  return (value ?? "overall")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function localizeSubscore(value?: string | null) {
  const normalized = normalizeSubscore(value);
  return SUBSCORE_LABELS[normalized] ?? value?.trim() ?? "Tổng";
}

function isOverall(value: string) {
  return value === "overall" || value === "total";
}

function localizeUnit(value?: string | null) {
  const unit = value?.trim();
  if (!unit || /^(points?|pts?)$/i.test(unit)) return "điểm";
  return unit;
}

function cleanBenchmarkName(value: string) {
  return value
    .replace(/\s*·\s*tham chiếu chipset\s*$/i, "")
    .replace(/\s*·\s*tham chiếu hãng\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function average(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}
