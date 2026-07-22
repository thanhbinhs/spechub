"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BadgeCheck,
  CircleDollarSign,
  Clock3,
  PackageCheck,
  Store,
} from "lucide-react";
import type { AffiliateLink, DeviceVariantSummary } from "@spechub/api-client";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { Surface, SurfaceHeader } from "@/components/surface";

export function MarketplaceOffers({
  modelSlug,
  variants,
}: {
  modelSlug: string;
  variants: DeviceVariantSummary[];
}) {
  const [openingId, setOpeningId] = useState<string | null>(null);
  const offers = useQuery({
    queryKey: ["marketplace-offers", modelSlug],
    queryFn: () =>
      api.listAffiliateLinks({
        device_model_slug: modelSlug,
        in_stock_only: true,
      }),
  });
  const variantNames = useMemo(
    () =>
      new Map(variants.map((variant) => [variant.id, variant.variant_name])),
    [variants],
  );
  const items = offers.data?.data ?? [];
  const bestPrice = items.reduce<number | null>((best, offer) => {
    const price = Number(offer.current_price);
    if (!Number.isFinite(price)) return best;
    return best === null || price < best ? price : best;
  }, null);

  async function openTrackedOffer(offer: AffiliateLink) {
    setOpeningId(offer.id);
    const tab = window.open("about:blank", "_blank", "noopener,noreferrer");
    try {
      const result = await api.trackAffiliateClick(offer.id);
      if (tab) tab.location.href = result.data.redirect_url;
      else window.location.href = result.data.redirect_url;
    } catch {
      if (tab) tab.location.href = offer.product_url;
      else window.location.href = offer.product_url;
    } finally {
      setOpeningId(null);
    }
  }

  if (offers.isError || (!offers.isLoading && !items.length)) return null;

  return (
    <div id="marketplace-prices" className="scroll-mt-28">
      <Surface>
        <SurfaceHeader
          title="Giá tại các sàn"
          meta={
            offers.isLoading
              ? "Đang cập nhật giá"
              : `${items.length} lựa chọn còn hàng · giá có thể thay đổi tại nơi bán`
          }
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <PackageCheck size={13} />
              So sánh giá
            </span>
          }
        />
        {offers.isLoading ? (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-lg bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((offer) => {
              const price = Number(offer.current_price);
              const isBest =
                bestPrice !== null &&
                Number.isFinite(price) &&
                price === bestPrice;
              const checkedAt = new Date(offer.last_checked_at);
              const isFresh =
                Number.isFinite(checkedAt.getTime()) &&
                Date.now() - checkedAt.getTime() < 24 * 60 * 60 * 1_000;
              return (
                <div
                  key={offer.id}
                  className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-950">
                        <Store size={15} className="text-blue-700" />
                        {offer.partner?.name ?? "Nhà bán lẻ"}
                      </span>
                      {isBest ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <BadgeCheck size={12} />
                          Giá tốt nhất
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {variantNames.get(offer.device_variant_id) ??
                        offer.device_variant?.variant_name ??
                        "Phiên bản sản phẩm"}
                      {` · ${offer.region_code}`}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <div className="text-base font-semibold text-slate-950">
                      {Number.isFinite(price)
                        ? formatPrice(price, {
                            code: offer.currency_code,
                            symbol:
                              offer.currency_code === "VND" ? "₫" : undefined,
                          })
                        : "Xem giá tại sàn"}
                    </div>
                    <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock3 size={11} />
                      {isFresh
                        ? "Cập nhật trong 24 giờ"
                        : "Nên kiểm tra lại tại sàn"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void openTrackedOffer(offer)}
                    disabled={openingId === offer.id}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {openingId === offer.id ? (
                      <CircleDollarSign size={15} className="animate-pulse" />
                    ) : (
                      <ArrowUpRight size={15} />
                    )}
                    Đến nơi bán
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <p className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-[11px] leading-5 text-slate-500">
          Giá được đồng bộ qua API đối tác khi được cấu hình, hoặc từ dữ liệu
          Product/Offer công khai của trang bán. Liên kết mua hàng có thể mang
          mã giới thiệu nhưng không làm thay đổi giá của bạn.
        </p>
      </Surface>
    </div>
  );
}
