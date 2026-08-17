export type MetricDirection = "higher" | "lower";
export type MetricScale = "linear" | "log";

export type MetricDefinition = {
  key: string;
  label: string;
  weight: number;
  min: number;
  max: number;
  direction?: MetricDirection;
  scale?: MetricScale;
};

export type ScoreModuleDefinition = {
  key: string;
  label: string;
  description: string;
  weight: number;
  metrics: MetricDefinition[];
};

export type ScoringProfile = {
  categorySlug: string;
  label: string;
  version: string;
  modules: ScoreModuleDefinition[];
};

export type RawMetric = {
  value: number;
  unit?: string;
  source:
    | "benchmark"
    | "specification"
    | "feature"
    | "derived"
    | "reference"
    | "manual";
  sourceLabel: string;
  normalizedScore?: number;
};

export type RawMetricBag = Record<string, RawMetric | undefined>;

export type CalculatedMetric = {
  key: string;
  label: string;
  value: number;
  unit?: string;
  score: number;
  weight: number;
  source: RawMetric["source"];
  sourceLabel: string;
};

export type CalculatedModuleScore = {
  key: string;
  label: string;
  description: string;
  score: number;
  weight: number;
  coverage: number;
  metrics: CalculatedMetric[];
};

export type CalculatedScorecard = {
  categorySlug: string;
  version: string;
  overallScore: number;
  coverage: number;
  source: "benchmark_mixed" | "specification_model";
  rawMetricCount: number;
  observedMetricCount: number;
  referenceMetricCount: number;
  modules: CalculatedModuleScore[];
};

export function calculateScorecard(
  profile: ScoringProfile,
  rawMetrics: RawMetricBag,
): CalculatedScorecard {
  assertProfile(profile);

  const modules = profile.modules.map((module) => {
    const totalMetricWeight = sum(
      module.metrics.map((metric) => metric.weight),
    );
    const metrics = module.metrics.map((definition) => {
      const raw = rawMetrics[definition.key];
      const effectiveRaw =
        raw && Number.isFinite(raw.value)
          ? raw
          : referenceMetric(profile, definition);

      return {
        key: definition.key,
        label: definition.label,
        value: effectiveRaw.value,
        unit: effectiveRaw.unit,
        score:
          effectiveRaw.normalizedScore === undefined
            ? normalizeMetric(effectiveRaw.value, definition)
            : clamp(effectiveRaw.normalizedScore),
        weight: definition.weight,
        source: effectiveRaw.source,
        sourceLabel: effectiveRaw.sourceLabel,
      } satisfies CalculatedMetric;
    });
    const availableWeight = sum(metrics.map((metric) => metric.weight));
    const score = availableWeight
      ? (sum(metrics.map((metric) => metric.score * metric.weight)) +
          (totalMetricWeight - availableWeight) * 50) /
        totalMetricWeight
      : 0;

    return {
      key: module.key,
      label: module.label,
      description: module.description,
      score: round(score),
      weight: module.weight,
      coverage: round((availableWeight / totalMetricWeight) * 100),
      metrics,
    } satisfies CalculatedModuleScore;
  });

  const availableModules = modules.filter((module) => module.metrics.length);
  const availableModuleWeight = sum(
    availableModules.map((module) => module.weight),
  );
  const overallScore = availableModuleWeight
    ? sum(availableModules.map((module) => module.score * module.weight)) /
      availableModuleWeight
    : 0;
  const coverage = sum(
    modules.map((module) => module.weight * (module.coverage / 100)),
  );
  const rawMetricCount = new Set(
    modules.flatMap((module) => module.metrics.map((metric) => metric.key)),
  ).size;
  const observedMetricCount = new Set(
    modules.flatMap((module) =>
      module.metrics
        .filter((metric) => metric.source !== "reference")
        .map((metric) => metric.key),
    ),
  ).size;
  const referenceMetricCount = rawMetricCount - observedMetricCount;
  const hasBenchmark = modules.some((module) =>
    module.metrics.some((metric) => metric.source === "benchmark"),
  );

  return {
    categorySlug: profile.categorySlug,
    version: profile.version,
    overallScore: round(overallScore),
    coverage: round(coverage),
    source: hasBenchmark ? "benchmark_mixed" : "specification_model",
    rawMetricCount,
    observedMetricCount,
    referenceMetricCount,
    modules,
  };
}

function referenceMetric(
  profile: ScoringProfile,
  definition: MetricDefinition,
): RawMetric {
  return {
    value: 50,
    unit: "/100",
    source: "reference",
    sourceLabel: `Mốc trung tính cho ${definition.label} trong hồ sơ ${profile.label}; chưa có dữ liệu đo trực tiếp`,
    normalizedScore: 50,
  };
}

export function normalizeMetric(
  value: number,
  definition: Pick<MetricDefinition, "min" | "max" | "direction" | "scale">,
) {
  if (!Number.isFinite(value) || definition.max <= definition.min) return 0;

  const scale = definition.scale ?? "linear";
  const transform = (input: number) =>
    scale === "log" ? Math.log1p(Math.max(0, input)) : input;
  const min = transform(definition.min);
  const max = transform(definition.max);
  const normalized = (transform(value) - min) / (max - min);
  const directed =
    (definition.direction ?? "higher") === "lower"
      ? 1 - normalized
      : normalized;

  return round(clamp(directed * 100));
}

function assertProfile(profile: ScoringProfile) {
  const moduleWeight = sum(profile.modules.map((module) => module.weight));
  if (Math.abs(moduleWeight - 100) > 0.001) {
    throw new Error(
      `Trọng số scorecard ${profile.categorySlug} phải bằng 100; hiện tại ${moduleWeight}.`,
    );
  }
  for (const module of profile.modules) {
    const metricWeight = sum(module.metrics.map((metric) => metric.weight));
    if (Math.abs(metricWeight - 100) > 0.001) {
      throw new Error(
        `Trọng số nhóm ${profile.categorySlug}/${module.key} phải bằng 100; hiện tại ${metricWeight}.`,
      );
    }
  }
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
