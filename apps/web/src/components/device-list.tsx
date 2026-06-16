import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BrainCircuit,
  Calendar,
  Cpu,
  DollarSign,
  GitCompareArrows,
  Layers3,
  Smartphone,
} from "lucide-react";
import type { DeviceModelSummary } from "@spechub/api-client";
import { DeviceArtwork } from "@/components/device-artwork";
import { formatDate, formatPrice, primaryVariant } from "@/lib/format";

export function DeviceList({ models }: { models: DeviceModelSummary[] }) {
  return (
    <div className="overflow-hidden bg-white">
      <div className="divide-y divide-slate-100">
        {models.map((model) => (
          <DeviceRow key={model.id} model={model} />
        ))}
      </div>
    </div>
  );
}

function DeviceRow({ model }: { model: DeviceModelSummary }) {
  const variant = primaryVariant(model);
  const brand =
    model.product_family?.brand_org?.short_name ??
    model.product_family?.brand_org?.name ??
    "SpecHub";
  const category = model.product_family?.device_category?.name ?? "Device";
  const variantCount =
    model._count?.device_variants ?? model.device_variants?.length ?? 0;

  return (
    <div className="group p-4 transition hover:bg-blue-50/40">
      <div className="grid gap-4 lg:grid-cols-[150px_minmax(0,1fr)_180px] lg:items-center">
        <div className="w-full shrink-0">
            <DeviceArtwork
              compact
              brand={brand}
              name={model.name}
              accent={variant?.color_hex}
            />
        </div>
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
              <Smartphone size={13} />
              {category}
            </span>
            {model.release_status?.name ? (
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                {model.release_status.name}
              </span>
            ) : null}
          </div>
          <Link
            href={`/devices/${model.slug}`}
            className="block truncate text-lg font-semibold text-slate-950 transition hover:text-blue-700"
          >
            {model.name}
          </Link>
          {model.description ? (
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
              {model.description}
            </p>
          ) : null}

          <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <MiniValue icon={<Cpu size={15} />} label="Brand" value={brand} />
            <MiniValue
              icon={<Calendar size={15} />}
              label="Release"
              value={formatDate(model.release_date)}
            />
            <MiniValue
              icon={<DollarSign size={15} />}
              label="From"
              value={formatPrice(variant?.launch_price, variant?.currency)}
            />
            <MiniValue
              icon={<Layers3 size={15} />}
              label="Variants"
              value={`${variantCount}`}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <ActionLink
            href={`/devices/${model.slug}`}
            icon={<ArrowRight size={15} />}
            label="Open"
          />
          <ActionLink
            href={`/ai?q=${encodeURIComponent(`Analyze ${model.name}`)}`}
            icon={<BrainCircuit size={15} />}
            label="AI"
          />
          {variant ? (
            <ActionLink
              href={`/compare?ids=${variant.id}`}
              icon={<GitCompareArrows size={15} />}
              label="Compare"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MiniValue({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
      <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase text-slate-500">
        {icon}
        {label}
      </span>
      <span className="block truncate font-medium text-slate-950">
        {value}
      </span>
    </div>
  );
}

function ActionLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-slate-950"
    >
      {icon}
      {label}
    </Link>
  );
}
