import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BatteryCharging,
  BrainCircuit,
  Check,
  Cpu,
  DollarSign,
  GitCompareArrows,
  MonitorSmartphone,
  Search,
  ShieldCheck,
  Smartphone,
  Weight,
  X,
} from "lucide-react";
import type { DeviceVariantDetail } from "@spechub/api-client";
import { DeviceArtwork } from "@/components/device-artwork";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { api } from "@/lib/api";
import { formatPrice, specText } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = stringParam(params.q);
  const selectedIds = idParams(params.ids);

  const [variants, compared] = await Promise.all([
    api.listDeviceVariants({
      pageSize: 50,
      q: q || undefined,
      default_only: q ? undefined : true,
    }),
    selectedIds.length >= 2
      ? api.compareDeviceVariants(selectedIds).then((result) => result.data)
      : Promise.resolve([]),
  ]);

  const verdict =
    compared.length >= 2
      ? await api
          .askAi({
            question: `Compare ${compared
              .map((variant) => variantTitle(variant))
              .join(
                " vs ",
              )}. Focus on chipset, display, battery, price, durability, and buying tradeoffs.`,
            top_k: 5,
          })
          .catch(() => null)
      : null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Compare"
        title="Build a side-by-side research board."
        description="Search variants, select two to four records, then inspect the specs and AI tradeoff summary in the same workspace."
        action={
          <Link
            href="/devices"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            Browse devices
            <ArrowRight size={16} />
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:self-start">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Variant picker
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {selectedIds.length}/4 selected
              </p>
            </div>
            <GitCompareArrows size={18} className="text-blue-600" />
          </div>

          <form action="/compare" className="mb-4 flex gap-2">
            {selectedIds.length ? (
              <input name="ids" type="hidden" value={selectedIds.join(",")} />
            ) : null}
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search variants..."
                className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-500"
              />
            </div>
            <button className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-3 text-sm font-medium text-white transition hover:bg-blue-700">
              Go
            </button>
          </form>

          {selectedIds.length ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedIds.map((id) => {
                const selected =
                  compared.find((variant) => variant.id === id) ??
                  variants.data.find((variant) => variant.id === id);
                return (
                  <Link
                    key={id}
                    href={toggleHref(id, selectedIds, q)}
                    className="inline-flex max-w-full items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-slate-700"
                  >
                    <span className="truncate">
                      {selected?.variant_name ?? "Selected"}
                    </span>
                    <X size={13} />
                  </Link>
                );
              })}
              <Link
                href={q ? `/compare?q=${encodeURIComponent(q)}` : "/compare"}
                className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-950"
              >
                Clear
              </Link>
            </div>
          ) : null}

          <div className="max-h-[620px] space-y-2 overflow-y-auto pr-1">
            {variants.data.map((variant) => {
              const selected = selectedIds.includes(variant.id);
              const disabled = !selected && selectedIds.length >= 4;
              return (
                <Link
                  key={variant.id}
                  href={
                    disabled
                      ? currentHref(selectedIds, q)
                      : toggleHref(variant.id, selectedIds, q)
                  }
                  className={`flex w-full items-center gap-3 rounded-md border p-3 text-left transition ${
                    selected
                      ? "border-blue-500 bg-blue-50"
                      : disabled
                        ? "pointer-events-none border-slate-100 bg-slate-50 text-slate-300"
                        : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${
                      selected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300"
                    }`}
                  >
                    {selected ? <Check size={14} /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-950">
                      {variant.device_model?.name}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {variant.variant_name}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          {selectedIds.length < 2 ? (
            <EmptyState
              icon={<GitCompareArrows size={20} />}
              title="Select at least two variants"
              description="Use the picker to build a comparison board. The MVP supports up to four variants at once."
            />
          ) : (
            <>
              <CompareDigest variants={compared} />
              {verdict ? (
                <div className="rounded-lg border border-[#e4d4aa] bg-[#fffaf0] p-5 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                      <BrainCircuit size={17} />
                      AI tradeoff summary
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-amber-700">
                      <AlertTriangle size={13} />
                      Catalog RAG
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {verdict.data.answer}
                  </div>
                </div>
              ) : null}
              <CompareTable variants={compared} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function CompareDigest({ variants }: { variants: DeviceVariantDetail[] }) {
  const highlights = buildHighlights(variants);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Comparison digest
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {variants.length} selected variants
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => (
            <span
              key={variant.id}
              className="inline-flex max-w-full items-center gap-2 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
            >
              <span
                className="h-2.5 w-2.5 rounded-full border border-slate-300"
                style={{ backgroundColor: variant.color_hex ?? "#94a3b8" }}
              />
              <span className="truncate">{variantTitle(variant)}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {highlights.map((item) => (
          <DigestCard key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
}

function DigestCard({
  icon,
  label,
  value,
  winner,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  winner: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex items-center justify-between gap-3 text-slate-500">
        <span className="text-xs font-semibold uppercase tracking-normal">
          {label}
        </span>
        {icon}
      </div>
      <div className="truncate text-sm font-semibold text-slate-950">
        {winner}
      </div>
      <div className="mt-1 text-sm text-slate-600">{value}</div>
    </div>
  );
}

function CompareTable({ variants }: { variants: DeviceVariantDetail[] }) {
  const columns = `180px repeat(${variants.length}, minmax(210px, 1fr))`;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="min-w-[760px]">
        <div
          className="grid border-b border-slate-200"
          style={{ gridTemplateColumns: columns }}
        >
          <div className="bg-slate-50 p-4 text-sm font-semibold text-slate-600">
            Device
          </div>
          {variants.map((variant) => {
            const brand =
              variant.device_model?.product_family?.brand_org?.short_name ??
              variant.device_model?.product_family?.brand_org?.name;
            return (
              <div key={variant.id} className="border-l border-slate-200 p-4">
                <DeviceArtwork
                  compact
                  brand={brand}
                  name={variant.device_model?.name}
                  accent={variant.color_hex}
                />
                <div className="mt-3 text-sm font-semibold text-slate-950">
                  {variant.device_model?.name}
                </div>
                <div className="text-xs text-slate-500">
                  {variant.variant_name}
                </div>
              </div>
            );
          })}
        </div>
        <CompareRow
          icon={<Smartphone size={15} />}
          label="Price"
          values={variants.map((variant) =>
            formatPrice(variant.launch_price, variant.currency),
          )}
          columns={columns}
        />
        <CompareRow
          icon={<Cpu size={15} />}
          label="Chipset"
          values={variants.map(
            (variant) => variant.variant_chipsets?.[0]?.chipset.name ?? "N/A",
          )}
          columns={columns}
        />
        <CompareRow
          icon={<Cpu size={15} />}
          label="RAM ceiling"
          values={variants.map((variant) => {
            const maxRam = variant.variant_chipsets?.[0]?.chipset.max_ram_gb;
            return maxRam ? `${maxRam} GB` : "N/A";
          })}
          columns={columns}
        />
        <CompareRow
          icon={<MonitorSmartphone size={15} />}
          label="Display"
          values={variants.map((variant) => {
            const display = variant.variant_displays?.[0]?.display_unit;
            return display
              ? `${display.size_inch} in, ${
                  display.refresh_rate_hz ?? "?"
                }Hz, ${display.resolution_width ?? "?"} x ${
                  display.resolution_height ?? "?"
                }`
              : "N/A";
          })}
          columns={columns}
        />
        <CompareRow
          icon={<BatteryCharging size={15} />}
          label="Battery"
          values={variants.map((variant) => {
            const battery = variant.variant_batteries?.[0]?.battery_unit;
            return battery
              ? `${battery.capacity_mah} mAh, ${specText(
                  battery.wired_charging_w,
                  "?",
                )}W wired`
              : "N/A";
          })}
          columns={columns}
        />
        <CompareRow
          icon={<Weight size={15} />}
          label="Weight"
          values={variants.map(
            (variant) =>
              `${specText(variant.variant_physical_specs?.weight_g)} g`,
          )}
          columns={columns}
        />
        <CompareRow
          icon={<ShieldCheck size={15} />}
          label="Ingress"
          values={variants.map((variant) =>
            specText(variant.variant_physical_specs?.ingress_protection),
          )}
          columns={columns}
        />
      </div>
    </div>
  );
}

function CompareRow({
  icon,
  label,
  values,
  columns,
}: {
  icon: React.ReactNode;
  label: string;
  values: string[];
  columns: string;
}) {
  return (
    <div
      className="grid border-b border-slate-100 last:border-b-0"
      style={{ gridTemplateColumns: columns }}
    >
      <div className="flex items-center gap-2 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
        {icon}
        {label}
      </div>
      {values.map((value, index) => (
        <div
          key={`${label}-${index}`}
          className="border-l border-slate-100 p-4 text-sm leading-6 text-slate-900"
        >
          {value}
        </div>
      ))}
    </div>
  );
}

function toggleHref(id: string, selectedIds: string[], q: string) {
  const next = selectedIds.includes(id)
    ? selectedIds.filter((selectedId) => selectedId !== id)
    : [...selectedIds, id].slice(0, 4);
  return currentHref(next, q);
}

function currentHref(selectedIds: string[], q: string) {
  const search = new URLSearchParams();
  if (selectedIds.length) search.set("ids", selectedIds.join(","));
  if (q) search.set("q", q);
  const params = search.toString();
  return params ? `/compare?${params}` : "/compare";
}

function variantTitle(variant?: DeviceVariantDetail) {
  if (!variant) return "N/A";
  return [variant.device_model?.name, variant.variant_name]
    .filter(Boolean)
    .join(" ");
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function idParams(value: string | string[] | undefined) {
  const rawValues = Array.isArray(value) ? value : [value ?? ""];
  return rawValues
    .flatMap((item) => item.split(","))
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function buildHighlights(variants: DeviceVariantDetail[]) {
  const lowestPrice = pickVariant(
    variants,
    (variant) => numberValue(variant.launch_price),
    "min",
  );
  const bestBattery = pickVariant(
    variants,
    (variant) => variant.variant_batteries?.[0]?.battery_unit.capacity_mah,
    "max",
  );
  const lightest = pickVariant(
    variants,
    (variant) => numberValue(variant.variant_physical_specs?.weight_g),
    "min",
  );
  const display = pickVariant(
    variants,
    (variant) => variant.variant_displays?.[0]?.display_unit.refresh_rate_hz,
    "max",
  );
  const ram = pickVariant(
    variants,
    (variant) => variant.variant_chipsets?.[0]?.chipset.max_ram_gb,
    "max",
  );

  return [
    {
      icon: <DollarSign size={16} />,
      label: "Lowest price",
      winner: variantTitle(lowestPrice.variant),
      value: lowestPrice.value
        ? formatPrice(
            lowestPrice.variant?.launch_price,
            lowestPrice.variant?.currency,
          )
        : "N/A",
    },
    {
      icon: <BatteryCharging size={16} />,
      label: "Battery",
      winner: variantTitle(bestBattery.variant),
      value: bestBattery.value ? `${bestBattery.value} mAh` : "N/A",
    },
    {
      icon: <Weight size={16} />,
      label: "Lightest",
      winner: variantTitle(lightest.variant),
      value: lightest.value ? `${lightest.value} g` : "N/A",
    },
    {
      icon: <Cpu size={16} />,
      label: "RAM headroom",
      winner: variantTitle(ram.variant ?? display.variant),
      value: ram.value ? `${ram.value} GB` : `${display.value ?? "N/A"} Hz`,
    },
  ];
}

function pickVariant(
  variants: DeviceVariantDetail[],
  read: (variant: DeviceVariantDetail) => number | null | undefined,
  mode: "min" | "max",
) {
  return variants.reduce<{
    variant?: DeviceVariantDetail;
    value?: number;
  }>((best, variant) => {
    const value = read(variant);
    if (value === undefined || value === null || Number.isNaN(value)) {
      return best;
    }
    if (!best.variant || best.value === undefined) return { variant, value };
    if (mode === "min" ? value < best.value : value > best.value) {
      return { variant, value };
    }
    return best;
  }, {});
}

function numberValue(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
