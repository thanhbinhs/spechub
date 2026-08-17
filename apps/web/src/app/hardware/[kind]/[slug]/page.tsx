import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowDown,
  BatteryCharging,
  BrainCircuit,
  Camera,
  CheckCircle2,
  Cpu,
  HardDrive,
  MemoryStick,
  MonitorSmartphone,
  Network,
  Smartphone,
} from "lucide-react";
import type { HardwareModuleKind } from "@spechub/api-client";
import { HardwareDeviceExplorer } from "@/components/hardware-device-explorer";
import { api } from "@/lib/api";
import {
  formatAperture,
  formatChargingProtocol,
  formatColorGamut,
  formatDisplayTechnology,
  formatHdrFormats,
  formatIngressProtection,
  formatMeasurement,
  formatScreenSize,
  formatSimType,
  formatSpecNumber,
  specText,
} from "@/lib/format";
import { localizeModuleName } from "@/lib/localize";
import { renderableImageUrl } from "@/lib/media-url";

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
  "memory-standard": { label: "Chuẩn RAM", icon: MemoryStick },
  "storage-standard": { label: "Chuẩn bộ nhớ", icon: HardDrive },
  "operating-system": { label: "Hệ điều hành", icon: Smartphone },
  camera: { label: "Máy ảnh", icon: Camera },
  display: { label: "Màn hình", icon: MonitorSmartphone },
  battery: { label: "Pin", icon: BatteryCharging },
};

export default async function HardwareModulePage({
  params,
}: {
  params: Promise<{ kind: string; slug: string }>;
}) {
  const { kind, slug } = await params;
  if (!Object.prototype.hasOwnProperty.call(MODULE_META, kind)) notFound();

  const moduleKind = kind as HardwareModuleKind;
  const result = await api
    .getHardwareModule(moduleKind, slug)
    .catch(() => null);
  if (!result?.data) notFound();

  const researchResult = await api
    .researchHardwareModule(moduleKind, slug)
    .catch(() => null);
  const hardwareModule = result.data;
  const moduleImageUrl = renderableImageUrl(hardwareModule.image_url);
  const moduleName = localizeModuleName(hardwareModule.name);
  const meta = MODULE_META[moduleKind];
  const Icon = meta.icon;
  const specEntries = Object.entries(hardwareModule.specs).filter(
    ([, value]) =>
      value !== null &&
      value !== undefined &&
      value !== "" &&
      (!Array.isArray(value) || value.length > 0),
  );

  return (
    <div className="app-page mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <nav
        aria-label="Đường dẫn"
        className="flex flex-wrap items-center gap-2 text-sm text-slate-500"
      >
        <Link href="/devices" className="hover:text-slate-950">
          Thiết bị
        </Link>
        <span aria-hidden="true">/</span>
        <span>{meta.label}</span>
        <span aria-hidden="true">/</span>
        <span className="text-slate-950">{moduleName}</span>
      </nav>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div
          className={`grid ${
            moduleImageUrl
              ? "xl:grid-cols-[minmax(0,1fr)_380px_280px]"
              : "lg:grid-cols-[minmax(0,1fr)_360px]"
          }`}
        >
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
                <Icon size={22} />
              </span>
              <span className="text-sm font-semibold text-blue-700">
                {meta.label} ·{" "}
                {hardwareModule.organization?.short_name ??
                  hardwareModule.organization?.name ??
                  "SpecHub"}
              </span>
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {moduleName}
            </h1>
            {hardwareModule.description ? (
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                {hardwareModule.description}
              </p>
            ) : null}
            <a
              href="#compatible-devices"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Xem thiết bị cùng dùng
              <ArrowDown size={16} />
            </a>
          </div>

          {moduleImageUrl ? (
            <figure className="device-artwork group relative isolate min-h-80 overflow-hidden border-t border-slate-200 bg-slate-50 xl:border-l xl:border-t-0">
              <div
                aria-hidden="true"
                className="absolute inset-3 rounded-xl border border-white/90 bg-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
              />
              <div
                aria-hidden="true"
                className="absolute bottom-[18%] left-1/2 h-7 w-[52%] -translate-x-1/2 rounded-[50%] bg-slate-950/10 blur-xl transition duration-300 group-hover:w-[60%]"
              />
              <span className="absolute left-5 top-5 z-20 rounded-full border border-white/90 bg-white/[0.88] px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-md">
                {meta.label}
              </span>
              <Image
                src={moduleImageUrl}
                alt={
                  hardwareModule.image_is_module
                    ? `Ảnh chính thức của ${moduleName}`
                    : `Thiết bị tiêu biểu sử dụng ${moduleName}`
                }
                fill
                priority
                sizes="(min-width: 1280px) 380px, 100vw"
                className="z-10 object-contain p-5 pb-16 pt-12 drop-shadow-[0_16px_20px_rgba(15,23,42,0.16)] transition duration-300 group-hover:scale-[1.035]"
              />
              <figcaption className="absolute inset-x-5 bottom-5 z-20 flex items-center justify-between gap-3 rounded-lg border border-white/90 bg-white/[0.9] px-3 py-2.5 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-md">
                <span>
                  {hardwareModule.image_is_module
                    ? "Ảnh module chính thức"
                    : "Thiết bị minh họa"}
                  {hardwareModule.image_device
                    ? ` · ${hardwareModule.image_device.name}`
                    : ""}
                </span>
                {hardwareModule.image_is_module &&
                hardwareModule.image_source_url ? (
                  <a
                    href={hardwareModule.image_source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-blue-700 hover:underline"
                  >
                    Nguồn
                  </a>
                ) : hardwareModule.image_device ? (
                  <Link
                    href={`/devices/${hardwareModule.image_device.slug}`}
                    className="shrink-0 text-blue-700 hover:underline"
                  >
                    Xem máy
                  </Link>
                ) : null}
              </figcaption>
            </figure>
          ) : null}

          <dl
            className={`grid grid-cols-2 border-t border-slate-200 bg-slate-50 ${
              moduleImageUrl
                ? "xl:border-l xl:border-t-0"
                : "lg:border-l lg:border-t-0"
            }`}
          >
            <HeroStat
              value={hardwareModule.research.product_count}
              label="Thiết bị"
            />
            <HeroStat
              value={hardwareModule.research.variant_count}
              label="Phiên bản"
            />
            <HeroStat
              value={hardwareModule.research.brand_count}
              label="Thương hiệu"
            />
            <HeroStat
              value={`${hardwareModule.research.completeness_percent}%`}
              label="Đủ dữ liệu"
            />
          </dl>
        </div>
      </section>

      <section
        aria-labelledby="module-specifications"
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]"
      >
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2
              id="module-specifications"
              className="text-lg font-semibold text-slate-950"
            >
              Thông số chính
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Các dữ liệu kỹ thuật đã được chuẩn hóa.
            </p>
          </div>
          {specEntries.length ? (
            <dl className="grid sm:grid-cols-2">
              {specEntries.map(([key, value], index) => (
                <div
                  key={key}
                  className={`grid grid-cols-[minmax(110px,0.7fr)_minmax(0,1fr)] gap-4 px-5 py-3.5 text-sm sm:px-6 ${
                    index < specEntries.length - 2
                      ? "border-b border-slate-100"
                      : ""
                  } ${index % 2 === 0 ? "sm:border-r" : ""}`}
                >
                  <dt className="text-slate-500">{humanize(key)}</dt>
                  <dd className="break-words text-right font-medium text-slate-950">
                    <HardwareSpecValue specKey={key} value={value} />
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="p-6 text-sm text-slate-500">
              Chưa có thông số kỹ thuật để hiển thị.
            </p>
          )}
        </div>

        <aside className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <CheckCircle2 size={17} className="text-emerald-600" />
            Chất lượng dữ liệu
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{
                width: `${hardwareModule.research.completeness_percent}%`,
              }}
            />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {hardwareModule.research.populated_spec_field_count}/
            {hardwareModule.research.spec_field_count} trường thông số đã có dữ
            liệu. {hardwareModule.research.priced_variant_count} phiên bản có
            giá tham chiếu.
          </p>
          {hardwareModule.research.missing_specs.length ? (
            <details className="mt-4 border-t border-slate-100 pt-4">
              <summary className="cursor-pointer text-sm font-medium text-slate-700">
                Xem dữ liệu còn thiếu
              </summary>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {hardwareModule.research.missing_specs.map(humanize).join(", ")}
                .
              </p>
            </details>
          ) : null}
        </aside>
      </section>

      <div id="compatible-devices" className="scroll-mt-24">
        <HardwareDeviceExplorer
          moduleName={moduleName}
          devices={hardwareModule.devices}
          assessments={researchResult?.data.device_assessments}
          summary={researchResult?.data.summary}
        />
      </div>
    </div>
  );
}

function HeroStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex min-h-32 flex-col justify-end border-b border-r border-slate-200 p-5 even:border-r-0 lg:min-h-0">
      <dd className="text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </dd>
      <dt className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
    </div>
  );
}

function humanize(value: string) {
  const hardwareLabels: Record<string, string> = {
    chipsets: "Chipset",
    cpus: "CPU",
    gpus: "GPU",
    npus: "NPU",
    modems: "Modem",
  };

  if (hardwareLabels[value]) return hardwareLabels[value];

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const LINKED_HARDWARE_KINDS = {
  chipsets: "chipset",
  cpus: "cpu",
  gpus: "gpu",
  npus: "npu",
  modems: "modem",
} as const;

function HardwareSpecValue({
  specKey,
  value,
}: {
  specKey: string;
  value: unknown;
}) {
  if (isUnavailableHardwareValue(value)) {
    return (
      <span
        className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"
        title={typeof value.notes === "string" ? value.notes : undefined}
      >
        {value.label}
      </span>
    );
  }

  const linkedKind =
    LINKED_HARDWARE_KINDS[specKey as keyof typeof LINKED_HARDWARE_KINDS];

  if (linkedKind && Array.isArray(value)) {
    const linkedModules = value.filter(isLinkedHardwareModule);

    if (linkedModules.length) {
      return (
        <span className="inline-flex flex-wrap justify-end gap-1.5">
          {linkedModules.map((linkedModule) => (
            <Link
              key={linkedModule.id ?? linkedModule.slug}
              href={`/hardware/${linkedKind}/${linkedModule.slug}`}
              className="rounded-md bg-blue-50 px-2 py-1 text-blue-700 transition hover:bg-blue-100 hover:text-blue-900"
            >
              {localizeModuleName(linkedModule.name)}
            </Link>
          ))}
        </span>
      );
    }
  }

  return formatHardwareValue(value, specKey);
}

function isUnavailableHardwareValue(
  value: unknown,
): value is { label: string; notes?: unknown } {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    (item.availability_status === "not_disclosed" ||
      item.availability_status === "not_applicable") &&
    typeof item.label === "string"
  );
}

function isLinkedHardwareModule(
  value: unknown,
): value is { id?: string; name: string; slug: string } {
  if (!value || typeof value !== "object") return false;

  const hardwareModule = value as Record<string, unknown>;
  return (
    typeof hardwareModule.name === "string" &&
    typeof hardwareModule.slug === "string"
  );
}

const SPECIFICATION_UNITS: Record<string, string> = {
  capacity_mah: "mAh",
  rated_capacity_mah: "mAh",
  energy_wh: "Wh",
  voltage_nominal_v: "V",
  wired_charging_w: "W",
  wireless_charging_w: "W",
  reverse_wired_charging_w: "W",
  reverse_wireless_charging_w: "W",
  effective_megapixel: "MP",
  focal_length_mm_eq: "mm",
  focal_length_mm_native: "mm",
  field_of_view_deg: "°",
  pixel_density_ppi: "ppi",
  refresh_rate_hz: "Hz",
  refresh_rate_min_hz: "Hz",
  touch_sampling_hz: "Hz",
  brightness_typical_nits: "nit",
  brightness_hbm_nits: "nit",
  brightness_peak_nits: "nit",
  pwm_frequency_hz: "Hz",
  bandwidth_gbps: "Gbps",
  max_frequency_mhz: "MHz",
  min_frequency_mhz: "MHz",
  clock_mhz: "MHz",
  max_downlink_mbps: "Mbps",
  max_uplink_mbps: "Mbps",
  tops: "TOPS",
  tops_int8: "TOPS",
  tops_int4: "TOPS",
  tops_fp16: "TOPS",
};

function formatHardwareValue(value: unknown, specKey?: string): string {
  if (value === null || value === undefined || value === "") return "Chưa có";
  if (isUnavailableHardwareValue(value)) return value.label;
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (Array.isArray(value)) {
    return value.map((item) => formatHardwareValue(item, specKey)).join(", ");
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(
        ([key, item]) => `${humanize(key)}: ${formatHardwareValue(item, key)}`,
      )
      .join(" · ");
  }
  if (typeof value === "number") return formatHardwareNumber(specKey, value);
  return formatHardwareText(specKey, String(value));
}

function formatHardwareNumber(specKey: string | undefined, value: number) {
  if (specKey === "size_inch") return formatScreenSize(value) ?? String(value);
  if (specKey === "optical_zoom" || specKey === "digital_zoom_max") {
    return `${formatSpecNumber(value, 1) ?? value}×`;
  }
  const unit = specKey ? SPECIFICATION_UNITS[specKey] : undefined;
  return unit
    ? (formatMeasurement(value, unit, 2) ?? String(value))
    : (formatSpecNumber(value, 2) ?? String(value));
}

function formatHardwareText(specKey: string | undefined, value: string) {
  switch (specKey) {
    case "aperture":
      return formatAperture(value) ?? specText(value);
    case "technology":
      return formatDisplayTechnology(value) ?? specText(value);
    case "color_gamut":
      return formatColorGamut(value) ?? specText(value);
    case "hdr_formats":
      return formatHdrFormats(value) ?? specText(value);
    case "wired_charging_protocol":
    case "wireless_charging_protocol":
      return formatChargingProtocol(value) ?? specText(value);
    case "sim_type":
      return formatSimType(value) ?? specText(value);
    case "ingress_protection":
      return formatIngressProtection(value) ?? specText(value);
    default:
      return specText(value);
  }
}
