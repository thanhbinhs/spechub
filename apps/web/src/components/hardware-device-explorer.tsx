"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  GitCompareArrows,
  Info,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type {
  HardwareDeviceUsage,
  HardwareResearchResponse,
} from "@spechub/api-client";
import { DeviceArtwork } from "@/components/device-artwork";
import { SearchableSelect } from "@/components/searchable-select";
import { configurationVersionLabel } from "@/lib/device-benchmark";
import { formatDate, formatPrice } from "@/lib/format";
import { localizeDeviceCategory } from "@/lib/localize";

type DeviceAssessment =
  HardwareResearchResponse["data"]["device_assessments"][number];

type SortMode = "benchmark" | "newest" | "price";
type AssessmentBenchmark = DeviceAssessment["benchmark_results"][number];

export function HardwareDeviceExplorer({
  moduleName,
  devices,
  assessments = [],
  summary,
}: {
  moduleName: string;
  devices: HardwareDeviceUsage[];
  assessments?: DeviceAssessment[];
  summary?: string | null;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("benchmark");
  const assessmentByVariant = useMemo(
    () =>
      new Map(
        assessments.map((assessment) => [
          assessment.device.variant_id,
          assessment,
        ]),
      ),
    [assessments],
  );
  const uniqueDevices = useMemo(
    () =>
      Array.from(
        new Map(devices.map((device) => [device.variant_id, device])).values(),
      ),
    [devices],
  );
  const sortedDevices = useMemo(() => {
    return [...uniqueDevices].sort((left, right) => {
      const leftAssessment = assessmentByVariant.get(left.variant_id);
      const rightAssessment = assessmentByVariant.get(right.variant_id);
      if (sortMode === "newest") {
        return (
          dateValue(right.device_model.release_date) -
          dateValue(left.device_model.release_date)
        );
      }
      if (sortMode === "price") {
        return priceValue(left.launch_price) - priceValue(right.launch_price);
      }
      return (
        benchmarkSortValue(rightAssessment) - benchmarkSortValue(leftAssessment)
      );
    });
  }, [assessmentByVariant, sortMode, uniqueDevices]);
  const hasMeasuredScores = assessments.some(
    (assessment) => assessment.score_basis === "benchmark",
  );

  function toggleDevice(id: string) {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((selectedId) => selectedId !== id);
      }
      if (current.length >= 2) return current;
      return [...current, id];
    });
  }

  const compareHref =
    selectedIds.length === 2
      ? `/compare?ids=${encodeURIComponent(selectedIds.join(","))}`
      : null;

  return (
    <section aria-labelledby="same-module-devices">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="app-section-label">Cùng nền tảng phần cứng</p>
          <h2
            id="same-module-devices"
            className="mt-1 text-2xl font-semibold tracking-tight text-slate-950"
          >
            Thiết bị dùng {moduleName}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Kết quả được giữ theo đúng thang điểm của từng benchmark. Chỉ các
            thiết bị có cùng bài đo và phiên bản mới được đối chiếu trực tiếp.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <SlidersHorizontal size={16} />
          <SearchableSelect
            label="Sắp xếp thiết bị"
            labelClassName="sr-only"
            controlClassName="h-10 rounded-lg"
            value={sortMode}
            onChange={(value) => setSortMode(value as SortMode)}
            options={[
              { value: "benchmark", label: "Benchmark cao trước" },
              { value: "newest", label: "Mới nhất trước" },
              { value: "price", label: "Giá thấp trước" },
            ]}
            clearable={false}
          />
        </div>
      </div>

      {summary ? (
        <div className="mb-5 flex gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-6 text-slate-700">
          <Info size={18} className="mt-0.5 shrink-0 text-blue-700" />
          <div>
            <strong className="font-semibold text-slate-950">
              {hasMeasuredScores
                ? "Nhận định từ dữ liệu đo"
                : "Nhận định từ cấu hình"}
            </strong>
            <p className="mt-1">{summary}</p>
          </div>
        </div>
      ) : null}

      {sortedDevices.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedDevices.map((device) => {
            const assessment = assessmentByVariant.get(device.variant_id);
            const selected = selectedIds.includes(device.variant_id);
            const selectionFull = selectedIds.length >= 2 && !selected;
            const brand =
              device.device_model.product_family?.brand_org?.short_name ??
              device.device_model.product_family?.brand_org?.name ??
              "SpecHub";
            const category = localizeDeviceCategory(
              device.device_model.product_family?.device_category,
            );
            const benchmarkResult = primaryAssessmentBenchmark(assessment);

            return (
              <article
                key={`${device.variant_id}-${device.usage_role ?? "module"}`}
                className={`overflow-hidden rounded-xl border bg-white transition ${
                  selected
                    ? "border-blue-500 shadow-md ring-2 ring-blue-100"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="relative">
                  <DeviceArtwork
                    compact
                    brand={brand}
                    name={device.device_model.name}
                    category={category}
                    imageUrl={device.device_model.cover_image_url}
                    accent={device.color_hex}
                    className="!h-44 rounded-none border-0 border-b"
                  />
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-blue-700">
                        {brand} · {category}
                      </p>
                      <Link
                        href={`/devices/${device.device_model.slug}`}
                        className="mt-1 block truncate text-base font-semibold text-slate-950 hover:text-blue-700"
                      >
                        {device.device_model.name}
                      </Link>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {device.variant_name}
                        {device.market_name ? ` · ${device.market_name}` : ""}
                      </p>
                    </div>
                    <ScoreBadge
                      result={benchmarkResult}
                      configurationScore={
                        assessment?.score_basis === "configuration_model"
                          ? assessment.effectiveness_score
                          : null
                      }
                      configurationVersion={assessment?.score_details?.version}
                    />
                  </div>

                  <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                    {benchmarkResult
                      ? `${benchmarkResult.benchmark.name}${
                          benchmarkResult.benchmark.version
                            ? ` ${benchmarkResult.benchmark.version}`
                            : ""
                        }${
                          benchmarkResult.benchmark.subscore_name
                            ? ` · ${localizeBenchmarkSubscore(
                                benchmarkResult.benchmark.subscore_name,
                              )}`
                            : ""
                        }`
                      : "Chưa có benchmark đủ điều kiện đối chiếu"}
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs">
                    <div>
                      <dt className="text-slate-500">Giá ra mắt</dt>
                      <dd className="mt-1 truncate font-semibold text-slate-900">
                        {formatPrice(device.launch_price, device.currency)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Thiết bị ra mắt</dt>
                      <dd className="mt-1 font-semibold text-slate-900">
                        {formatDate(device.device_model.release_date)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      href={`/devices/${device.device_model.slug}`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-slate-400"
                    >
                      Chi tiết
                      <ArrowRight size={15} />
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleDevice(device.variant_id)}
                      disabled={selectionFull}
                      aria-pressed={selected}
                      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
                        selected
                          ? "bg-blue-50 text-blue-700"
                          : "bg-slate-950 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      }`}
                    >
                      {selected ? (
                        <Check size={15} />
                      ) : (
                        <GitCompareArrows size={15} />
                      )}
                      {selected
                        ? "Đã chọn"
                        : selectionFull
                          ? "Đã đủ 2"
                          : "Chọn so sánh"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Chưa có thiết bị nào được liên kết với mô-đun này.
        </div>
      )}

      {selectedIds.length ? (
        <div className="sticky bottom-[5.75rem] z-20 mt-5 rounded-xl border border-slate-800 bg-slate-950 p-3 text-white shadow-xl lg:bottom-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/10">
                <BarChart3 size={19} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  Đã chọn {selectedIds.length}/2 thiết bị
                </p>
                <p className="truncate text-xs text-slate-300">
                  {selectedIds.length === 1
                    ? "Chọn thêm một thiết bị để đối chiếu."
                    : "Sẵn sàng xem chênh lệch từng tiêu chí."}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X size={15} />
                Xóa
              </button>
              {compareHref ? (
                <Link
                  href={compareHref}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 sm:flex-none"
                >
                  So sánh ngay
                  <ArrowRight size={15} />
                </Link>
              ) : (
                <span className="inline-flex h-10 flex-1 cursor-not-allowed items-center justify-center rounded-lg bg-white/10 px-4 text-sm font-semibold text-slate-400 sm:flex-none">
                  Cần thêm 1 thiết bị
                </span>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ScoreBadge({
  result,
  configurationScore,
  configurationVersion,
}: {
  result?: AssessmentBenchmark;
  configurationScore?: number | null;
  configurationVersion?: string | null;
}) {
  if (
    !result &&
    configurationScore !== undefined &&
    configurationScore !== null
  ) {
    return (
      <span
        className="min-w-20 max-w-28 shrink-0 rounded-lg bg-blue-50 px-2.5 py-1.5 text-center text-blue-800"
        title={`Chỉ số cấu hình SpecHub ${configurationVersionLabel(configurationVersion)}; không phải benchmark`}
      >
        <span className="block text-lg font-bold leading-none">
          {formatBenchmarkNumber(configurationScore)}
        </span>
        <span className="mt-1 block truncate text-[10px] font-semibold">
          Cấu hình
        </span>
      </span>
    );
  }

  if (!result) {
    return (
      <span className="max-w-24 shrink-0 rounded-lg bg-slate-100 px-2.5 py-2 text-center text-xs font-medium text-slate-500">
        Chưa có
        <span className="block text-[10px] font-normal">benchmark</span>
      </span>
    );
  }

  return (
    <span className="min-w-20 max-w-28 shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-center text-emerald-700">
      <span className="block text-lg font-bold leading-none">
        {formatBenchmarkNumber(result.score)}
      </span>
      <span className="mt-1 block truncate text-[10px] font-semibold">
        {localizeBenchmarkUnit(result.benchmark.unit?.symbol)}
      </span>
    </span>
  );
}

function primaryAssessmentBenchmark(assessment?: DeviceAssessment) {
  return assessment?.benchmark_results.find((result) => result.comparable);
}

function benchmarkSortValue(assessment?: DeviceAssessment) {
  const result = primaryAssessmentBenchmark(assessment);
  if (!result)
    return assessment?.effectiveness_score ?? Number.NEGATIVE_INFINITY;
  return result.benchmark.higher_is_better ? result.score : -result.score;
}

function formatBenchmarkNumber(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format(value);
}

function localizeBenchmarkUnit(value?: string | null) {
  if (!value || /^(points?|pts?)$/i.test(value)) return "điểm";
  return value;
}

function localizeBenchmarkSubscore(value: string) {
  const labels: Record<string, string> = {
    overall: "Tổng",
    total: "Tổng",
    single_core: "Đơn nhân",
    multi_core: "Đa nhân",
    cpu: "CPU",
    gpu: "GPU",
    opencl: "OpenCL",
    memory: "Bộ nhớ",
    ux: "Trải nghiệm",
  };
  return labels[value.toLowerCase()] ?? value;
}

function priceValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : Number.POSITIVE_INFINITY;
}

function dateValue(value?: string | null) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}
