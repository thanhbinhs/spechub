import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";
import type { DeviceModelSummary } from "@spechub/api-client";
import { DeviceArtwork } from "@/components/device-artwork";
import { formatDate, formatPrice, primaryVariant } from "@/lib/format";

export function DeviceCard({ model }: { model: DeviceModelSummary }) {
  const variant = primaryVariant(model);
  const brand =
    model.product_family?.brand_org?.short_name ??
    model.product_family?.brand_org?.name ??
    "SpecHub";
  const category = model.product_family?.device_category?.name ?? "Device";

  return (
    <Link
      href={`/devices/${model.slug}`}
      className="interactive-lift group flex min-h-[390px] flex-col overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-sm"
    >
      <DeviceArtwork brand={brand} name={model.name} accent={variant?.color_hex} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
              {brand}
            </span>
            <span className="text-xs text-slate-500">{category}</span>
          </div>
          <h3 className="line-clamp-2 text-lg font-semibold text-slate-950">
            {model.name}
          </h3>
          {model.description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
              {model.description}
            </p>
          ) : null}
        </div>

        <div className="mt-auto grid gap-2 text-sm text-slate-600">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2">
              <Calendar size={15} />
              Release
            </span>
            <span className="font-medium text-slate-900">
              {formatDate(model.release_date)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>From</span>
            <span className="font-medium text-slate-900">
              {formatPrice(variant?.launch_price, variant?.currency)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm font-medium text-slate-700">
          <span>
            {model._count?.device_variants ??
              model.device_variants?.length ??
              0}{" "}
            variants
          </span>
          <ChevronRight
            size={18}
            className="text-blue-600 transition group-hover:translate-x-0.5"
          />
        </div>
      </div>
    </Link>
  );
}
