import { Activity, Gauge } from "lucide-react";
import type {
  VariantPerformanceResult,
  VariantScorecard,
} from "@spechub/api-client";
import {
  benchmarkMethodLabel,
  benchmarkProvenanceLabel,
  calculateConfigurationIndex,
  configurationVersionLabel,
  explainBenchmarkMetric,
  formatBenchmarkScore,
  formatConfigurationScore,
  selectPrimaryBenchmarks,
  type BenchmarkMetric,
  type ConfigurationScoreRecord,
} from "@/lib/device-benchmark";

export function CatalogScorePair({
  benchmarks,
  scores,
  categorySlug,
  className = "",
  compact = false,
}: {
  benchmarks?: VariantPerformanceResult[] | null;
  scores?: ConfigurationScoreRecord[] | null;
  categorySlug?: string | null;
  className?: string;
  compact?: boolean;
}) {
  const metrics = selectPrimaryBenchmarks(benchmarks, categorySlug, 2);
  const configuration = calculateConfigurationIndex(scores);

  if (!metrics.length) {
    if (configuration) {
      return (
        <div
          className={`flex items-center justify-between gap-4 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-3 ${className}`}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-blue-700">
              <Gauge size={17} />
            </span>
            <span className="min-w-0">
              <strong className="block text-xs font-semibold text-slate-800">
                Chỉ số cấu hình
              </strong>
              <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                SpecHub {configurationVersionLabel(configuration.version)} ·
                chưa phải benchmark
              </span>
            </span>
          </span>
          <span className="shrink-0 text-right">
            <strong className="block text-2xl font-bold leading-none text-blue-800">
              {formatConfigurationScore(configuration.score)}
            </strong>
            <span className="mt-1 block text-[10px] font-medium text-blue-700">
              {configuration.coverage
                ? `${configuration.coverage}% dữ liệu`
                : "tham khảo"}
            </span>
          </span>
        </div>
      );
    }

    return (
      <div
        className={`flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-3 ${className}`}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white text-slate-400">
          <Gauge size={16} />
        </span>
        <span className="min-w-0">
          <strong className="block text-xs font-semibold text-slate-700">
            Chưa có kết quả benchmark
          </strong>
          <span className="mt-0.5 block text-[11px] text-slate-500">
            Không tự quy đổi từ thông số cấu hình.
          </span>
        </span>
      </div>
    );
  }

  return (
    <div
      className={`grid overflow-hidden rounded-xl border border-slate-200 bg-white ${
        metrics.length > 1
          ? compact
            ? "grid-cols-2 divide-x divide-slate-200"
            : "grid-cols-1 divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0"
          : "grid-cols-1"
      } ${className}`}
    >
      {metrics.map((metric, index) => (
        <BenchmarkMetricView
          key={metric.key}
          metric={metric}
          icon={index === 0 ? <Gauge size={15} /> : <Activity size={15} />}
          compact={compact}
        />
      ))}
    </div>
  );
}

export function CatalogScoreBadge({
  benchmarks,
  scores,
  scorecards,
  categorySlug,
}: {
  benchmarks?: VariantPerformanceResult[] | null;
  scores?: ConfigurationScoreRecord[] | null;
  scorecards?: VariantScorecard[] | null;
  categorySlug?: string | null;
}) {
  const scorecard = scorecards?.[0];
  const metric = selectPrimaryBenchmarks(benchmarks, categorySlug, 1)[0];
  const configuration = calculateConfigurationIndex(scores);

  if (scorecard) {
    const score = Number(scorecard.overall_score);
    const coverage = Number(scorecard.coverage_percent);
    return (
      <span
        className="inline-flex min-w-24 max-w-32 flex-col items-center rounded-lg bg-slate-950 px-2.5 py-2 text-center text-white shadow-sm"
        title={`Điểm tổng SpecHub theo loại sản phẩm; độ phủ dữ liệu ${coverage.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`}
      >
        <span className="flex items-baseline gap-0.5">
          <strong className="text-lg font-bold leading-none">
            {score.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}
          </strong>
          <span className="text-[9px] font-semibold text-slate-400">/100</span>
        </span>
        <span className="mt-1 max-w-full truncate text-[10px] font-medium text-slate-300">
          Điểm tổng
        </span>
      </span>
    );
  }

  if (!metric) {
    if (configuration) {
      return (
        <span
          className="inline-flex min-w-24 max-w-32 flex-col items-center rounded-lg bg-blue-50 px-2.5 py-2 text-center text-blue-800"
          title={`Chỉ số cấu hình SpecHub ${configurationVersionLabel(configuration.version)}; không phải kết quả benchmark`}
        >
          <span className="text-lg font-bold leading-none">
            {formatConfigurationScore(configuration.score)}
          </span>
          <span className="mt-1 max-w-full truncate text-[10px] font-medium">
            Chỉ số cấu hình
          </span>
        </span>
      );
    }

    return (
      <span className="inline-flex min-w-24 flex-col items-center rounded-lg bg-slate-100 px-2.5 py-2 text-slate-500">
        <span className="text-xs font-semibold">Chưa có</span>
        <span className="mt-1 text-[10px] font-medium">benchmark</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex min-w-24 max-w-32 flex-col items-center rounded-lg bg-slate-950 px-2.5 py-2 text-center text-white shadow-sm"
      title={`${metric.label}: ${formatBenchmarkScore(metric.score)} ${metric.unit}`}
    >
      <span className="text-lg font-bold leading-none">
        {formatBenchmarkScore(metric.score)}
      </span>
      <span className="mt-1 max-w-full truncate text-[10px] font-medium text-slate-300">
        {metric.shortLabel}
      </span>
    </span>
  );
}

function BenchmarkMetricView({
  compact,
  icon,
  metric,
}: {
  compact: boolean;
  icon: React.ReactNode;
  metric: BenchmarkMetric;
}) {
  const explanation = explainBenchmarkMetric(metric);
  const provenance = benchmarkProvenanceLabel(metric);
  const method = benchmarkMethodLabel(metric);
  const subscore = (metric.record.subscore_name ?? "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const tone =
    subscore === "multi_core"
      ? {
          icon: "bg-violet-50 text-violet-700",
          title: "text-violet-800",
          rule: "bg-violet-500",
        }
      : subscore === "single_core"
        ? {
            icon: "bg-sky-50 text-sky-700",
            title: "text-sky-800",
            rule: "bg-sky-500",
          }
        : {
            icon: "bg-rose-50 text-rose-700",
            title: "text-rose-800",
            rule: "bg-rose-500",
          };
  const isMeasured = provenance === "Kết quả đo";

  if (compact) {
    return (
      <div className="relative min-w-0 px-3 py-3">
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 top-0 h-0.5 ${tone.rule}`}
        />
        <div
          className={`flex items-center gap-1.5 text-[11px] font-semibold ${tone.title}`}
        >
          <span className={`grid h-6 w-6 place-items-center rounded-md ${tone.icon}`}>
            {icon}
          </span>
          <span className="truncate">{explanation.title}</span>
        </div>
        <div className="mt-2 flex min-w-0 items-baseline gap-1">
          <strong className="truncate text-xl font-bold tracking-tight text-slate-950">
            {formatBenchmarkScore(metric.score)}
          </strong>
          <span className="shrink-0 text-[10px] font-medium text-slate-400">
            {metric.unit}
          </span>
        </div>
        <div className="mt-1 truncate text-[10px] text-slate-500" title={method}>
          {provenance}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-w-0 p-4 sm:p-5">
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1 ${tone.rule}`}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className={`flex items-center gap-2 text-sm font-semibold ${tone.title}`}>
          <span className={`grid h-8 w-8 place-items-center rounded-lg ${tone.icon}`}>
            {icon}
          </span>
          {explanation.title}
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            isMeasured
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          {provenance}
        </span>
      </div>
      <div className="mt-3 flex min-w-0 items-baseline gap-1.5">
        <strong className="truncate text-3xl font-bold tracking-tight text-slate-950">
          {formatBenchmarkScore(metric.score)}
        </strong>
        <span className="shrink-0 text-xs font-medium text-slate-400">
          {metric.unit}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-600">
        {explanation.purpose}
      </p>
      <div className="mt-3 border-t border-slate-100 pt-3">
        <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Phép đo
        </span>
        <strong className="mt-1 block text-xs font-medium leading-5 text-slate-700">
          {method}
        </strong>
      </div>
    </div>
  );
}
