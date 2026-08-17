import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BatteryCharging,
  BrainCircuit,
  Check,
  Cpu,
  DollarSign,
  Gauge,
  GitCompareArrows,
  HardDrive,
  MemoryStick,
  MonitorSmartphone,
  Search,
  ShieldCheck,
  Trophy,
  Weight,
  X,
} from "lucide-react";
import type {
  DeviceVariantDetail,
  DeviceVariantSummary,
  VariantScorecard,
} from "@spechub/api-client";
import { DeviceArtwork } from "@/components/device-artwork";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ShareComparisonButton } from "@/components/share-comparison-button";
import { api } from "@/lib/api";
import {
  benchmarkMethodLabel,
  benchmarkProvenanceLabel,
  benchmarkWinnerIndex,
  calculateConfigurationIndex,
  configurationVersionLabel,
  explainBenchmarkMetric,
  findCommonBenchmarks,
  formatBenchmarkScore,
  formatBenchmarkValue,
  formatConfigurationScore,
  selectPrimaryBenchmarks,
  type BenchmarkMetric,
} from "@/lib/device-benchmark";
import {
  formatIngressProtection,
  formatMeasurement,
  formatPrice,
  formatResolution,
  formatScreenSize,
} from "@/lib/format";
import { localizeDeviceCategory } from "@/lib/localize";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = stringParam(params.q);
  const selectedIds = idParams(params.ids);
  const activeSlot = slotParam(params.slot, selectedIds.length);

  const [variants, selectedVariants] = await Promise.all([
    api.listDeviceVariants({
      pageSize: 100,
      q: q || undefined,
      default_only: true,
    }),
    loadSelectedVariants(selectedIds),
  ]);

  return (
    <div className="app-page mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader
        title="So sánh thiết bị"
        action={
          selectedVariants.length ? (
            <ShareComparisonButton
              title={`So sánh ${selectedVariants
                .map((variant) => variantTitle(variant))
                .join(" và ")}`}
            />
          ) : null
        }
      />

      <DeviceSelector
        q={q}
        activeSlot={activeSlot}
        selectedIds={selectedIds}
        selectedVariants={selectedVariants}
        variants={variants.data}
      />

      <main className="min-w-0 space-y-5">
        {selectedVariants.length < 2 ? (
          <EmptyState
            icon={<GitCompareArrows size={20} />}
            title={
              selectedVariants.length
                ? "Chọn thêm một thiết bị"
                : "Chọn hai thiết bị để bắt đầu"
            }
          />
        ) : (
          <>
            <HeadToHead variants={selectedVariants} />
            <BenchmarkBreakdown variants={selectedVariants} />
            <ComparisonTable variants={selectedVariants} />
            <Link
              href={`/ai?q=${encodeURIComponent(
                `Phân tích đánh đổi khi chọn ${selectedVariants
                  .map((variant) => variantTitle(variant))
                  .join(" và ")}`,
              )}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-blue-900 transition hover:border-blue-400 hover:bg-blue-50"
            >
              <span className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-blue-700 shadow-sm">
                  <BrainCircuit size={18} />
                </span>
                <strong className="text-sm">Nhờ AI phân tích lựa chọn</strong>
              </span>
              <ArrowRight size={17} />
            </Link>
          </>
        )}
      </main>
    </div>
  );
}

function DeviceSelector({
  q,
  activeSlot,
  selectedIds,
  selectedVariants,
  variants,
}: {
  q: string;
  activeSlot: number;
  selectedIds: string[];
  selectedVariants: DeviceVariantDetail[];
  variants: DeviceVariantSummary[];
}) {
  const visibleVariants = variants.slice(0, q ? 100 : 12);

  return (
    <section
      aria-labelledby="device-selector-title"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <GitCompareArrows size={17} className="text-blue-700" />
          <h2
            id="device-selector-title"
            className="text-sm font-semibold text-slate-950"
          >
            Chọn thiết bị
          </h2>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {selectedIds.length}/2
          </span>
        </div>
        {selectedIds.length ? (
          <Link
            href="/compare"
            className="text-xs font-semibold text-slate-500 transition hover:text-blue-700"
          >
            Chọn lại
          </Link>
        ) : null}
      </div>

      <div className="grid gap-3 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_36px_minmax(0,1fr)] md:items-stretch">
        {[0, 1]
          .map((index) => {
            const selected = selectedVariants[index];
            const brand =
              selected?.device_model?.product_family?.brand_org?.short_name ??
              selected?.device_model?.product_family?.brand_org?.name;
            const category =
              selected?.device_model?.product_family?.device_category;
            return (
              <div
                key={selected?.id ?? `slot-${index}`}
                className={`relative min-w-0 rounded-xl border p-3 transition ${
                  activeSlot === index
                    ? "border-blue-500 bg-blue-50/60 ring-2 ring-blue-100"
                    : selected
                      ? "border-slate-200 bg-slate-50"
                      : "border-dashed border-slate-300 bg-slate-50"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Thiết bị {index + 1}
                  </span>
                  {activeSlot === index ? (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      Đang chọn
                    </span>
                  ) : null}
                </div>
                {selected ? (
                  <div className="flex min-w-0 items-center gap-3">
                    <DeviceArtwork
                      compact
                      brand={brand}
                      name={selected.device_model?.name}
                      category={category?.slug}
                      imageUrl={selected.device_model?.cover_image_url}
                      accent={selected.color_hex}
                      className="!h-20 !w-24 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-blue-700">
                        {localizeDeviceCategory(category)}
                      </span>
                      <span className="mt-0.5 block line-clamp-2 text-sm font-semibold leading-5 text-slate-950">
                        {selected.device_model?.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {selected.variant_name}
                      </span>
                      <span className="mt-2 flex items-center gap-3">
                        <Link
                          href={currentHref(selectedIds, q, index)}
                          className="text-xs font-semibold text-blue-700"
                        >
                          Thay
                        </Link>
                        <Link
                          href={removeHref(index, selectedIds, q)}
                          aria-label={`Bỏ thiết bị ${index + 1}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-700"
                        >
                          <X size={12} />
                          Bỏ
                        </Link>
                      </span>
                    </div>
                  </div>
                ) : (
                  <Link
                    href={currentHref(selectedIds, q, index)}
                    className="flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-xs font-semibold text-blue-700"
                  >
                    Chọn thiết bị
                  </Link>
                )}
              </div>
            );
          })
          .flatMap((slot, index) =>
            index === 0
              ? [
                  slot,
                  <span
                    key="selector-divider"
                    className="hidden place-items-center text-slate-300 md:grid"
                  >
                    <GitCompareArrows size={18} />
                  </span>,
                ]
              : [slot],
          )}
      </div>

      <div className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-5">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span>Thay vị trí:</span>
            {[0, 1].map((index) => (
              <Link
                key={index}
                href={currentHref(selectedIds, q, index)}
                className={`rounded-full px-2.5 py-1 font-semibold transition ${
                  activeSlot === index
                    ? "bg-blue-700 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-blue-700"
                }`}
              >
                Thiết bị {index + 1}
              </Link>
            ))}
          </div>
          {q ? (
            <Link
              href={currentHref(selectedIds, "", activeSlot)}
              className="text-xs font-semibold text-blue-700"
            >
              Xóa từ khóa
            </Link>
          ) : null}
        </div>

        <form action="/compare">
          {selectedIds.length ? (
            <input name="ids" type="hidden" value={selectedIds.join(",")} />
          ) : null}
          <input name="slot" type="hidden" value={activeSlot} />
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Tìm tên máy, phiên bản hoặc chipset..."
              aria-label="Tìm thiết bị để so sánh"
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-20 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button className="absolute right-1.5 top-1.5 inline-flex h-8 items-center justify-center rounded-md bg-slate-950 px-4 text-xs font-semibold text-white">
              Tìm
            </button>
          </div>
        </form>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-700">
            {q ? `Kết quả cho “${q}”` : "Gợi ý thay nhanh"}
          </span>
          <span className="text-[11px] text-slate-500">
            {variants.length} thiết bị
          </span>
        </div>

        <div className="mt-2 grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
          {visibleVariants.length ? (
            visibleVariants.map((variant) => {
              const selectedIndex = selectedIds.indexOf(variant.id);
              const selected = selectedIndex >= 0;
              const brand =
                variant.device_model?.product_family?.brand_org?.short_name ??
                variant.device_model?.product_family?.brand_org?.name;
              const category =
                variant.device_model?.product_family?.device_category;
              const content = (
                <>
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      selected
                        ? "bg-blue-700 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {selected ? (
                      <Check size={14} />
                    ) : (
                      (brand?.slice(0, 1) ?? "S")
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-950">
                      {variant.device_model?.name}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">
                      {[
                        brand ?? localizeDeviceCategory(category),
                        variant.variant_name,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold text-blue-700">
                    {selected ? `Vị trí ${selectedIndex + 1}` : "Chọn"}
                  </span>
                </>
              );

              return selected ? (
                <div
                  key={variant.id}
                  className="flex min-w-0 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-2.5"
                >
                  {content}
                </div>
              ) : (
                <Link
                  key={variant.id}
                  href={selectHref(variant.id, selectedIds, activeSlot)}
                  className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5 transition hover:border-blue-400 hover:bg-blue-50/40"
                >
                  {content}
                </Link>
              );
            })
          ) : (
            <p className="col-span-full rounded-lg bg-white p-4 text-center text-xs text-slate-500">
              Không tìm thấy thiết bị phù hợp.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function HeadToHead({ variants }: { variants: DeviceVariantDetail[] }) {
  const differences = buildKeyDifferences(variants);
  const sharedBenchmark = commonBenchmarkPairs(variants)[0];

  return (
    <section
      aria-labelledby="head-to-head"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <Trophy size={17} className="text-amber-600" />
          <h2
            id="head-to-head"
            className="text-sm font-semibold text-slate-950"
          >
            Tổng quan
          </h2>
        </div>
        <a
          href="#detailed-comparison"
          className="text-xs font-semibold text-blue-700"
        >
          Xem thông số
        </a>
      </div>

      <div className="grid border-b border-slate-200 sm:grid-cols-2">
        {variants.map((variant, index) => {
          const brand =
            variant.device_model?.product_family?.brand_org?.short_name ??
            variant.device_model?.product_family?.brand_org?.name;
          const category =
            variant.device_model?.product_family?.device_category?.slug;
          const benchmark = sharedBenchmark
            ? index === 0
              ? sharedBenchmark.left
              : sharedBenchmark.right
            : selectPrimaryBenchmarks(
                variant.device_variant_benchmarks,
                category,
                1,
              )[0];
          const configuration = calculateConfigurationIndex(
            variant.variant_module_scores,
          );
          const scorecard = variant.variant_scorecards?.[0];
          return (
            <div
              key={variant.id}
              className={`min-w-0 p-4 sm:p-5 ${
                index
                  ? "border-t border-slate-200 sm:border-l sm:border-t-0"
                  : ""
              }`}
            >
              <DeviceArtwork
                compact
                brand={brand}
                name={variant.device_model?.name}
                category={category}
                imageUrl={variant.device_model?.cover_image_url}
                accent={variant.color_hex}
                className="!h-32 sm:!h-40"
                priority
              />
              <div className="mt-3 min-w-0">
                <p className="text-xs font-semibold text-blue-700">
                  {localizeDeviceCategory(category)}
                </p>
                <h3 className="mt-1 line-clamp-2 text-lg font-semibold leading-6 text-slate-950">
                  {variant.device_model?.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                  {variant.variant_name}
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <OverallScoreBadge scorecard={scorecard} />
                <BenchmarkScore
                  metric={benchmark}
                  configuration={configuration}
                  comparable={Boolean(sharedBenchmark)}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div
        id="key-differences"
        className="scroll-mt-20 bg-slate-50/70 px-4 py-4 sm:px-5"
      >
        <h3 className="mb-3 text-sm font-semibold text-slate-950">
          Khác biệt chính
        </h3>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-[minmax(132px,0.8fr)_repeat(2,minmax(0,1fr))] border-b border-slate-200 bg-slate-50 sm:grid">
            <span className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Tiêu chí
            </span>
            {variants.map((variant) => (
              <span
                key={variant.id}
                className="min-w-0 border-l border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <span className="block truncate">
                  {variant.device_model?.name}
                </span>
              </span>
            ))}
          </div>
          <div className="divide-y divide-slate-100">
            {differences.map((difference) => (
              <DifferenceRow key={difference.label} {...difference} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function OverallScoreBadge({ scorecard }: { scorecard?: VariantScorecard }) {
  if (!scorecard) {
    return (
      <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <strong className="block text-base font-bold text-slate-700">—</strong>
        <span className="mt-0.5 block text-[10px] font-semibold text-slate-500">
          Chưa có điểm tổng
        </span>
      </div>
    );
  }

  return (
    <div
      className="min-w-0 rounded-xl border border-blue-200 bg-blue-50 p-3"
      title={`Độ phủ công thức ${formatNumber(Number(scorecard.coverage_percent))}%`}
    >
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-blue-700">
        Điểm tổng
      </span>
      <strong className="mt-1 block text-xl font-bold tabular-nums text-blue-800">
        {formatNumber(Number(scorecard.overall_score))}
        <span className="ml-0.5 text-[10px]">/100</span>
      </strong>
    </div>
  );
}

type KeyDifference = {
  icon: ReactNode;
  label: string;
  values: [string, string];
  winnerIndex?: number;
  status: "winner" | "tie" | "insufficient";
};

function DifferenceRow({
  icon,
  label,
  values,
  winnerIndex,
  status,
}: KeyDifference) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-[minmax(132px,0.8fr)_repeat(2,minmax(0,1fr))]">
      <div className="col-span-2 flex min-w-0 items-center justify-between gap-2 bg-slate-50/70 px-3 py-2.5 sm:col-span-1 sm:justify-start">
        <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-700">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white text-slate-500 shadow-sm">
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </span>
        {winnerIndex === undefined ? (
          <span className="shrink-0 text-[10px] font-medium text-slate-400">
            {status === "tie" ? "Ngang nhau" : "Chưa đủ dữ liệu"}
          </span>
        ) : null}
      </div>
      {values.map((value, index) => (
        <div
          key={`${label}-${index}`}
          className={`flex min-w-0 items-center justify-between gap-2 border-l border-slate-100 px-3 py-2.5 ${
            winnerIndex === index
              ? "bg-emerald-50 font-semibold text-emerald-900"
              : "text-slate-700"
          }`}
        >
          <strong className="min-w-0 break-words text-xs leading-5 tabular-nums sm:text-sm">
            {value}
          </strong>
          {winnerIndex === index ? (
            <Check size={13} className="shrink-0 text-emerald-600" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function BenchmarkScore({
  metric,
  configuration,
  comparable,
}: {
  metric?: BenchmarkMetric;
  configuration: ReturnType<typeof calculateConfigurationIndex>;
  comparable: boolean;
}) {
  const isConfiguration = !metric && Boolean(configuration);
  const explanation = metric ? explainBenchmarkMetric(metric) : null;
  const provenance = metric ? benchmarkProvenanceLabel(metric) : null;
  const title = metric
    ? `${explanation?.title}: ${explanation?.purpose} ${benchmarkMethodLabel(metric)} · ${provenance}`
    : configuration
      ? `Chỉ số cấu hình SpecHub ${configurationVersionLabel(configuration.version)}; không phải benchmark`
      : undefined;
  return (
    <div
      className={`min-w-0 rounded-xl border p-3 ${
        comparable
          ? "border-slate-200 bg-slate-50"
          : isConfiguration
            ? "border-amber-200 bg-amber-50"
            : "border-slate-200 bg-slate-50"
      }`}
      title={title}
    >
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Hiệu năng
      </span>
      <strong
        className={`mt-1 block text-xl font-bold tabular-nums ${
          comparable
            ? "text-slate-900"
            : isConfiguration
              ? "text-amber-800"
              : "text-slate-800"
        }`}
      >
        {metric
          ? formatBenchmarkScore(metric.score)
          : configuration
            ? formatConfigurationScore(configuration.score)
            : "—"}
      </strong>
      <span className="mt-1 block line-clamp-2 text-[10px] font-semibold leading-4 text-slate-600">
        {explanation?.title ??
          (configuration ? "Chỉ số cấu hình" : "Chưa có dữ liệu điểm")}
      </span>
      {provenance ? (
        <span className="mt-0.5 block line-clamp-2 text-[9px] leading-4 text-slate-500">
          {provenance}
        </span>
      ) : null}
    </div>
  );
}

function BenchmarkBreakdown({ variants }: { variants: DeviceVariantDetail[] }) {
  const benchmarks = commonBenchmarks(variants);
  if (!benchmarks.length) {
    return (
      <section className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
          <Gauge size={17} />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-950">
            Chưa có benchmark chung
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Cần cùng phép đo và phiên bản để đối chiếu.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="benchmark-breakdown"
      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="benchmark-breakdown"
          className="text-sm font-semibold text-slate-950"
        >
          Hiệu năng thực đo
        </h2>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
          Cùng phép đo
        </span>
      </div>
      <div className="mt-4 space-y-4">
        {benchmarks.map((benchmark) => (
          <BenchmarkRow
            key={benchmark.key}
            benchmark={benchmark}
            variants={variants}
          />
        ))}
      </div>
    </section>
  );
}

type CommonBenchmark = {
  key: string;
  label: string;
  unit: string;
  higherIsBetter: boolean;
  values: [number, number];
};

function BenchmarkRow({
  benchmark,
  variants,
}: {
  benchmark: CommonBenchmark;
  variants: DeviceVariantDetail[];
}) {
  const bestIndex = numericWinnerIndex(
    benchmark.values,
    benchmark.higherIsBetter ? "max" : "min",
  );
  const strengths = benchmark.values.map((value) =>
    benchmark.higherIsBetter
      ? (value / Math.max(...benchmark.values)) * 100
      : (Math.min(...benchmark.values) / value) * 100,
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800">
          {benchmark.label}
        </h3>
        <span className="text-[11px] text-slate-500">
          {benchmark.higherIsBetter ? "Cao hơn tốt hơn" : "Thấp hơn tốt hơn"}
        </span>
      </div>
      <div className="space-y-2">
        {benchmark.values.map((value, index) => (
          <div
            key={`${benchmark.key}-${variants[index]?.id}`}
            className="grid grid-cols-[minmax(84px,150px)_minmax(0,1fr)_auto] items-center gap-3"
          >
            <span className="truncate text-xs font-medium text-slate-600">
              {variants[index]?.device_model?.name}
            </span>
            <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <span
                className={`block h-full rounded-full ${
                  bestIndex === index ? "bg-emerald-500" : "bg-slate-400"
                }`}
                style={{ width: `${Math.max(6, strengths[index] ?? 0)}%` }}
              />
            </span>
            <span
              className={`min-w-20 text-right text-xs font-semibold ${
                bestIndex === index ? "text-emerald-700" : "text-slate-600"
              }`}
            >
              {formatNumber(value)} {benchmark.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparisonTable({ variants }: { variants: DeviceVariantDetail[] }) {
  const columns = "180px repeat(2, minmax(230px, 1fr))";
  const scorecards = variants.map((variant) => variant.variant_scorecards?.[0]);
  const overallValues = scorecards.map((scorecard) =>
    scorecard ? Number(scorecard.overall_score) : undefined,
  );
  const scorecardModules = sharedScorecardModules(scorecards);
  const priceValues =
    variants[0]?.currency?.code === variants[1]?.currency?.code
      ? variants.map((variant) => numberValue(variant.launch_price))
      : [undefined, undefined];
  const batteryValues = variants.map(
    (variant) => variant.variant_batteries?.[0]?.battery_unit.capacity_mah,
  );
  const displayValues = variants.map(
    (variant) =>
      variant.variant_displays?.[0]?.display_unit.refresh_rate_hz ?? undefined,
  );
  const brightnessValues = variants.map(
    (variant) =>
      variant.variant_displays?.[0]?.display_unit.brightness_peak_nits ??
      undefined,
  );
  const chargingValues = variants.map(
    (variant) =>
      variant.variant_batteries?.[0]?.battery_unit.wired_charging_w ??
      undefined,
  );
  const weightValues = variants.map((variant) =>
    numberValue(variant.variant_physical_specs?.weight_g),
  );

  return (
    <section aria-labelledby="detailed-comparison">
      <div className="mb-3">
        <h2
          id="detailed-comparison"
          className="text-lg font-semibold text-slate-950"
        >
          Thông số chi tiết
        </h2>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div>
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 sm:grid-cols-[180px_repeat(2,minmax(0,1fr))]">
            <div className="hidden border-r border-slate-200 p-4 text-sm font-semibold text-slate-600 sm:block">
              Tiêu chí
            </div>
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="min-w-0 border-l border-slate-200 p-3 sm:p-4"
              >
                <p className="line-clamp-2 text-xs font-semibold leading-5 text-slate-950 sm:text-sm">
                  {variant.device_model?.name}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-slate-500 sm:text-xs">
                  {variant.variant_name}
                </p>
              </div>
            ))}
          </div>

          <CompareSection title="Điểm tổng SpecHub" columns={columns} />
          <CompareRow
            icon={<Gauge size={15} />}
            label="Điểm tổng"
            values={scorecards.map((scorecard) =>
              scorecard
                ? `${formatNumber(Number(scorecard.overall_score))}/100`
                : "Chưa có dữ liệu",
            )}
            winnerIndex={optionalWinnerIndex(overallValues, "max")}
            columns={columns}
          />
          <CompareRow
            icon={<ShieldCheck size={15} />}
            label="Độ phủ công thức"
            values={scorecards.map((scorecard) =>
              scorecard
                ? `${formatNumber(Number(scorecard.coverage_percent))}%`
                : "Chưa có dữ liệu",
            )}
            columns={columns}
          />
          {scorecardModules.map((module) => {
            const moduleValues = module.values.map((value) =>
              value ? Number(value.score) : undefined,
            );
            return (
              <CompareRow
                key={module.key}
                icon={<Gauge size={15} />}
                label={module.label}
                values={module.values.map((value) =>
                  value
                    ? `${formatNumber(Number(value.score))}/100 · trọng số ${formatNumber(Number(value.weight_percent))}%`
                    : "Không áp dụng",
                )}
                winnerIndex={optionalWinnerIndex(moduleValues, "max")}
                columns={columns}
              />
            );
          })}

          <CompareSection title="Tổng quan thiết bị" columns={columns} />
          <CompareRow
            icon={<DollarSign size={15} />}
            label="Giá ra mắt"
            values={variants.map((variant) =>
              formatPrice(variant.launch_price, variant.currency),
            )}
            winnerIndex={optionalWinnerIndex(priceValues, "min")}
            columns={columns}
          />
          <CompareRow
            icon={<Cpu size={15} />}
            label="Chipset"
            values={variants.map(
              (variant) =>
                variant.variant_chipsets?.[0]?.chipset.name ?? "Chưa có",
            )}
            columns={columns}
          />

          <CompareSection title="Phần cứng và bộ nhớ" columns={columns} />
          <CompareRow
            icon={<Cpu size={15} />}
            label="CPU"
            values={variants.map(
              (variant) =>
                variant.variant_cpus?.map(({ cpu }) => cpu.name).join(", ") ||
                "Chưa có",
            )}
            columns={columns}
          />
          <CompareRow
            icon={<MemoryStick size={15} />}
            label="RAM"
            values={variants.map((variant) =>
              variant.variant_memory_configs?.length
                ? variant.variant_memory_configs
                    .map(
                      (memory) =>
                        `${formatMeasurement(memory.capacity_gb, "GB", 0)} ${memory.memory_standard.name}`,
                    )
                    .join(", ")
                : "Chưa có",
            )}
            columns={columns}
          />
          <CompareRow
            icon={<HardDrive size={15} />}
            label="Bộ nhớ trong"
            values={variants.map((variant) =>
              variant.variant_storage_configs?.length
                ? variant.variant_storage_configs
                    .map(
                      (storage) =>
                        `${formatMeasurement(storage.total_capacity_gb, "GB", 0)} ${storage.storage_standard.name}`,
                    )
                    .join(", ")
                : "Chưa có",
            )}
            columns={columns}
          />
          <CompareRow
            icon={<BrainCircuit size={15} />}
            label="GPU / NPU"
            values={variants.map(
              (variant) =>
                [
                  ...(variant.variant_gpus ?? []).map(({ gpu }) => gpu.name),
                  ...(variant.variant_npus ?? []).map(({ npu }) => npu.name),
                ].join(", ") || "Chưa có",
            )}
            columns={columns}
          />

          <CompareSection title="Màn hình, pin và thân máy" columns={columns} />
          <CompareRow
            icon={<MonitorSmartphone size={15} />}
            label="Màn hình"
            values={variants.map((variant) => {
              const display = variant.variant_displays?.[0]?.display_unit;
              return display
                ? [
                    display.display_technology?.name,
                    formatScreenSize(display.size_inch),
                    display.resolution_width && display.resolution_height
                      ? formatResolution(
                          display.resolution_width,
                          display.resolution_height,
                        )
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "Chưa có";
            })}
            columns={columns}
          />
          <CompareRow
            icon={<MonitorSmartphone size={15} />}
            label="Tần số quét"
            values={displayValues.map(
              (value) => formatMeasurement(value, "Hz", 0) ?? "Chưa có",
            )}
            winnerIndex={optionalWinnerIndex(displayValues, "max")}
            columns={columns}
          />
          <CompareRow
            icon={<Gauge size={15} />}
            label="Độ sáng tối đa"
            values={brightnessValues.map(
              (value) => formatMeasurement(value, "nit", 0) ?? "Chưa có",
            )}
            winnerIndex={optionalWinnerIndex(brightnessValues, "max")}
            columns={columns}
          />
          <CompareRow
            icon={<BatteryCharging size={15} />}
            label="Dung lượng pin"
            values={batteryValues.map(
              (value) => formatMeasurement(value, "mAh", 0) ?? "Chưa có",
            )}
            winnerIndex={optionalWinnerIndex(batteryValues, "max")}
            columns={columns}
          />
          <CompareRow
            icon={<BatteryCharging size={15} />}
            label="Sạc có dây"
            values={chargingValues.map(
              (value) => formatMeasurement(value, "W", 0) ?? "Chưa có",
            )}
            winnerIndex={optionalWinnerIndex(chargingValues, "max")}
            columns={columns}
          />
          <CompareRow
            icon={<Weight size={15} />}
            label="Khối lượng"
            values={variants.map(
              (variant) =>
                formatMeasurement(
                  variant.variant_physical_specs?.weight_g,
                  "g",
                  0,
                ) ?? "Chưa có",
            )}
            winnerIndex={optionalWinnerIndex(weightValues, "min")}
            columns={columns}
          />
          <CompareRow
            icon={<ShieldCheck size={15} />}
            label="Kháng bụi nước"
            values={variants.map(
              (variant) =>
                formatIngressProtection(
                  variant.variant_physical_specs?.ingress_protection,
                ) ?? "Chưa có",
            )}
            columns={columns}
          />
        </div>
      </div>
    </section>
  );
}

function CompareSection({ title }: { title: string; columns: string }) {
  return (
    <div className="border-b border-slate-200 bg-slate-950 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white">
      {title}
    </div>
  );
}

function CompareRow({
  icon,
  label,
  values,
  winnerIndex,
}: {
  icon: ReactNode;
  label: string;
  values: string[];
  winnerIndex?: number;
  columns: string;
}) {
  return (
    <div className="grid grid-cols-2 border-b border-slate-100 last:border-b-0 sm:grid-cols-[180px_repeat(2,minmax(0,1fr))]">
      <div className="col-span-2 flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-600 sm:col-span-1 sm:border-b-0 sm:border-r sm:p-4 sm:text-sm">
        {icon}
        {label}
      </div>
      {values.map((value, index) => (
        <div
          key={`${label}-${index}`}
          className={`min-w-0 border-l border-slate-100 p-3 text-xs leading-5 sm:p-4 sm:text-sm sm:leading-6 ${
            winnerIndex === index
              ? "bg-emerald-50/70 font-semibold text-emerald-900"
              : "text-slate-800"
          }`}
        >
          <span className="break-words">{value}</span>
          {winnerIndex === index ? (
            <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 sm:px-2 sm:text-[10px]">
              <Check size={10} />
              Tốt hơn
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

async function loadSelectedVariants(ids: string[]) {
  if (ids.length >= 2) {
    return api.compareDeviceVariants(ids).then((result) => result.data);
  }
  if (ids.length === 1) {
    const result = await api.getDeviceVariant(ids[0]);
    return [result.data];
  }
  return [];
}

function selectHref(id: string, selectedIds: string[], activeSlot: number) {
  const next = [...selectedIds];
  if (next.length < 2 && activeSlot >= next.length) {
    next.push(id);
  } else {
    next[activeSlot] = id;
  }
  return currentHref(next, "", next.length < 2 ? next.length : activeSlot);
}

function removeHref(index: number, selectedIds: string[], q: string) {
  const next = selectedIds.filter(
    (_, selectedIndex) => selectedIndex !== index,
  );
  return currentHref(next, q, Math.min(index, next.length));
}

function currentHref(selectedIds: string[], q: string, slot?: number) {
  const search = new URLSearchParams();
  if (selectedIds.length) search.set("ids", selectedIds.join(","));
  if (q) search.set("q", q);
  if (slot === 0 || slot === 1) search.set("slot", String(slot));
  const params = search.toString();
  return params ? `/compare?${params}` : "/compare";
}

function variantTitle(variant?: DeviceVariantDetail) {
  if (!variant) return "Chưa có";
  return [variant.device_model?.name, variant.variant_name]
    .filter(Boolean)
    .join(" ");
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function slotParam(
  value: string | string[] | undefined,
  selectedCount: number,
) {
  const slot = stringParam(value);
  if (slot === "0" || slot === "1") return Number(slot);
  return Math.min(selectedCount, 1);
}

function idParams(value: string | string[] | undefined) {
  const rawValues = Array.isArray(value) ? value : [value ?? ""];
  return [
    ...new Set(
      rawValues
        .flatMap((item) => item.split(","))
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ].slice(0, 2);
}

function buildKeyDifferences(variants: DeviceVariantDetail[]): KeyDifference[] {
  const overallScores = variants.map((variant) => {
    const scorecard = variant.variant_scorecards?.[0];
    return scorecard ? Number(scorecard.overall_score) : undefined;
  }) as [number | undefined, number | undefined];
  const benchmark = commonBenchmarkPairs(variants)[0];
  const prices = variants.map((variant) =>
    numberValue(variant.launch_price),
  ) as [number | undefined, number | undefined];
  const comparablePrices =
    variants[0]?.currency?.code === variants[1]?.currency?.code
      ? prices
      : ([undefined, undefined] as [undefined, undefined]);
  const batteries = variants.map(
    (variant) => variant.variant_batteries?.[0]?.battery_unit.capacity_mah,
  ) as [number | undefined, number | undefined];
  const displays = variants.map(
    (variant) =>
      variant.variant_displays?.[0]?.display_unit.refresh_rate_hz ?? undefined,
  ) as [number | undefined, number | undefined];
  const weights = variants.map((variant) =>
    numberValue(variant.variant_physical_specs?.weight_g),
  ) as [number | undefined, number | undefined];

  const performanceWinnerIndex = benchmark
    ? benchmarkWinnerIndex([benchmark.left, benchmark.right])
    : undefined;
  const performanceDifference = benchmark
    ? {
        icon: <Gauge size={14} />,
        label: benchmark.left.shortLabel,
        values: [
          formatBenchmarkValue(benchmark.left),
          formatBenchmarkValue(benchmark.right),
        ] as [string, string],
        winnerIndex: performanceWinnerIndex,
        status:
          performanceWinnerIndex === undefined
            ? ("tie" as const)
            : ("winner" as const),
      }
    : {
        icon: <Gauge size={14} />,
        label: "Benchmark",
        values: ["Chưa có phép đo chung", "Chưa có phép đo chung"] as [
          string,
          string,
        ],
        status: "insufficient" as const,
      };

  return [
    makeDifference({
      icon: <Trophy size={14} />,
      label: "Điểm tổng",
      numericValues: overallScores,
      displayValues: overallScores.map((value) =>
        value === undefined ? "Chưa có" : `${formatNumber(value)}/100`,
      ) as [string, string],
      mode: "max",
    }),
    performanceDifference,
    makeDifference({
      icon: <DollarSign size={14} />,
      label: "Giá",
      numericValues: comparablePrices,
      displayValues: variants.map((variant) =>
        formatPrice(variant.launch_price, variant.currency),
      ) as [string, string],
      mode: "min",
    }),
    makeDifference({
      icon: <BatteryCharging size={14} />,
      label: "Pin",
      numericValues: batteries,
      displayValues: batteries.map((value) =>
        value === undefined ? "Chưa có" : `${value} mAh`,
      ) as [string, string],
      mode: "max",
    }),
    makeDifference({
      icon: <MonitorSmartphone size={14} />,
      label: "Tần số quét",
      numericValues: displays,
      displayValues: displays.map((value) =>
        value === undefined ? "Chưa có" : `${value} Hz`,
      ) as [string, string],
      mode: "max",
    }),
    makeDifference({
      icon: <Weight size={14} />,
      label: "Khối lượng",
      numericValues: weights,
      displayValues: weights.map((value) =>
        value === undefined ? "Chưa có" : `${value} g`,
      ) as [string, string],
      mode: "min",
    }),
  ];
}

function sharedScorecardModules(
  scorecards: Array<VariantScorecard | undefined>,
) {
  const keys = new Set(
    scorecards.flatMap(
      (scorecard) =>
        scorecard?.module_scores.map((module) => module.module_key) ?? [],
    ),
  );

  return [...keys]
    .map((key) => {
      const values = scorecards.map((scorecard) =>
        scorecard?.module_scores.find((module) => module.module_key === key),
      );
      const first = values.find(Boolean);
      return {
        key,
        label: first?.module_name ?? key,
        weight: first ? Number(first.weight_percent) : 0,
        values,
      };
    })
    .sort((left, right) => right.weight - left.weight);
}

function makeDifference({
  icon,
  label,
  numericValues,
  displayValues,
  mode,
}: {
  icon: ReactNode;
  label: string;
  numericValues: [number | undefined, number | undefined];
  displayValues: [string, string];
  mode: "min" | "max";
}): KeyDifference {
  const winnerIndex = optionalWinnerIndex(numericValues, mode);
  const [left, right] = numericValues;
  let status: KeyDifference["status"] = "insufficient";
  if (left !== undefined && right !== undefined) {
    if (left === right) {
      status = "tie";
    } else {
      status = "winner";
    }
  }
  return {
    icon,
    label,
    values: displayValues,
    winnerIndex,
    status,
  };
}

function commonBenchmarks(variants: DeviceVariantDetail[]): CommonBenchmark[] {
  return commonBenchmarkPairs(variants)
    .map(({ key, left, right }) => ({
      key,
      label: left.label,
      unit: left.unit,
      higherIsBetter: left.higherIsBetter,
      values: [left.score, right.score] as [number, number],
    }))
    .slice(0, 10);
}

function commonBenchmarkPairs(variants: DeviceVariantDetail[]) {
  const [left, right] = variants;
  if (!left || !right) return [];
  return findCommonBenchmarks(
    left.device_variant_benchmarks,
    right.device_variant_benchmarks,
  );
}

function optionalWinnerIndex(
  values: Array<number | undefined>,
  mode: "min" | "max",
) {
  if (
    values.length !== 2 ||
    values.some((value) => value === undefined) ||
    values[0] === values[1]
  ) {
    return undefined;
  }
  return numericWinnerIndex(values as number[], mode);
}

function numericWinnerIndex(values: number[], mode: "min" | "max") {
  const target = mode === "min" ? Math.min(...values) : Math.max(...values);
  return values.indexOf(target);
}

function numberValue(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format(value);
}
