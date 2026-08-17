import Link from "next/link";
import { ChevronRight, Cpu } from "lucide-react";
import type { DeviceModelSummary } from "@spechub/api-client";
import { DeviceArtwork } from "@/components/device-artwork";
import { DeviceScorecardSummary } from "@/components/device-scorecard";
import { CompareToggle } from "@/components/research-workspace";
import { formatDate, formatPrice, primaryVariant } from "@/lib/format";
import { localizeDescription, localizeDeviceCategory } from "@/lib/localize";
import { toResearchDevice } from "@/lib/research-device";

export function DeviceCard({ model }: { model: DeviceModelSummary }) {
  const variant = primaryVariant(model);
  const brand =
    model.product_family?.brand_org?.short_name ??
    model.product_family?.brand_org?.name ??
    "SpecHub";
  const category = localizeDeviceCategory(
    model.product_family?.device_category,
  );
  const researchDevice = toResearchDevice(model, variant);

  return (
    <article className="interactive-lift group flex min-h-[350px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <Link href={`/devices/${model.slug}`} className="flex flex-1 flex-col">
        <DeviceArtwork
          compact
          brand={brand}
          name={model.name}
          category={category}
          imageUrl={model.cover_image_url}
          accent={variant?.color_hex}
          className="!h-36 rounded-none border-0 border-b border-slate-200/80"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 pb-3">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
                {category}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                {brand}
              </span>
            </div>
            <h3 className="line-clamp-2 text-lg font-semibold tracking-tight text-slate-950 transition group-hover:text-blue-700">
              {model.name}
            </h3>
            {model.summary || model.description ? (
              <p className="mt-1.5 line-clamp-1 text-sm leading-5 text-slate-600">
                {localizeDescription(model.summary ?? model.description ?? "")}
              </p>
            ) : null}
          </div>

          <DeviceScorecardSummary scorecards={variant?.variant_scorecards} />

          <div className="mt-auto grid grid-cols-2 gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
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
        </div>
      </Link>

      <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 text-xs font-medium text-slate-600">
        <Link
          href={`/devices/${model.slug}`}
          className="inline-flex min-w-0 items-center gap-1.5 transition hover:text-blue-700"
        >
          <Cpu size={13} />
          <span className="truncate">
            {model._count?.device_variants ??
              model.device_variants?.length ??
              0}{" "}
            phiên bản
          </span>
          <ChevronRight size={16} className="text-blue-600" />
        </Link>
        {variant ? <CompareToggle device={researchDevice} compact /> : null}
      </div>
    </article>
  );
}
