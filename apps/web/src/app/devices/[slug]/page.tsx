import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BatteryCharging,
  BrainCircuit,
  Calendar,
  ChevronRight,
  Cpu,
  GitCompareArrows,
  Monitor,
  Scale,
} from "lucide-react";
import { api } from "@/lib/api";
import { DeviceArtwork } from "@/components/device-artwork";
import { DeviceEngagementPanel } from "@/components/device-engagement-panel";
import { DeviceSpecModules } from "@/components/device-spec-modules";
import { MarketplaceOffers } from "@/components/marketplace-offers";
import { Surface } from "@/components/surface";
import { formatDate, formatPrice, specText } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DeviceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: model } = await api.getDeviceModel(slug);
  const variants = model.device_variants ?? [];
  const defaultVariant =
    variants.find((variant) => variant.is_default) ?? variants[0];
  const brand =
    model.product_family?.brand_org?.short_name ??
    model.product_family?.brand_org?.name ??
    "SpecHub";
  const category = model.product_family?.device_category?.name ?? "Thiết bị";
  const physical = defaultVariant?.variant_physical_specs;
  const chipset = defaultVariant?.variant_chipsets?.[0]?.chipset;
  const display = defaultVariant?.variant_displays?.[0]?.display_unit;
  const battery = defaultVariant?.variant_batteries?.[0]?.battery_unit;
  const compareIds = variants
    .slice(0, 2)
    .map((variant) => variant.id)
    .join(",");

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/devices" className="hover:text-slate-950">
          Thiết bị
        </Link>
        <ChevronRight size={15} />
        <span>{model.name}</span>
      </div>

      <section className="grid gap-5 lg:grid-cols-[400px_minmax(0,1fr)]">
        <DeviceArtwork
          hero
          brand={brand}
          name={model.name}
          category={category}
          accent={defaultVariant?.color_hex}
        />

        <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
              {brand}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
              {category}
            </span>
            <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
              {model.release_status?.name ?? "Chưa xác định"}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {model.name}
          </h1>
          {model.description ? (
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              {model.description}
            </p>
          ) : null}
          <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Metric
              icon={<Calendar size={18} />}
              label="Ra mắt"
              value={formatDate(model.release_date)}
            />
            <Metric
              icon={<Cpu size={18} />}
              label="Chipset"
              value={chipset?.name ?? "Chưa có"}
            />
            <Metric
              icon={<Monitor size={18} />}
              label="Màn hình"
              value={
                display
                  ? `${specText(display.size_inch)} inch · ${specText(
                      display.refresh_rate_hz,
                    )} Hz`
                  : "Chưa có"
              }
            />
            <Metric
              icon={<BatteryCharging size={18} />}
              label="Pin"
              value={`${specText(battery?.capacity_mah)} mAh`}
            />
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/ai?q=${encodeURIComponent(`Phân tích ${model.name}`)}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <BrainCircuit size={17} />
              Hỏi AI
            </Link>
            <Link
              href={compareIds ? `/compare?ids=${compareIds}` : "/compare"}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-slate-950"
            >
              <GitCompareArrows size={17} />
              So sánh phiên bản
            </Link>
          </div>
        </div>
      </section>

      <nav
        aria-label="Điều hướng nội dung thiết bị"
        className="sticky top-16 z-20 overflow-x-auto rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-sm backdrop-blur"
      >
        <div className="flex min-w-max gap-1">
          <SectionLink href="#overview">Tổng quan</SectionLink>
          <SectionLink href="#hardware-modules">Mô-đun phần cứng</SectionLink>
          <SectionLink href="#marketplace-prices">Giá tại sàn</SectionLink>
          <SectionLink href="#variants">Phiên bản</SectionLink>
        </div>
      </nav>

      <section
        id="overview"
        className="scroll-mt-28 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]"
      >
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Tổng quan thông số
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Các thông số quan trọng của cấu hình mặc định.
              </p>
            </div>
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              {defaultVariant?.variant_name ?? "Chưa có phiên bản"}
            </span>
          </div>
          <div className="grid gap-3 p-5 sm:p-6 md:grid-cols-2">
            <SpecRow
              icon={<Cpu size={18} />}
              label="Hiệu năng"
              value={[
                chipset?.name,
                chipset?.manufacturer?.short_name ??
                  chipset?.manufacturer?.name,
                chipset?.integrated_5g ? "tích hợp 5G" : null,
                chipset?.max_ram_gb
                  ? `tối đa ${chipset.max_ram_gb}GB RAM`
                  : null,
              ]
                .filter(Boolean)
                .join(", ")}
            />
            <SpecRow
              icon={<Monitor size={18} />}
              label="Màn hình"
              value={
                display
                  ? `${display.size_inch ?? "Chưa có"} inch, ${
                      display.resolution_width ?? "?"
                    } x ${display.resolution_height ?? "?"}, ${
                      display.refresh_rate_hz ?? "?"
                    }Hz, ${specText(display.brightness_peak_nits)} nits`
                  : undefined
              }
            />
            <SpecRow
              icon={<BatteryCharging size={18} />}
              label="Pin và sạc"
              value={`${specText(battery?.capacity_mah)} mAh, ${specText(
                battery?.wired_charging_w,
              )}W sạc có dây, ${specText(battery?.wireless_charging_w)}W sạc không dây`}
            />
            <SpecRow
              icon={<Scale size={18} />}
              label="Thân máy"
              value={`${specText(physical?.height_mm)} x ${specText(
                physical?.width_mm,
              )} x ${specText(physical?.thickness_mm)} mm, ${specText(
                physical?.weight_g,
              )} g`}
            />
          </div>
          <div className="grid gap-x-6 gap-y-4 border-t border-slate-200 bg-slate-50/50 px-5 py-4 sm:grid-cols-2 sm:px-6 xl:grid-cols-5">
            <Fact label="Dòng sản phẩm" value={model.product_family?.name} />
            <Fact label="Thế hệ" value={model.generation_label} />
            <Fact label="Công bố" value={formatDate(model.announcement_date)} />
            <Fact label="Số phiên bản" value={String(variants.length)} />
            <Fact
              label="Giá khởi điểm"
              value={formatPrice(
                defaultVariant?.launch_price,
                defaultVariant?.currency,
              )}
            />
          </div>
        </div>

        <div className="space-y-5">
          <DeviceEngagementPanel variants={variants} />
        </div>
      </section>

      <DeviceSpecModules variant={defaultVariant} />

      <MarketplaceOffers modelSlug={model.slug} variants={variants} />

      <div id="variants" className="scroll-mt-28">
        <Surface>
          <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Phiên bản
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Giá, màu sắc, tên thị trường và thao tác so sánh.
              </p>
            </div>
            <Link
              href={`/ai?q=${encodeURIComponent(`So sánh các phiên bản của ${model.name}`)}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-slate-950"
            >
              <BrainCircuit size={16} />
              Hỏi về phiên bản
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {variants.length ? (
              variants.map((variant) => {
                const peer = variants.find(
                  (candidate) => candidate.id !== variant.id,
                );
                const href = peer
                  ? `/compare?ids=${variant.id},${peer.id}`
                  : "/compare";

                return (
                  <div
                    key={variant.id}
                    className="grid gap-3 p-4 text-sm md:grid-cols-[minmax(180px,1fr)_160px_140px_120px_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-slate-950">
                          {variant.variant_name}
                        </div>
                        {variant.is_default ? (
                          <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                            Mặc định
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 truncate text-slate-500">
                        {variant.market_name ?? variant.sku_code ?? "Phiên bản"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {variant.color_hex ? (
                        <span
                          className="h-4 w-4 rounded-full border border-slate-300"
                          style={{ backgroundColor: variant.color_hex }}
                        />
                      ) : null}
                      <span className="text-slate-700">
                        {variant.color_name ?? "Chưa có"}
                      </span>
                    </div>
                    <div className="font-medium text-slate-950">
                      {formatPrice(variant.launch_price, variant.currency)}
                    </div>
                    <div className="text-slate-500">
                      {formatDate(variant.launch_date)}
                    </div>
                    <Link
                      href={href}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 font-medium text-slate-700 transition hover:border-blue-300"
                    >
                      So sánh
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-sm text-slate-500">
                Thiết bị này chưa có phiên bản để hiển thị.
              </div>
            )}
          </div>
        </Surface>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span className="text-blue-600">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-2 break-words text-sm font-semibold leading-5 text-slate-950">
        {value}
      </div>
    </div>
  );
}

function SpecRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex min-h-24 gap-3 rounded-md border border-slate-200 p-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-700">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-950">{label}</div>
        <div className="mt-1 text-sm leading-6 text-slate-600">
          {value || "Chưa có"}
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value || "Chưa có"}
      </div>
    </div>
  );
}

function SectionLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 outline-none transition hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {children}
    </a>
  );
}
