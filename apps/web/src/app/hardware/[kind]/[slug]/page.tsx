import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  BrainCircuit,
  Camera,
  Cpu,
  GitCompareArrows,
  HardDrive,
  MemoryStick,
  MonitorSmartphone,
  Network,
  Radio,
  Smartphone,
  Usb,
} from "lucide-react";
import type {
  HardwareModuleKind,
  HardwareProductLineResearch,
} from "@spechub/api-client";
import { HardwareAiResearch } from "@/components/hardware-ai-research";
import { Surface, SurfaceHeader } from "@/components/surface";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";

const MODULE_META: Record<
  HardwareModuleKind,
  { label: string; icon: typeof Cpu }
> = {
  chipset: { label: "Chipset", icon: Cpu },
  cpu: { label: "CPU", icon: Cpu },
  gpu: { label: "GPU", icon: BrainCircuit },
  npu: { label: "NPU", icon: BrainCircuit },
  modem: { label: "Modem", icon: Network },
  "memory-standard": { label: "Chuẩn RAM / bộ nhớ", icon: MemoryStick },
  "storage-standard": { label: "Chuẩn bộ nhớ trong", icon: HardDrive },
  "operating-system": { label: "Hệ điều hành", icon: Smartphone },
  "wireless-standard": { label: "Chuẩn không dây", icon: Radio },
  "port-standard": { label: "Chuẩn cổng kết nối", icon: Usb },
  sensor: { label: "Cảm biến phần cứng", icon: MonitorSmartphone },
  camera: { label: "Mô-đun máy ảnh", icon: Camera },
  display: { label: "Mô-đun màn hình", icon: MonitorSmartphone },
  battery: { label: "Mô-đun pin", icon: BatteryCharging },
};

export default async function HardwareModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ kind, slug }, query] = await Promise.all([params, searchParams]);
  if (!Object.prototype.hasOwnProperty.call(MODULE_META, kind)) notFound();

  const moduleKind = kind as HardwareModuleKind;
  const researchQuestion = researchQuestionParam(query.research);
  const result = await api
    .getHardwareModule(moduleKind, slug)
    .catch(() => null);
  if (!result?.data) notFound();

  const researchResult = await api
    .researchHardwareModule(moduleKind, slug, {
      ...(researchQuestion ? { question: researchQuestion } : {}),
    })
    .catch(() => null);

  const hardwareModule = result.data;
  const meta = MODULE_META[moduleKind];
  const Icon = meta.icon;
  const comparisonIds = hardwareModule.research.representative_variant_ids;
  const comparisonHref =
    comparisonIds.length >= 2
      ? `/compare?ids=${encodeURIComponent(comparisonIds.join(","))}`
      : null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/devices" className="hover:text-slate-950">
          Thiết bị
        </Link>
        <span>/</span>
        <span>{meta.label}</span>
        <span>/</span>
        <span className="text-slate-950">{hardwareModule.name}</span>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
              <Icon size={28} />
            </div>
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
                {meta.label}
              </div>
              <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
                {hardwareModule.name}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {hardwareModule.organization?.short_name ??
                  hardwareModule.organization?.name ??
                  "Danh mục SpecHub"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {comparisonHref ? (
              <Link
                href={comparisonHref}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700"
              >
                <GitCompareArrows size={16} />
                So sánh thiết bị
              </Link>
            ) : null}
            <Link
              href="/devices"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:border-blue-300"
            >
              <ArrowLeft size={16} />
              Quay lại thiết bị
            </Link>
          </div>
        </div>
        {hardwareModule.description ? (
          <p className="mt-5 max-w-4xl text-sm leading-6 text-slate-600">
            {hardwareModule.description}
          </p>
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Surface>
          <SurfaceHeader
            title="Thông số mô-đun"
            meta={`${Object.keys(hardwareModule.specs).length} trường dữ liệu`}
          />
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {Object.entries(hardwareModule.specs).map(([key, value]) => (
              <div
                key={key}
                className="rounded-md border border-slate-200 bg-slate-50 p-3"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {humanize(key)}
                </div>
                <div className="mt-2 break-words text-sm leading-6 text-slate-950">
                  {formatHardwareValue(value)}
                </div>
              </div>
            ))}
          </div>
        </Surface>

        <aside className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <ResearchStat
              label="Phiên bản"
              value={hardwareModule.research.variant_count}
            />
            <ResearchStat
              label="Sản phẩm"
              value={hardwareModule.research.product_count}
            />
            <ResearchStat
              label="Thương hiệu"
              value={hardwareModule.research.brand_count}
            />
            <ResearchStat
              label="Nhóm thiết bị"
              value={hardwareModule.research.category_count}
            />
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-blue-700">
              <span>Độ đầy đủ thông số</span>
              <span>{hardwareModule.research.completeness_percent}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{
                  width: `${hardwareModule.research.completeness_percent}%`,
                }}
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {hardwareModule.research.populated_spec_field_count}/
              {hardwareModule.research.spec_field_count} trường đã có dữ liệu;{" "}
              {hardwareModule.research.priced_variant_count} phiên bản có giá.
            </p>
            {hardwareModule.research.missing_specs.length ? (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Còn thiếu:{" "}
                {hardwareModule.research.missing_specs.map(humanize).join(", ")}
                .
              </p>
            ) : null}
          </div>
        </aside>
      </section>

      <HardwareAiResearch
        moduleKind={moduleKind}
        moduleSlug={slug}
        result={researchResult}
        requestedQuestion={researchQuestion}
      />

      {hardwareModule.research.product_lines.length ? (
        <Surface>
          <SurfaceHeader
            title="Phạm vi triển khai theo dòng sản phẩm"
            meta={`${hardwareModule.research.product_lines.length} dòng đang sử dụng mô-đun · không phải điểm hiệu quả`}
          />
          <div className="grid gap-4 p-4 lg:grid-cols-2">
            {hardwareModule.research.product_lines.map((line) => (
              <ProductLineCard
                key={line.family.id}
                line={line}
                totalVariants={hardwareModule.research.variant_count}
              />
            ))}
          </div>
        </Surface>
      ) : null}

      <Surface>
        <SurfaceHeader
          title="Thiết bị dùng mô-đun này"
          meta="Được liên kết từ dữ liệu cấu hình phiên bản"
        />
        {hardwareModule.devices.length ? (
          <div className="divide-y divide-slate-100">
            {hardwareModule.devices.map((device) => (
              <div
                key={`${device.variant_id}-${device.usage_role ?? "module"}`}
                className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-center"
              >
                <div className="min-w-0">
                  <Link
                    href={`/devices/${device.device_model.slug}`}
                    className="inline-flex max-w-full items-center gap-2 text-sm font-semibold text-slate-950 hover:text-blue-700"
                  >
                    <span className="truncate">{device.device_model.name}</span>
                    <ArrowRight size={14} className="shrink-0" />
                  </Link>
                  <div className="mt-1 truncate text-sm text-slate-500">
                    {device.variant_name}
                    {device.market_name ? ` · ${device.market_name}` : ""}
                  </div>
                </div>
                <div className="text-sm text-slate-600">
                  <div>
                    {device.device_model.product_family?.brand_org
                      ?.short_name ??
                      device.device_model.product_family?.brand_org?.name ??
                      "Hãng"}
                    {device.device_model.product_family?.device_category?.name
                      ? ` · ${device.device_model.product_family.device_category.name}`
                      : ""}
                  </div>
                  <div className="mt-1">
                    {device.usage_role
                      ? `Vai trò: ${humanize(device.usage_role)}`
                      : "Mô-đun đã cấu hình"}
                  </div>
                </div>
                <Link
                  href={`/devices/${device.device_model.slug}`}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:border-blue-300"
                >
                  Xem thiết bị
                  <ArrowRight size={14} />
                </Link>
                {device.details && Object.keys(device.details).length ? (
                  <div className="md:col-span-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {Object.entries(device.details)
                      .filter(
                        ([, value]) => value !== null && value !== undefined,
                      )
                      .map(
                        ([key, value]) =>
                          `${humanize(key)}: ${formatHardwareValue(value)}`,
                      )
                      .join(" · ")}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 text-sm text-slate-500">
            Chưa có variant nào được liên kết với module này.
          </div>
        )}
      </Surface>
    </div>
  );
}

function ResearchStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-2xl font-semibold text-slate-950">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>
    </div>
  );
}

function ProductLineCard({
  line,
  totalVariants,
}: {
  line: HardwareProductLineResearch;
  totalVariants: number;
}) {
  const share = totalVariants
    ? Math.round((line.variant_count / totalVariants) * 100)
    : 0;
  const visibleModels = line.models.slice(-6);
  const latestModel = visibleModels[visibleModels.length - 1];
  const compareHref =
    line.representative_variant_ids.length >= 2
      ? `/compare?ids=${encodeURIComponent(line.representative_variant_ids.join(","))}`
      : null;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            {line.family.brand.short_name ?? line.family.brand.name}
          </div>
          <h3 className="mt-1 truncate text-base font-semibold text-slate-950">
            {line.family.name}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {line.family.category.name} · {line.model_count} mẫu ·{" "}
            {line.variant_count} phiên bản
          </p>
        </div>
        <span className="w-fit rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
          {share}% tập research
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>Tỷ trọng phiên bản có dữ liệu</span>
          <span>
            {line.variant_count}/{totalVariants}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={`Tỷ trọng dữ liệu của ${line.family.name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={share}
          className="h-2 overflow-hidden rounded-full bg-slate-100"
        >
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${share}%` }}
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Các thế hệ có dữ liệu
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {visibleModels.map((model) => (
            <Link
              key={model.id}
              href={`/devices/${model.slug}`}
              className="rounded-md border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-300 hover:bg-blue-50/40"
            >
              <div className="truncate text-sm font-medium text-slate-950">
                {model.name}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {model.generation_label ?? releaseYear(model.release_date)} ·{" "}
                {model.variant_count} phiên bản
              </div>
            </Link>
          ))}
        </div>
        {line.models.length > visibleModels.length ? (
          <p className="mt-2 text-xs text-slate-500">
            Và {line.models.length - visibleModels.length} thế hệ cũ hơn.
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {line.usage_roles.map((role) => (
          <span
            key={role}
            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600"
          >
            {humanize(role)}
          </span>
        ))}
        {line.market_count ? (
          <span className="text-xs text-slate-500">
            {line.market_count} thị trường
          </span>
        ) : null}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        {compareHref ? (
          <Link
            href={compareHref}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <GitCompareArrows size={15} />
            So sánh các thế hệ
          </Link>
        ) : latestModel ? (
          <Link
            href={`/devices/${latestModel.slug}`}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:border-blue-300"
          >
            Xem mẫu có dữ liệu
            <ArrowRight size={14} />
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function releaseYear(value?: string | null) {
  if (!value) return "Chưa rõ thế hệ";
  const year = new Date(value).getUTCFullYear();
  return Number.isFinite(year) ? String(year) : "Chưa rõ thế hệ";
}

function humanize(value: string) {
  const labels: Record<string, string> = {
    model_code: "Mã mẫu",
    supports_64bit: "Hỗ trợ 64-bit",
    integrated_5g: "Tích hợp 5G",
    integrated_wifi: "Tích hợp Wi-Fi",
    max_ram_gb: "RAM tối đa (GB)",
    max_display_resolution: "Độ phân giải màn hình tối đa",
    max_camera_mp: "Máy ảnh tối đa (MP)",
    announcement_date: "Ngày công bố",
    release_date: "Ngày ra mắt",
    core_count: "Số nhân",
    thread_count: "Số luồng",
    big_little: "Thiết kế Big.LITTLE",
    isa_name: "Tập lệnh",
    shader_units: "Số đơn vị đổ bóng",
    compute_units: "Số đơn vị tính toán",
    clock_mhz: "Xung nhịp (MHz)",
    fp32_gflops: "FP32 (GFLOPS)",
    ray_tracing_support: "Hỗ trợ dò tia",
    api_support: "API được hỗ trợ",
    tops: "TOPS",
    tops_int4: "TOPS (INT4)",
    tops_fp16: "TOPS (FP16)",
    max_downlink_mbps: "Tải xuống tối đa (Mbps)",
    max_uplink_mbps: "Tải lên tối đa (Mbps)",
    supports_mmwave: "Hỗ trợ mmWave",
    supports_satellite: "Hỗ trợ vệ tinh",
    supported_5g_modes: "Chế độ 5G được hỗ trợ",
    generation: "Thế hệ",
    memory_type: "Loại bộ nhớ",
    max_data_rate_mtps: "Tốc độ dữ liệu tối đa (MT/s)",
    typical_data_rate_mtps: "Tốc độ dữ liệu thông thường (MT/s)",
    voltage: "Điện áp (V)",
    bandwidth_gbps: "Băng thông (GB/s)",
    channel_width_bits: "Độ rộng kênh (bit)",
    is_mobile: "Bộ nhớ di động",
    release_year: "Năm ra mắt",
    sequential_read_mbps: "Đọc tuần tự (MB/s)",
    sequential_write_mbps: "Ghi tuần tự (MB/s)",
    random_read_iops: "Đọc ngẫu nhiên (IOPS)",
    random_write_iops: "Ghi ngẫu nhiên (IOPS)",
    max_speed_mbps: "Tốc độ tối đa (Mbps)",
    data_speed_gbps: "Tốc độ dữ liệu (Gbps)",
    power_delivery_w: "Cấp nguồn (W)",
    alt_modes: "Chế độ thay thế",
    kernel_type: "Loại nhân hệ điều hành",
    is_open_source: "Mã nguồn mở",
    application: "Triển khai chính",
    main: "Chính",
    primary: "Chính",
    secondary: "Phụ",
    capacity_gb: "Dung lượng (GB)",
    speed_mhz: "Tốc độ (MHz)",
    channel_count: "Số kênh",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

function formatHardwareValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Chưa có";
  if (Array.isArray(value) && !value.length) return "Chưa có";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function researchQuestionParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const question = raw?.trim();
  return question && question.length >= 2 ? question.slice(0, 500) : undefined;
}
