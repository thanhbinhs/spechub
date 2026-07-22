import Link from "next/link";
import { ChevronRight, Cpu } from "lucide-react";
import type { DeviceModelSummary } from "@spechub/api-client";
import { DeviceArtwork } from "@/components/device-artwork";
import { formatDate, formatPrice, primaryVariant } from "@/lib/format";

export function DeviceCard({ model }: { model: DeviceModelSummary }) {
  const variant = primaryVariant(model);
  const brand =
    model.product_family?.brand_org?.short_name ??
    model.product_family?.brand_org?.name ??
    "SpecHub";
  const category = model.product_family?.device_category?.name ?? "Thiết bị";

  return (
    <Link
      href={`/devices/${model.slug}`}
      className="group grid min-h-[210px] overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-blue-300 sm:grid-cols-[150px_minmax(0,1fr)]"
    >
      <DeviceArtwork
        compact
        brand={brand}
        name={model.name}
        category={category}
        accent={variant?.color_hex}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div>
          <div className="mb-2 text-xs font-semibold text-blue-700">
            {brand} ·{" "}
            <span className="font-normal text-slate-500">{category}</span>
          </div>
          <h3 className="line-clamp-2 text-base font-semibold text-slate-950">
            {model.name}
          </h3>
          {model.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
              {model.description}
            </p>
          ) : null}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 text-xs text-slate-500">
          <div>
            <span className="block">Ra mắt</span>
            <strong className="mt-0.5 block font-medium text-slate-900">
              {formatDate(model.release_date)}
            </strong>
          </div>
          <div>
            <span className="block">Giá ra mắt</span>
            <strong className="mt-0.5 block truncate font-medium text-slate-900">
              {formatPrice(variant?.launch_price, variant?.currency)}
            </strong>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-medium text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <Cpu size={13} />
            {model._count?.device_variants ??
              model.device_variants?.length ??
              0}{" "}
            phiên bản
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
