import Link from "next/link";
import type { ReactNode } from "react";
import {
  BatteryCharging,
  BrainCircuit,
  Camera,
  ChevronRight,
  CircleDashed,
  Cpu,
  HardDrive,
  MemoryStick,
  MonitorSmartphone,
  Network,
  Radio,
  Smartphone,
} from "lucide-react";
import type {
  DeviceVariantDetail,
  HardwareModuleKind,
} from "@spechub/api-client";
import { configurationVersionLabel } from "@/lib/device-benchmark";
import {
  formatAperture,
  formatMeasurement,
  formatScreenSize,
  specText,
} from "@/lib/format";
import { localizeModuleName, localizeRole } from "@/lib/localize";

type ModuleItem = {
  name: string;
  meta?: string;
  eyebrow?: string;
  href?: string;
  score?: {
    value: number;
    version: string;
  };
};

type ModuleGroup = {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  items: ModuleItem[];
};

const PRIMARY_MODULE_IDS = new Set([
  "chipset",
  "cpu",
  "memory",
  "gpu-npu",
  "storage",
  "display",
  "camera",
  "battery",
]);

function hardwareHref(kind: HardwareModuleKind, slug: string) {
  return `/hardware/${kind}/${slug}`;
}

export function DeviceSpecModules({
  variant,
}: {
  variant?: DeviceVariantDetail;
}) {
  const moduleScores = new Map(
    (variant?.variant_module_scores ?? []).map((item) => [
      `${item.module_kind}:${item.module_id}`,
      {
        value: Number(item.score),
        version: item.score_version || "v1",
      },
    ]),
  );
  const getScore = (kind: HardwareModuleKind, id?: string | null) => {
    if (!id) return undefined;
    const score = moduleScores.get(`${kind}:${id}`);
    return score && Number.isFinite(score.value) ? score : undefined;
  };
  const normalizedCpus = variant?.variant_cpus?.length
    ? variant.variant_cpus
    : (variant?.variant_chipsets ?? []).flatMap(({ chip_role, chipset }) =>
        (chipset.chipset_cpu_links ?? []).map((link) => ({
          cpu_role: chip_role,
          is_primary: link.is_primary,
          cpu: link.cpu,
        })),
      );
  const normalizedGpus = variant?.variant_gpus?.length
    ? variant.variant_gpus
    : (variant?.variant_chipsets ?? []).flatMap(({ chip_role, chipset }) =>
        (chipset.chipset_gpu_links ?? []).map((link) => ({
          gpu_role: chip_role,
          is_primary: link.is_primary,
          gpu: link.gpu,
        })),
      );
  const normalizedNpus = variant?.variant_npus?.length
    ? variant.variant_npus
    : (variant?.variant_chipsets ?? []).flatMap(({ chip_role, chipset }) =>
        (chipset.chipset_npu_links ?? []).map((link) => ({
          npu_role: chip_role,
          is_primary: link.is_primary,
          npu: link.npu,
        })),
      );
  const normalizedModems = variant?.variant_modems?.length
    ? variant.variant_modems
    : (variant?.variant_chipsets ?? []).flatMap(({ chip_role, chipset }) =>
        (chipset.chipset_modem_links ?? []).map((link) => ({
          modem_role: chip_role,
          is_primary: link.is_primary,
          modem: link.modem,
        })),
      );
  const modules: ModuleGroup[] = [
    {
      id: "chipset",
      icon: <Cpu size={18} />,
      title: "Chipset",
      description: "Nền tảng xử lý và khả năng tích hợp hệ thống",
      items: variant?.variant_chipsets?.length
        ? variant.variant_chipsets.map(({ chip_role, chipset }) => ({
            name: localizeModuleName(chipset.name),
            eyebrow: localizeRole(chip_role, "Chipset"),
            meta: [
              chipset.manufacturer?.short_name ??
                chipset.manufacturer?.name ??
                null,
              chipset.integrated_5g ? "Tích hợp 5G" : null,
              chipset.max_ram_gb
                ? `Hỗ trợ tối đa ${chipset.max_ram_gb} GB RAM`
                : null,
            ]
              .filter(Boolean)
              .join(" · "),
            href: hardwareHref("chipset", chipset.slug),
            score: getScore("chipset", chipset.id),
          }))
        : [],
    },
    {
      id: "cpu",
      icon: <Cpu size={18} />,
      title: "Bộ xử lý",
      description: "CPU và cấu hình nhân xử lý",
      items: normalizedCpus.length
        ? normalizedCpus.map(({ cpu_role, cpu }) => ({
            name: localizeModuleName(cpu.name),
            eyebrow: localizeRole(cpu_role, "CPU"),
            meta: [
              cpu.core_count ? `${cpu.core_count} nhân` : null,
              cpu.thread_count ? `${cpu.thread_count} luồng` : null,
            ]
              .filter(Boolean)
              .join(" · "),
            href: hardwareHref("cpu", cpu.slug),
            score: getScore("cpu", cpu.id),
          }))
        : [],
    },
    {
      id: "memory",
      icon: <MemoryStick size={18} />,
      title: "RAM",
      description: "Dung lượng và thông số của chuẩn bộ nhớ",
      items: variant?.variant_memory_configs?.length
        ? variant.variant_memory_configs.map((memory) => ({
            name: `${formatMeasurement(memory.capacity_gb, "GB", 0)} ${memory.memory_standard.name}`,
            eyebrow: "Bộ nhớ hệ thống",
            meta: [
              memory.memory_standard.max_data_rate_mtps
                ? `tối đa ${memory.memory_standard.max_data_rate_mtps} MT/s`
                : memory.memory_standard.typical_data_rate_mtps
                  ? `${memory.memory_standard.typical_data_rate_mtps} MT/s`
                  : null,
              memory.channel_count ? `${memory.channel_count} kênh` : null,
            ]
              .filter(Boolean)
              .join(" · "),
            href: hardwareHref("memory-standard", memory.memory_standard.slug),
            score: getScore("memory-standard", memory.memory_standard.id),
          }))
        : [],
    },
    {
      id: "gpu-npu",
      icon: <BrainCircuit size={18} />,
      title: "Đồ họa & AI",
      description: "GPU và bộ tăng tốc trí tuệ nhân tạo",
      items: [
        ...normalizedGpus.map(({ gpu }) => ({
          name: localizeModuleName(gpu.name),
          eyebrow: "GPU",
          href: hardwareHref("gpu", gpu.slug),
          score: getScore("gpu", gpu.id),
        })),
        ...normalizedNpus.map(({ npu }) => ({
          name: localizeModuleName(npu.name),
          eyebrow: "NPU",
          meta: npu.tops ? `${npu.tops} TOPS` : undefined,
          href: hardwareHref("npu", npu.slug),
          score: getScore("npu", npu.id),
        })),
      ],
    },
    {
      id: "storage",
      icon: <HardDrive size={18} />,
      title: "Lưu trữ",
      description: "Dung lượng và chuẩn bộ nhớ trong",
      items: variant?.variant_storage_configs?.length
        ? variant.variant_storage_configs.map((storage) => ({
            name: `${formatMeasurement(storage.total_capacity_gb, "GB", 0)} ${storage.storage_standard.name}`,
            eyebrow: "Bộ nhớ trong",
            meta: storage.is_expandable ? "Có thể mở rộng" : undefined,
            href: hardwareHref(
              "storage-standard",
              storage.storage_standard.slug,
            ),
            score: getScore("storage-standard", storage.storage_standard.id),
          }))
        : [],
    },
    {
      id: "display",
      icon: <MonitorSmartphone size={18} />,
      title: "Màn hình",
      description: "Tấm nền, kích thước và tần số quét",
      items: variant?.variant_displays?.length
        ? variant.variant_displays.map(({ display_unit }) => ({
            name: localizeModuleName(display_unit.name, "Màn hình chính"),
            eyebrow: "Hiển thị",
            meta: [
              formatScreenSize(display_unit.size_inch),
              formatMeasurement(display_unit.refresh_rate_hz, "Hz", 0),
            ]
              .filter(Boolean)
              .join(" · "),
            href: display_unit.slug
              ? hardwareHref("display", display_unit.slug)
              : undefined,
            score: getScore("display", display_unit.id),
          }))
        : [],
    },
    {
      id: "camera",
      icon: <Camera size={18} />,
      title: "Máy ảnh",
      description: "Cụm camera và vai trò từng cảm biến",
      items:
        variant?.variant_camera_systems?.flatMap((system) =>
          (system.variant_camera_modules ?? []).map(
            ({ camera_module, role }) => ({
              name: localizeModuleName(
                camera_module.name,
                localizeRole(role, "Máy ảnh"),
              ),
              eyebrow: localizeRole(role, "Máy ảnh"),
              meta: [
                camera_module.effective_megapixel
                  ? formatMeasurement(
                      camera_module.effective_megapixel,
                      "MP",
                      1,
                    )
                  : null,
                camera_module.aperture
                  ? `Khẩu độ ${formatAperture(camera_module.aperture)}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · "),
              ...(camera_module.slug
                ? { href: hardwareHref("camera", camera_module.slug) }
                : {}),
              score: getScore("camera", camera_module.id),
            }),
          ),
        ) ?? [],
    },
    {
      id: "battery",
      icon: <BatteryCharging size={18} />,
      title: "Pin & sạc",
      description: "Dung lượng và công suất sạc hỗ trợ",
      items: variant?.variant_batteries?.length
        ? variant.variant_batteries.map(({ battery_unit }) => ({
            name:
              formatMeasurement(battery_unit.capacity_mah, "mAh", 0) ??
              specText(battery_unit.capacity_mah),
            eyebrow: "Pin",
            meta: [
              battery_unit.wired_charging_w
                ? `${formatMeasurement(battery_unit.wired_charging_w, "W", 0)} có dây`
                : null,
              battery_unit.wireless_charging_w
                ? `${formatMeasurement(battery_unit.wireless_charging_w, "W", 0)} không dây`
                : null,
            ]
              .filter(Boolean)
              .join(" · "),
            href: battery_unit.slug
              ? hardwareHref("battery", battery_unit.slug)
              : undefined,
            score: getScore("battery", battery_unit.id),
          }))
        : [],
    },
    {
      id: "network",
      icon: <Network size={18} />,
      title: "Kết nối mạng",
      description: "Modem và băng tần Wi-Fi",
      items: [
        ...normalizedModems.map(({ modem }) => ({
          name: localizeModuleName(modem.name),
          eyebrow: "Modem",
          meta: modem.max_downlink_mbps
            ? `Tải xuống tối đa ${modem.max_downlink_mbps} Mbps`
            : undefined,
          href: hardwareHref("modem", modem.slug),
          score: getScore("modem", modem.id),
        })),
        ...(variant?.variant_wifi_bands ?? []).map(({ wifi_band }) => ({
          name: wifi_band.name,
          eyebrow: "Băng tần Wi-Fi",
        })),
      ],
    },
    {
      id: "operating-system",
      icon: <Smartphone size={18} />,
      title: "Hệ điều hành",
      description: "Nền tảng phần mềm và giao diện cài sẵn",
      items: variant?.variant_operating_systems?.length
        ? variant.variant_operating_systems.map((item) => ({
            name: `${item.os_version.operating_system.name} ${item.os_version.version_name}`,
            eyebrow: "Phần mềm",
            meta: item.ui_layer_version
              ? `${item.ui_layer_version.ui_layer.name} ${item.ui_layer_version.version_name}`
              : undefined,
            href: hardwareHref(
              "operating-system",
              item.os_version.operating_system.slug,
            ),
            score: getScore(
              "operating-system",
              item.os_version.operating_system.id,
            ),
          }))
        : [],
    },
    {
      id: "cellular-bands",
      icon: <Radio size={18} />,
      title: "Băng tần di động",
      description: "Các băng tần mạng được thiết bị hỗ trợ",
      items: variant?.variant_cellular_band_support?.length
        ? variant.variant_cellular_band_support.map(({ cellular_band }) => ({
            name: cellular_band.name,
            eyebrow: "Băng tần",
          }))
        : [],
    },
  ];

  const populatedModules = modules.filter((module) => module.items.length > 0);
  const primaryModules = populatedModules.filter((module) =>
    PRIMARY_MODULE_IDS.has(module.id),
  );
  const supportingModules = populatedModules.filter(
    (module) => !PRIMARY_MODULE_IDS.has(module.id),
  );
  return (
    <section
      id="hardware-modules"
      className="scroll-mt-28 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-200 bg-slate-50/70 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              Cấu hình đang xem
            </div>
            <h2 className="text-xl font-semibold text-slate-950">
              Mô-đun phần cứng
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700">
              {variant?.variant_name ?? "Chưa có phiên bản"}
            </span>
          </div>
        </div>
      </div>

      {populatedModules.length ? (
        <div className="space-y-8 p-5 sm:p-6">
          {primaryModules.length ? (
            <ModuleSection
              title="Thành phần chính"
              description="Các mô-đun ảnh hưởng trực tiếp đến hiệu năng và trải nghiệm sử dụng."
              modules={primaryModules}
            />
          ) : null}

          {supportingModules.length ? (
            <ModuleSection
              title="Kết nối & hệ thống"
              description="Khả năng kết nối, giao tiếp phần cứng và nền tảng phần mềm."
              modules={supportingModules}
            />
          ) : null}
        </div>
      ) : (
        <div className="grid min-h-56 place-items-center p-6 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">
              <CircleDashed size={22} />
            </span>
            <h3 className="mt-4 font-semibold text-slate-950">
              Chưa có dữ liệu mô-đun
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Phiên bản này chưa được liên kết với linh kiện phần cứng trong
              danh mục.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function ModuleSection({
  title,
  description,
  modules,
}: {
  title: string;
  description: string;
  modules: ModuleGroup[];
}) {
  return (
    <section>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {modules.map((module) => (
          <SpecModule key={module.id} module={module} />
        ))}
      </div>
    </section>
  );
}

function SpecModule({ module }: { module: ModuleGroup }) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors hover:border-slate-300">
      <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
          {module.icon}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-slate-950">{module.title}</h4>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200">
              {module.items.length}
            </span>
          </div>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">
            {module.description}
          </p>
        </div>
      </div>
      <ul className="divide-y divide-slate-100">
        {module.items.map((item, index) => (
          <li key={`${module.id}-${item.name}-${index}`}>
            <ModuleItemRow item={item} />
          </li>
        ))}
      </ul>
    </article>
  );
}

function ModuleItemRow({ item }: { item: ModuleItem }) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        {item.eyebrow ? (
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {item.eyebrow}
          </div>
        ) : null}
        <div className="mt-0.5 break-words text-sm font-medium text-slate-900">
          {item.name}
        </div>
        {item.meta ? (
          <div className="mt-1 break-words text-xs leading-5 text-slate-500">
            {item.meta}
          </div>
        ) : null}
      </div>
      {item.score ? (
        <span
          className="shrink-0 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-right text-blue-800"
          title={`Chỉ số cấu hình SpecHub ${configurationVersionLabel(item.score.version)}; không phải benchmark`}
        >
          <strong className="block text-sm leading-none">
            {formatModuleScore(item.score.value)}
          </strong>
          <span className="mt-1 block text-[9px] font-medium">Cấu hình</span>
        </span>
      ) : (
        <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-right text-slate-500">
          <strong className="block text-sm leading-none">—</strong>
          <span className="mt-1 block text-[9px] font-medium">Chưa chấm</span>
        </span>
      )}
      {item.href ? (
        <ChevronRight
          size={17}
          className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
        />
      ) : null}
    </>
  );

  return item.href ? (
    <Link
      href={item.href}
      className="group flex min-h-16 items-center gap-3 px-4 py-3 outline-none transition hover:bg-blue-50/50 focus-visible:bg-blue-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
    >
      {content}
    </Link>
  ) : (
    <div className="flex min-h-16 items-center gap-3 px-4 py-3">{content}</div>
  );
}

function formatModuleScore(score: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
  }).format(score);
}
