import Link from "next/link";
import { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BatteryCharging,
  BrainCircuit,
  Calendar,
  ChevronRight,
  Cpu,
  FileText,
  GitCompareArrows,
  Monitor,
  Scale,
  Smartphone,
} from "lucide-react";
import { api } from "@/lib/api";
import { DeviceArtwork } from "@/components/device-artwork";
import { Surface, SurfaceHeader } from "@/components/surface";
import { formatDate, formatPrice, specText } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DeviceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: model } = await api.getDeviceModel(slug);
  const aiBrief = await api
    .askAi({
      question: `Summarize ${model.name} with chipset, display, battery, launch price, and best-fit buyer.`,
      top_k: 3,
    })
    .catch(() => null);
  const variants = model.device_variants ?? [];
  const defaultVariant =
    variants.find((variant) => variant.is_default) ?? variants[0];
  const brand =
    model.product_family?.brand_org?.short_name ??
    model.product_family?.brand_org?.name ??
    "SpecHub";
  const category = model.product_family?.device_category?.name ?? "Device";
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
          Devices
        </Link>
        <ChevronRight size={15} />
        <span>{model.name}</span>
      </div>

      <section className="grid gap-5 lg:grid-cols-[390px_minmax(0,1fr)_360px]">
        <DeviceArtwork
          hero
          brand={brand}
          name={model.name}
          accent={defaultVariant?.color_hex}
        />

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
              {brand}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
              {category}
            </span>
            <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
              {model.release_status?.name ?? "Unknown"}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            {model.name}
          </h1>
          {model.description ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {model.description}
            </p>
          ) : null}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric
              icon={<Calendar size={18} />}
              label="Released"
              value={formatDate(model.release_date)}
            />
            <Metric
              icon={<Cpu size={18} />}
              label="Chipset"
              value={chipset?.name ?? "N/A"}
            />
            <Metric
              icon={<BatteryCharging size={18} />}
              label="Battery"
              value={`${specText(battery?.capacity_mah)} mAh`}
            />
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/ai?q=${encodeURIComponent(`Analyze ${model.name}`)}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <BrainCircuit size={17} />
              Ask AI
            </Link>
            <Link
              href={compareIds ? `/compare?ids=${compareIds}` : "/compare"}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-blue-300"
            >
              <GitCompareArrows size={17} />
              Compare variants
            </Link>
          </div>
        </div>

        <Surface className="overflow-hidden border-blue-100 bg-blue-50/50">
          <SurfaceHeader
            title="Research brief"
            meta={aiBrief ? sourceLabel(aiBrief.meta.source) : "Unavailable"}
            action={
              <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-amber-700">
                <AlertTriangle size={13} />
                Catalog-only
              </span>
            }
          />
          <div className="whitespace-pre-wrap p-5 text-sm leading-7 text-slate-700">
            {aiBrief?.data.answer ??
              "AI brief is unavailable for this record right now."}
          </div>
          {aiBrief?.data.citations?.length ? (
            <div className="border-t border-blue-100 p-5 pt-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
                <FileText size={14} />
                Citations
              </div>
              <div className="space-y-2">
                {aiBrief.data.citations.slice(0, 3).map((citation) => (
                  <div
                    key={`${citation.entity_id}-${citation.excerpt}`}
                    className="rounded-md border border-blue-100 bg-white p-3"
                  >
                    <div className="text-sm font-medium text-slate-950">
                      {citation.title ?? citation.entity_id}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                      {citation.excerpt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Surface>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">
              Research specs
            </h2>
            <span className="text-sm text-slate-500">
              Default variant: {defaultVariant?.variant_name ?? "N/A"}
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <SpecRow
              icon={<Cpu size={18} />}
              label="Performance"
              value={[
                chipset?.name,
                chipset?.manufacturer?.short_name ??
                  chipset?.manufacturer?.name,
                chipset?.integrated_5g ? "integrated 5G" : null,
                chipset?.max_ram_gb
                  ? `up to ${chipset.max_ram_gb}GB RAM`
                  : null,
              ]
                .filter(Boolean)
                .join(", ")}
            />
            <SpecRow
              icon={<Monitor size={18} />}
              label="Display"
              value={
                display
                  ? `${display.size_inch ?? "N/A"} in, ${
                      display.resolution_width ?? "?"
                    } x ${display.resolution_height ?? "?"}, ${
                      display.refresh_rate_hz ?? "?"
                    }Hz, ${specText(display.brightness_peak_nits)} nits`
                  : undefined
              }
            />
            <SpecRow
              icon={<BatteryCharging size={18} />}
              label="Battery and charging"
              value={`${specText(battery?.capacity_mah)} mAh, ${specText(
                battery?.wired_charging_w,
              )}W wired, ${specText(battery?.wireless_charging_w)}W wireless`}
            />
            <SpecRow
              icon={<Scale size={18} />}
              label="Body"
              value={`${specText(physical?.height_mm)} x ${specText(
                physical?.width_mm,
              )} x ${specText(physical?.thickness_mm)} mm, ${specText(
                physical?.weight_g,
              )} g`}
            />
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">
            Key facts
          </h2>
          <div className="space-y-3">
            <Fact label="Family" value={model.product_family?.name} />
            <Fact label="Generation" value={model.generation_label} />
            <Fact
              label="Announced"
              value={formatDate(model.announcement_date)}
            />
            <Fact label="Variants" value={String(variants.length)} />
            <Fact
              label="Starting price"
              value={formatPrice(
                defaultVariant?.launch_price,
                defaultVariant?.currency,
              )}
            />
          </div>
        </aside>
      </section>

      <Surface>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Variants</h2>
            <p className="mt-1 text-sm text-slate-500">
              Pricing, color, market name, and compare actions.
            </p>
          </div>
          <Link
            href={`/ai?q=${encodeURIComponent(`Compare variants of ${model.name}`)}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-slate-950"
          >
            <BrainCircuit size={16} />
            Ask about variants
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {variants.map((variant) => {
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
                        Default
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 truncate text-slate-500">
                    {variant.market_name ?? variant.sku_code ?? "Variant"}
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
                    {variant.color_name ?? "N/A"}
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
                  Compare
                  <ArrowRight size={15} />
                </Link>
              </div>
            );
          })}
        </div>
      </Surface>
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
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
        {icon}
        {label}
      </div>
      <div className="text-sm font-semibold text-slate-950">{value}</div>
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
          {value || "N/A"}
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-slate-100 px-3 py-2">
      <span className="inline-flex items-center gap-2 text-sm text-slate-500">
        <Smartphone size={14} />
        {label}
      </span>
      <span className="text-right text-sm font-medium text-slate-950">
        {value || "N/A"}
      </span>
    </div>
  );
}

function sourceLabel(source: string) {
  if (source === "vector") return "Vector RAG";
  if (source === "cache") return "Cached";
  return "Catalog fallback";
}
