import { ChevronDown, Database, Gauge } from "lucide-react";
import type {
  VariantScorecard,
  VariantScorecardMetric,
} from "@spechub/api-client";

export function DeviceScorecardSummary({
  scorecards,
  className = "",
}: {
  scorecards?: VariantScorecard[] | null;
  className?: string;
}) {
  const scorecard = scorecards?.[0];

  if (!scorecard) {
    return (
      <div
        className={`flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 ${className}`}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-slate-400">
          <Gauge size={17} />
        </span>
        <span>
          <strong className="block text-sm font-semibold text-slate-700">
            Chưa có điểm tổng SpecHub
          </strong>
          <span className="mt-0.5 line-clamp-1 block text-xs text-slate-500">
            Cần chạy cập nhật dữ liệu chấm điểm mới.
          </span>
        </span>
      </div>
    );
  }

  const score = numeric(scorecard.overall_score);
  const tone = scoreTone(score);

  return (
    <div
      className={`overflow-hidden rounded-lg border border-slate-200 bg-white ${className}`}
    >
      <div className={`p-3 ${tone.surface}`}>
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white shadow-sm ring-1 ring-black/5 ${tone.text}`}
          >
            <Gauge size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-slate-900">
              Điểm SpecHub
            </span>
          </span>
          <span className="shrink-0 whitespace-nowrap text-right">
            <strong className={`text-2xl font-bold leading-none ${tone.text}`}>
              {formatScore(score)}
            </strong>
            <span className="ml-1 text-[11px] font-semibold text-slate-500">
              /100
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function DeviceScorecard({
  scorecards,
  className = "",
}: {
  scorecards?: VariantScorecard[] | null;
  className?: string;
}) {
  const scorecard = scorecards?.[0];
  if (!scorecard) return null;

  const modules = [...(scorecard.module_scores ?? [])].sort(
    (left, right) =>
      numeric(right.weight_percent) - numeric(left.weight_percent),
  );

  return (
    <section
      id="scorecard"
      className={`scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
            <Database size={13} />
            {sourceLabel(scorecard.score_source)}
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-600">
            Phiên bản {versionLabel(scorecard.score_version)}
          </span>
        </div>

        <div className="columns-1 gap-4 lg:columns-2">
          {modules.map((module) => {
            const score = numeric(module.score);
            const metrics = metricArray(module.raw_metrics);
            const tone = scoreTone(score);

            return (
              <article
                key={module.id}
                className="mb-4 inline-block w-full break-inside-avoid overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60 align-top shadow-sm"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-950">
                          {module.module_name}
                        </h3>
                        <span className="rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate-500 shadow-sm">
                          Trọng số {formatScore(module.weight_percent)}%
                        </span>
                      </div>
                      {module.rationale ? (
                        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">
                          {module.rationale}
                        </p>
                      ) : null}
                    </div>
                    <div
                      className={`shrink-0 whitespace-nowrap text-right ${tone.text}`}
                    >
                      <strong className="text-2xl font-bold">
                        {formatScore(score)}
                      </strong>
                      <span className="ml-1 text-[10px] font-semibold">
                        /100
                      </span>
                    </div>
                  </div>
                </div>

                {metrics.length ? (
                  <details className="group border-t border-slate-200 bg-white">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-semibold text-slate-700 marker:content-none sm:px-5">
                      <span>{metrics.length} chỉ số cấu thành</span>
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-blue-700">
                        <span className="group-open:hidden">Xem chi tiết</span>
                        <span className="hidden group-open:inline">
                          Thu gọn
                        </span>
                        <ChevronDown
                          size={14}
                          className="transition-transform group-open:rotate-180"
                        />
                      </span>
                    </summary>
                    <div className="divide-y divide-slate-100 border-t border-slate-100 px-4 sm:px-5">
                      {metrics.map((metric) => (
                        <MetricRow key={metric.key} metric={metric} />
                      ))}
                    </div>
                  </details>
                ) : (
                  <div className="border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 sm:px-5">
                    Chưa đủ chỉ số gốc cho nhóm này.
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MetricRow({ metric }: { metric: VariantScorecardMetric }) {
  return (
    <div className="grid gap-2 py-3 text-xs sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
      <div className="min-w-0">
        <strong className="block font-semibold text-slate-800">
          {metric.label}
        </strong>
        <span className="mt-0.5 block text-[10px] leading-4 text-slate-500">
          {metric.sourceLabel} · {metricSourceLabel(metric.source)} · trọng số{" "}
          {formatScore(metric.weight)}%
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3 sm:block sm:text-right">
        <strong className="block font-semibold text-slate-900">
          {formatRawValue(metric.value)} {metric.unit ?? ""}
        </strong>
        <span className="mt-0.5 block text-[10px] font-semibold text-blue-700">
          Chuẩn hóa {formatScore(metric.score)}/100
        </span>
      </div>
    </div>
  );
}

function metricArray(value: unknown): VariantScorecardMetric[] {
  return Array.isArray(value) ? (value as VariantScorecardMetric[]) : [];
}

function numeric(value: string | number | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatScore(value: string | number) {
  return numeric(value).toLocaleString("vi-VN", {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number(value) % 1 ? 1 : 0,
  });
}

function formatRawValue(value: number) {
  return value.toLocaleString("vi-VN", {
    maximumFractionDigits: 2,
  });
}

function sourceLabel(source: string) {
  if (source === "benchmark_mixed") return "Benchmark + thông số";
  if (source === "manual_mixed") return "Quản trị nhập + công thức";
  return "Thông số đã chuẩn hóa";
}

function metricSourceLabel(source: VariantScorecardMetric["source"]) {
  const labels: Record<VariantScorecardMetric["source"], string> = {
    benchmark: "Benchmark",
    specification: "Thông số",
    feature: "Tính năng",
    derived: "Suy ra có kiểm soát",
    reference: "Mốc tham chiếu",
    manual: "Quản trị nhập",
  };
  return labels[source];
}

function versionLabel(version: string) {
  return version.replace(/^category-scorecard-v/i, "");
}

function scoreTone(score: number) {
  if (score >= 80) {
    return {
      surface: "bg-emerald-50",
      text: "text-emerald-700",
      bar: "bg-emerald-500",
    };
  }
  if (score >= 65) {
    return {
      surface: "bg-blue-50",
      text: "text-blue-700",
      bar: "bg-blue-500",
    };
  }
  if (score >= 50) {
    return {
      surface: "bg-amber-50",
      text: "text-amber-700",
      bar: "bg-amber-500",
    };
  }
  return {
    surface: "bg-rose-50",
    text: "text-rose-700",
    bar: "bg-rose-500",
  };
}
