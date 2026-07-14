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
  Usb,
} from "lucide-react";
import type {
  DeviceVariantDetail,
  HardwareModuleKind,
} from "@spechub/api-client";
import { specText } from "@/lib/format";

type ModuleItem = {
  name: string;
  meta?: string;
  eyebrow?: string;
  href?: string;
};

type ModuleGroup = {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  items: ModuleItem[];
};

const PRIMARY_MODULE_IDS = new Set([
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
  const modules: ModuleGroup[] = [
    {
      id: "cpu",
      icon: <Cpu size={18} />,
      title: "Bộ xử lý",
      description: "CPU và cấu hình nhân xử lý",
      items: variant?.variant_cpus?.length
        ? variant.variant_cpus.map(({ cpu_role, cpu }) => ({
            name: cpu.name,
            eyebrow: cpu_role || "CPU",
            meta: [
              cpu.core_count ? `${cpu.core_count} nhân` : null,
              cpu.thread_count ? `${cpu.thread_count} luồng` : null,
            ]
              .filter(Boolean)
              .join(" · "),
            href: hardwareHref("cpu", cpu.slug),
          }))
        : [],
    },
    {
      id: "memory",
      icon: <MemoryStick size={18} />,
      title: "RAM",
      description: "Dung lượng, chuẩn và tốc độ bộ nhớ",
      items: variant?.variant_memory_configs?.length
        ? variant.variant_memory_configs.map((memory) => ({
            name: `${memory.capacity_gb} GB ${memory.memory_standard.name}`,
            eyebrow: "Bộ nhớ hệ thống",
            meta: [
              memory.speed_mhz ? `${memory.speed_mhz} MHz` : null,
              memory.channel_count ? `${memory.channel_count} kênh` : null,
            ]
              .filter(Boolean)
              .join(" · "),
            href: hardwareHref("memory-standard", memory.memory_standard.slug),
          }))
        : [],
    },
    {
      id: "gpu-npu",
      icon: <BrainCircuit size={18} />,
      title: "Đồ họa & AI",
      description: "GPU và bộ tăng tốc trí tuệ nhân tạo",
      items: [
        ...(variant?.variant_gpus ?? []).map(({ gpu }) => ({
          name: gpu.name,
          eyebrow: "GPU",
          href: hardwareHref("gpu", gpu.slug),
        })),
        ...(variant?.variant_npus ?? []).map(({ npu }) => ({
          name: npu.name,
          eyebrow: "NPU",
          meta: npu.tops ? `${npu.tops} TOPS` : undefined,
          href: hardwareHref("npu", npu.slug),
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
            name: `${storage.total_capacity_gb} GB ${storage.storage_standard.name}`,
            eyebrow: "Bộ nhớ trong",
            meta: storage.is_expandable ? "Có thể mở rộng" : undefined,
            href: hardwareHref(
              "storage-standard",
              storage.storage_standard.slug,
            ),
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
            name: display_unit.name ?? "Màn hình chính",
            eyebrow: "Hiển thị",
            meta: [
              display_unit.size_inch ? `${display_unit.size_inch} inch` : null,
              display_unit.refresh_rate_hz
                ? `${display_unit.refresh_rate_hz} Hz`
                : null,
            ]
              .filter(Boolean)
              .join(" · "),
            href: display_unit.slug
              ? hardwareHref("display", display_unit.slug)
              : undefined,
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
              name: camera_module.name ?? role ?? "Camera",
              eyebrow: role || "Camera",
              meta: [
                camera_module.effective_megapixel
                  ? `${camera_module.effective_megapixel} MP`
                  : null,
                camera_module.aperture
                  ? `Khẩu độ ${camera_module.aperture}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · "),
              ...(camera_module.slug
                ? { href: hardwareHref("camera", camera_module.slug) }
                : {}),
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
            name: `${specText(battery_unit.capacity_mah)} mAh`,
            eyebrow: "Pin",
            meta: [
              battery_unit.wired_charging_w
                ? `${battery_unit.wired_charging_w}W có dây`
                : null,
              battery_unit.wireless_charging_w
                ? `${battery_unit.wireless_charging_w}W không dây`
                : null,
            ]
              .filter(Boolean)
              .join(" · "),
            href: battery_unit.slug
              ? hardwareHref("battery", battery_unit.slug)
              : undefined,
          }))
        : [],
    },
    {
      id: "network",
      icon: <Network size={18} />,
      title: "Kết nối mạng",
      description: "Modem, chuẩn không dây và băng tần Wi-Fi",
      items: [
        ...(variant?.variant_modems ?? []).map(({ modem }) => ({
          name: modem.name,
          eyebrow: "Modem",
          meta: modem.max_downlink_mbps
            ? `Tải xuống tối đa ${modem.max_downlink_mbps} Mbps`
            : undefined,
          href: hardwareHref("modem", modem.slug),
        })),
        ...(variant?.variant_wireless_support ?? []).map(
          ({ wireless_standard }) => ({
            name: wireless_standard.name,
            eyebrow: "Chuẩn không dây",
            href: hardwareHref("wireless-standard", wireless_standard.slug),
          }),
        ),
        ...(variant?.variant_wifi_bands ?? []).map(({ wifi_band }) => ({
          name: wifi_band.name,
          eyebrow: "Băng tần Wi-Fi",
        })),
      ],
    },
    {
      id: "ports-sensors",
      icon: <Usb size={18} />,
      title: "Cổng & cảm biến",
      description: "Giao tiếp vật lý và cảm biến tích hợp",
      items: [
        ...(variant?.variant_ports ?? []).map(
          ({ port_count, port_standard }) => ({
            name: `${port_count > 1 ? `${port_count} × ` : ""}${port_standard.name}`,
            eyebrow: "Cổng kết nối",
            meta: port_standard.data_speed_gbps
              ? `${port_standard.data_speed_gbps} Gbps`
              : undefined,
            href: hardwareHref("port-standard", port_standard.slug),
          }),
        ),
        ...(variant?.variant_hardware_sensors ?? []).map(
          ({ hardware_sensor }) => ({
            name: hardware_sensor.name,
            eyebrow: "Cảm biến",
            href: hardwareHref("sensor", hardware_sensor.slug),
          }),
        ),
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
  const missingModules = modules.filter((module) => module.items.length === 0);
  const itemCount = populatedModules.reduce(
    (total, module) => total + module.items.length,
    0,
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
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Thành phần được sắp theo vai trò để dễ đọc nhanh. Chọn một linh
              kiện để xem thông số đầy đủ và những thiết bị khác đang sử dụng.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700">
              {variant?.variant_name ?? "Chưa có phiên bản"}
            </span>
            <span className="rounded-full bg-blue-600 px-3 py-1.5 font-semibold text-white">
              {populatedModules.length} nhóm · {itemCount} thành phần
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

          {missingModules.length ? (
            <details className="group rounded-lg border border-dashed border-slate-300 bg-slate-50/60">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-slate-600 transition hover:text-slate-950">
                <span className="inline-flex items-center gap-2">
                  <CircleDashed size={16} />
                  {missingModules.length} nhóm chưa có dữ liệu
                </span>
                <ChevronRight
                  size={16}
                  className="transition-transform group-open:rotate-90"
                />
              </summary>
              <div className="flex flex-wrap gap-2 border-t border-dashed border-slate-300 px-4 py-3">
                {missingModules.map((module) => (
                  <span
                    key={module.id}
                    className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-200"
                  >
                    {module.title}
                  </span>
                ))}
              </div>
            </details>
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
