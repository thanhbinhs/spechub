import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FlaskConical,
  GitCompareArrows,
  MinusCircle,
  Sparkles,
  Thermometer,
} from "lucide-react";
import type {
  HardwareEvidenceQuality,
  HardwareEvidenceStatus,
  HardwareModuleKind,
  HardwareResearchResponse,
} from "@spechub/api-client";
import { Surface, SurfaceHeader } from "@/components/surface";

type DeviceAssessment =
  HardwareResearchResponse["data"]["device_assessments"][number];

export function HardwareAiResearch({
  moduleKind,
  moduleSlug,
  result,
  requestedQuestion,
}: {
  moduleKind: HardwareModuleKind;
  moduleSlug: string;
  result: HardwareResearchResponse | null;
  requestedQuestion?: string;
}) {
  const research = result?.data;
  const measured =
    research?.device_assessments.filter(
      (assessment) => assessment.status === "measured",
    ) ?? [];
  const unranked =
    research?.device_assessments.filter(
      (assessment) => assessment.status !== "measured",
    ) ?? [];
  const compareHref =
    research && research.compare_variant_ids.length >= 2
      ? `/compare?ids=${encodeURIComponent(
          research.compare_variant_ids.join(","),
        )}`
      : null;

  return (
    <Surface>
      <SurfaceHeader
        title="Đánh giá hiệu quả sử dụng mô-đun"
        meta={
          research
            ? `${assessmentStatusLabel(research.assessment_status)} · ${result.meta.generated_by === "hybrid" ? "AI giải thích bằng chứng" : "Engine benchmark"}`
            : "Chưa thể tải dữ liệu đánh giá"
        }
        action={
          <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">
            <Sparkles size={13} />
            Evidence-first
          </span>
        }
      />

      <div className="space-y-5 p-5">
        <form
          action={`/hardware/${moduleKind}/${moduleSlug}`}
          method="get"
          className="grid gap-3 rounded-lg border border-violet-100 bg-violet-50/50 p-4 lg:grid-cols-[minmax(0,1fr)_auto]"
        >
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-violet-800">
              Câu hỏi nghiên cứu
            </span>
            <input
              type="search"
              name="research"
              defaultValue={requestedQuestion}
              maxLength={500}
              placeholder="Ví dụ: Thiết bị nào khai thác mô-đun này tốt và có ổn định nhiệt không?"
              className="h-11 w-full rounded-md border border-violet-200 bg-white px-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </label>

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-md bg-violet-700 px-4 text-sm font-semibold text-white transition hover:bg-violet-800"
          >
            <BrainCircuit size={16} />
            Phân tích bằng chứng
          </button>
        </form>

        {!research ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            Dịch vụ đánh giá tạm thời chưa khả dụng. Thông tin mô-đun và danh
            sách thiết bị bên dưới vẫn hoạt động bình thường.
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <BrainCircuit size={17} className="text-violet-700" />
                  Kết luận hiện tại
                </div>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {research.summary}
                </div>
                {compareHref ? (
                  <Link
                    href={compareHref}
                    className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    <GitCompareArrows size={14} />
                    So sánh các phiên bản đã đo
                  </Link>
                ) : null}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-950">
                  {research.methodology.label}
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {research.methodology.description}
                </p>
                <div className="mt-3 space-y-3">
                  {research.methodology.criteria.map((criterion) => (
                    <div key={criterion.key} className="flex gap-2.5">
                      <CheckCircle2
                        size={14}
                        className="mt-0.5 shrink-0 text-emerald-600"
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-800">
                          {criterion.label}
                        </div>
                        <p className="mt-0.5 text-xs leading-5 text-slate-500">
                          {criterion.requirement}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <ResearchMetric
                label="Phiên bản dùng mô-đun"
                value={String(research.coverage.linked_device_count)}
              />
              <ResearchMetric
                label="Có benchmark phù hợp"
                value={`${research.coverage.benchmarked_device_count}/${research.coverage.linked_device_count}`}
              />
              <ResearchMetric
                label="Có thể đối chiếu"
                value={String(research.coverage.comparable_device_count)}
              />
              <ResearchMetric
                label="Nhóm phép đo chung"
                value={String(research.coverage.comparable_metric_count)}
              />
            </div>

            {measured.length ? (
              <section>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950">
                      Thiết bị có đủ bằng chứng đối chiếu
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Điểm 100 là kết quả tốt nhất trong từng nhóm benchmark
                      tương thích, không phải điểm tuyệt đối của sản phẩm.
                    </p>
                  </div>
                  <span className="text-xs font-medium text-emerald-700">
                    {measured.length} phiên bản được xếp hạng
                  </span>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {measured.map((assessment) => (
                    <DeviceAssessmentCard
                      key={assessment.device.variant_id}
                      assessment={assessment}
                    />
                  ))}
                </div>
              </section>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <FlaskConical
                    size={20}
                    className="mt-0.5 shrink-0 text-amber-700"
                  />
                  <div>
                    <div className="font-semibold text-amber-950">
                      Chưa có cơ sở để xếp hạng hiệu quả
                    </div>
                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      Cần ít nhất hai phiên bản dùng mô-đun này có cùng
                      benchmark, subscore và điều kiện thử nghiệm tương thích.
                      Hệ thống sẽ không lấy độ mới hay số lượng sản phẩm để thay
                      thế bằng chứng đo.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {unranked.length ? (
              <section>
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-slate-950">
                    Thiết bị chưa thể kết luận
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Có thể có dữ liệu cấu hình hoặc kết quả đo riêng lẻ, nhưng
                    chưa đủ điều kiện tạo thứ hạng hiệu quả.
                  </p>
                </div>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <div className="divide-y divide-slate-100 bg-white">
                    {unranked.slice(0, 12).map((assessment) => (
                      <UnrankedDeviceRow
                        key={assessment.device.variant_id}
                        assessment={assessment}
                      />
                    ))}
                  </div>
                  {unranked.length > 12 ? (
                    <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                      Còn {unranked.length - 12} phiên bản chưa có đủ bằng
                      chứng.
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            <div className="grid gap-4 border-t border-slate-100 pt-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <div className="text-sm font-semibold text-slate-950">
                  Evidence được sử dụng
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {research.evidence.map((citation, index) => (
                    <div
                      key={`${citation.entity_id}-${index}`}
                      className="rounded-md border border-slate-200 p-3"
                    >
                      <div className="text-xs font-semibold text-slate-950">
                        [{index + 1}] {citation.title ?? citation.entity_id}
                      </div>
                      <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-500">
                        {citation.excerpt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
                <div className="flex items-center gap-1 font-semibold">
                  <AlertTriangle size={14} />
                  Giới hạn kết luận
                </div>
                <p className="mt-2">{research.disclaimer}</p>
                {research.missing_data.length ? (
                  <p className="mt-2">
                    Dữ liệu cần bổ sung:{" "}
                    {research.missing_data.map(researchMissingLabel).join(", ")}
                    .
                  </p>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </Surface>
  );
}

function DeviceAssessmentCard({
  assessment,
}: {
  assessment: DeviceAssessment;
}) {
  const brand =
    assessment.device.product_line?.brand.short_name ??
    assessment.device.product_line?.brand.name;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-violet-700">
            Xếp hạng #{assessment.rank} {brand ? `· ${brand}` : ""}
          </div>
          <Link
            href={`/devices/${assessment.device.slug}`}
            className="mt-1 inline-flex max-w-full items-center gap-2 text-base font-semibold text-slate-950 hover:text-violet-700"
          >
            <span className="truncate">{assessment.device.name}</span>
            <ArrowRight size={14} className="shrink-0" />
          </Link>
          <p className="mt-1 truncate text-xs text-slate-500">
            {assessment.device.variant_name}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-2xl font-semibold text-slate-950">
            {assessment.effectiveness_score}
          </div>
          <div className="text-[11px] uppercase text-slate-500">
            chỉ số tương đối
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <ResearchMetric
          label="Phép đo chung"
          value={String(assessment.metrics.comparable_metric_count)}
          compact
        />
        <ResearchMetric
          label="Chất lượng evidence"
          value={evidenceQualityLabel(assessment.evidence_quality)}
          compact
        />
        <ResearchMetric
          label="Throttle"
          value={String(assessment.metrics.throttled_result_count)}
          compact
        />
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-600">
        {assessment.assessment}
      </p>

      <div className="mt-4 space-y-2">
        {assessment.benchmark_results
          .filter((result) => result.comparable)
          .slice(0, 4)
          .map((result) => (
            <div
              key={result.id}
              className="rounded-md border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    {result.benchmark.name}
                    {result.benchmark.subscore_name
                      ? ` · ${result.benchmark.subscore_name}`
                      : ""}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {result.score}
                    {result.benchmark.unit?.symbol
                      ? ` ${result.benchmark.unit.symbol}`
                      : ""}{" "}
                    · so với {result.comparison_size} phiên bản
                  </div>
                </div>
                <span className="text-sm font-semibold text-violet-700">
                  {result.relative_score}/100
                </span>
              </div>
              <BenchmarkContext result={result} />
            </div>
          ))}
      </div>

      {assessment.trade_offs.length ? (
        <div className="mt-4 rounded-md bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          <div className="flex items-center gap-1 font-semibold">
            <AlertTriangle size={13} />
            Điều cần lưu ý
          </div>
          <p className="mt-1">{assessment.trade_offs.join(" ")}</p>
        </div>
      ) : null}
    </article>
  );
}

function BenchmarkContext({
  result,
}: {
  result: DeviceAssessment["benchmark_results"][number];
}) {
  const context = [
    result.conditions.app_version
      ? `App ${result.conditions.app_version}`
      : null,
    result.conditions.power_mode
      ? `Nguồn ${result.conditions.power_mode}`
      : null,
    result.conditions.ambient_temp_c !== null
      ? `${result.conditions.ambient_temp_c}°C`
      : null,
    result.tested_at,
  ].filter(Boolean);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
      {context.length ? (
        context.map((value) => <span key={value}>{value}</span>)
      ) : (
        <span>Chưa ghi đầy đủ điều kiện thử nghiệm</span>
      )}
      {result.conditions.thermal_throttled ? (
        <span className="inline-flex items-center gap-1 font-medium text-amber-700">
          <Thermometer size={11} />
          Thermal throttling
        </span>
      ) : null}
      {result.source ? (
        result.source.url ? (
          <a
            href={result.source.url}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-violet-700 hover:underline"
          >
            {result.source.name}
          </a>
        ) : (
          <span>{result.source.name}</span>
        )
      ) : null}
    </div>
  );
}

function UnrankedDeviceRow({ assessment }: { assessment: DeviceAssessment }) {
  const isPartial = assessment.status === "partial";
  return (
    <div className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_160px_minmax(0,1.4fr)_auto] sm:items-center">
      <div className="min-w-0">
        <Link
          href={`/devices/${assessment.device.slug}`}
          className="inline-flex max-w-full items-center gap-1.5 text-sm font-semibold text-slate-900 hover:text-violet-700"
        >
          <span className="truncate">{assessment.device.name}</span>
          <ArrowRight size={13} className="shrink-0" />
        </Link>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {assessment.device.variant_name}
        </p>
      </div>
      <span
        className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
          isPartial ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"
        }`}
      >
        {isPartial ? <FlaskConical size={12} /> : <MinusCircle size={12} />}
        {isPartial ? "Có phép đo riêng lẻ" : "Chưa có benchmark"}
      </span>
      <p className="text-xs leading-5 text-slate-600">
        {assessment.assessment}
      </p>
      <span className="text-xs font-medium text-slate-500">
        {assessment.metrics.benchmark_count} phép đo
      </span>
    </div>
  );
}

function ResearchMetric({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 px-2 py-2.5">
      <div
        className={`${compact ? "text-sm" : "text-lg"} font-semibold text-slate-950`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

function assessmentStatusLabel(status: HardwareEvidenceStatus) {
  if (status === "measured") return "Có dữ liệu đối chiếu";
  if (status === "partial") return "Có dữ liệu nhưng chưa thể đối chiếu";
  return "Chưa đủ bằng chứng";
}

function evidenceQualityLabel(quality: HardwareEvidenceQuality) {
  if (quality === "strong") return "Mạnh";
  if (quality === "moderate") return "Vừa";
  return "Hạn chế";
}

function researchMissingLabel(value: string) {
  const labels: Record<string, string> = {
    comparable_benchmark_conditions:
      "benchmark chung với điều kiện thử nghiệm tương thích",
    device_benchmark_coverage: "độ phủ benchmark thiết bị",
    documented_test_conditions: "điều kiện thử nghiệm được ghi đầy đủ",
    power_or_energy_measurements: "phép đo công suất hoặc năng lượng",
  };
  const [key, ...suffix] = value.split(" ");
  const label = labels[key] ?? key.replaceAll("_", " ");
  return suffix.length ? `${label} ${suffix.join(" ")}` : label;
}
