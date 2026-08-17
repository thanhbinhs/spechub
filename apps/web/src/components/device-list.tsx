import Link from "next/link";
import type { ReactNode } from "react";
import {
  BookOpen,
  Calendar,
  Cpu,
  DollarSign,
  Gamepad2,
  Headphones,
  Laptop,
  Layers3,
  Smartphone,
  Tablet,
  Tv,
  Watch,
} from "lucide-react";
import type { DeviceModelSummary } from "@spechub/api-client";
import { CatalogScoreBadge } from "@/components/catalog-score";
import { DeviceArtwork } from "@/components/device-artwork";
import { CompareToggle } from "@/components/research-workspace";
import { formatDate, formatPrice, primaryVariant } from "@/lib/format";
import {
  localizeDescription,
  localizeDeviceCategory,
  localizeReleaseStatus,
} from "@/lib/localize";
import { toResearchDevice } from "@/lib/research-device";

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
  const category = localizeDeviceCategory(
    model.product_family?.device_category,
  );
  const variantCount =
    model._count?.device_variants ?? model.device_variants?.length ?? 0;
  const researchDevice = toResearchDevice(model, variant);

  return (
    <article className="group p-4 transition hover:bg-blue-50/40 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)_180px] lg:items-center">
        <div className="w-full shrink-0">
          <DeviceArtwork
            compact
            brand={brand}
            name={model.name}
            category={category}
            imageUrl={model.cover_image_url}
            accent={variant?.color_hex}
            className="!h-32"
          />
        </div>
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
              <DeviceCategoryIcon
                category={
                  model.product_family?.device_category?.slug ?? category
                }
              />
              {category}
            </span>
            {model.release_status?.name ? (
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                {localizeReleaseStatus(model.release_status)}
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
              {localizeDescription(model.description)}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <MiniValue icon={<Cpu size={15} />} label="Hãng" value={brand} />
            <MiniValue
              icon={<Calendar size={15} />}
              label="Ra mắt"
              value={formatDate(model.release_date)}
            />
            <MiniValue
              icon={<DollarSign size={15} />}
              label="Từ"
              value={formatPrice(variant?.launch_price, variant?.currency)}
            />
            <MiniValue
              icon={<Layers3 size={15} />}
              label="Phiên bản"
              value={`${variantCount}`}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <CatalogScoreBadge
            benchmarks={variant?.device_variant_benchmarks}
            scores={variant?.variant_module_scores}
            scorecards={variant?.variant_scorecards}
            categorySlug={model.product_family?.device_category?.slug}
          />
          {variant ? <CompareToggle device={researchDevice} compact /> : null}
        </div>
      </div>
    </article>
  );
}

function DeviceCategoryIcon({ category }: { category: string }) {
  const value = category.toLowerCase();

  if (value.includes("laptop")) return <Laptop size={13} />;
  if (value.includes("tablet")) return <Tablet size={13} />;
  if (value.includes("watch")) return <Watch size={13} />;
  if (value.includes("earbud")) return <Headphones size={13} />;
  if (value.includes("television") || value.includes("tv")) {
    return <Tv size={13} />;
  }
  if (value.includes("gaming")) return <Gamepad2 size={13} />;
  if (value.includes("e-reader")) return <BookOpen size={13} />;

  return <Smartphone size={13} />;
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
    <div className="min-w-28">
      <span className="mb-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
        {icon}
        {label}
      </span>
      <span className="block max-w-40 truncate font-medium text-slate-950">
        {value}
      </span>
    </div>
  );
}
