"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BadgeCheck,
  BellRing,
  ChartNoAxesCombined,
  Clock3,
  ImageOff,
  PackageCheck,
  ShieldCheck,
  Store,
  Tag,
  TrendingDown,
} from "lucide-react";
import type {
  AffiliateLink,
  AffiliatePriceVariantInsight,
  DeviceVariantSummary,
} from "@spechub/api-client";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { Surface, SurfaceHeader } from "@/components/surface";

const HISTORY_RANGES = [30, 90, 180] as const;
const CHART_COLORS = ["#2563eb", "#e11d48", "#059669", "#7c3aed", "#d97706"];

export function MarketplaceOffers({
  modelSlug,
  variants,
}: {
  modelSlug: string;
  variants: DeviceVariantSummary[];
}) {
  const [historyDays, setHistoryDays] = useState<number>(90);
  const [selectedVariantId, setSelectedVariantId] = useState(
    variants.find((variant) => variant.is_default)?.id ?? variants[0]?.id ?? "",
  );
  const offers = useQuery({
    queryKey: ["marketplace-offers", modelSlug],
    queryFn: () =>
      api.listAffiliateLinks({
        device_model_slug: modelSlug,
        in_stock_only: true,
      }),
  });
  const insights = useQuery({
    queryKey: ["marketplace-price-insights", modelSlug, historyDays],
    queryFn: () =>
      api.getAffiliatePriceInsights({
        device_model_slug: modelSlug,
        region_code: "VN",
        days: historyDays,
      }),
  });
  const variantNames = useMemo(
    () =>
      new Map(variants.map((variant) => [variant.id, variant.variant_name])),
    [variants],
  );
  const trustedItems = (offers.data?.data ?? []).filter(
    (offer) => offer.partner?.is_trusted,
  );
  const availableVariantIds = useMemo(
    () =>
      Array.from(new Set(trustedItems.map((offer) => offer.device_variant_id))),
    [trustedItems],
  );

  useEffect(() => {
    if (!availableVariantIds.length) return;
    if (!availableVariantIds.includes(selectedVariantId)) {
      setSelectedVariantId(availableVariantIds[0]!);
    }
  }, [availableVariantIds, selectedVariantId]);

  const items = trustedItems.filter(
    (offer) => offer.device_variant_id === selectedVariantId,
  );
  const selectedInsight = insights.data?.data.variants.find(
    (variant) => variant.id === selectedVariantId,
  );
  const bestPrice =
    selectedInsight?.summary.current_best_price ??
    items.reduce<number | null>((best, offer) => {
      const price = Number(offer.current_price);
      if (!Number.isFinite(price)) return best;
      return best === null || price < best ? price : best;
    }, null);
  const selectedVariantName =
    variantNames.get(selectedVariantId) ??
    selectedInsight?.name ??
    "Phiên bản sản phẩm";
  const signal = priceSignal(selectedInsight?.summary.signal);
  const alertHref = bestPrice
    ? `/alerts?${new URLSearchParams({
        variant: selectedVariantId,
        target: String(Math.max(1, Math.round(bestPrice * 0.95))),
        currency: selectedInsight?.summary.currency_code ?? "VND",
        region: items[0]?.region_code ?? "VN",
        device: selectedVariantName,
      }).toString()}`
    : "/alerts";

  function trackOfferClick(offer: AffiliateLink) {
    void api.trackAffiliateClick(offer.id).catch(() => undefined);
  }

  if (offers.isError || (!offers.isLoading && !trustedItems.length))
    return null;

  return (
    <div id="marketplace-prices" className="scroll-mt-28">
      <Surface>
        <SurfaceHeader
          title="Giá & nơi bán"
          meta={
            offers.isLoading
              ? "Đang tải giá mới nhất"
              : "Tự động cập nhật từ các cửa hàng tin cậy"
          }
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <ShieldCheck size={13} />
              Nơi bán đã xác minh
            </span>
          }
        />

        {availableVariantIds.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-4 py-3 sm:px-5">
            {availableVariantIds.map((variantId) => (
              <button
                key={variantId}
                type="button"
                onClick={() => setSelectedVariantId(variantId)}
                className={`h-9 shrink-0 rounded-full px-3 text-xs font-semibold transition ${
                  selectedVariantId === variantId
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {variantNames.get(variantId) ?? "Phiên bản"}
              </button>
            ))}
          </div>
        ) : null}

        {selectedInsight ? (
          <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <PriceMetric
                label="Giá tốt nhất"
                value={formatCommercePrice(
                  selectedInsight.summary.current_best_price,
                  selectedInsight.summary.currency_code,
                )}
                note={
                  selectedInsight.summary.price_spread
                    ? `Tiết kiệm ${formatCommercePrice(
                        selectedInsight.summary.price_spread,
                        selectedInsight.summary.currency_code,
                      )} so với giá cao nhất`
                    : "Giá thấp nhất đang còn hàng"
                }
                tone="blue"
              />
              <PriceMetric
                label={`Thấp nhất ${historyDays} ngày`}
                value={formatCommercePrice(
                  selectedInsight.summary.historical_low,
                  selectedInsight.summary.currency_code,
                )}
                note={`${selectedInsight.summary.sample_count} mốc giá đã ghi nhận`}
              />
              <PriceMetric
                label="Chênh giữa nơi bán"
                value={
                  selectedInsight.summary.price_spread_percent == null
                    ? "Chưa đủ dữ liệu"
                    : `${selectedInsight.summary.price_spread_percent}%`
                }
                note={`${selectedInsight.offers.length} cửa hàng được so sánh`}
              />
              <div
                className={`rounded-xl border p-3.5 ${signal.containerClass}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                      Đánh giá giá
                    </p>
                    <p className="mt-1 text-base font-bold">{signal.label}</p>
                  </div>
                  <span className="grid size-9 place-items-center rounded-full bg-white/80">
                    <TrendingDown size={17} />
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-5 opacity-80">
                  {signal.description}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex w-fit rounded-lg bg-slate-100 p-1">
                {HISTORY_RANGES.map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setHistoryDays(range)}
                    className={`h-8 rounded-md px-3 text-xs font-semibold transition ${
                      historyDays === range
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {range} ngày
                  </button>
                ))}
              </div>
              <Link
                href={alertHref}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                <BellRing size={14} />
                Báo tôi khi giảm thêm 5%
              </Link>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,.75fr)]">
              <PriceHistoryChart insight={selectedInsight} />
              <StoreComparison insight={selectedInsight} />
            </div>
          </div>
        ) : insights.isLoading ? (
          <div className="border-b border-slate-100 p-5">
            <div className="h-72 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : null}

        {offers.isLoading ? (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
            {items.map((offer) => {
              const price = Number(offer.current_price);
              const originalPrice = Number(offer.original_price);
              const discountPercent = Number(offer.discount_percent);
              const offerInsight = selectedInsight?.offers.find(
                (item) => item.link_id === offer.id,
              );
              const isBest =
                bestPrice !== null &&
                Number.isFinite(price) &&
                price === bestPrice;
              const checkedAt = new Date(offer.last_checked_at);
              const isFresh =
                Number.isFinite(checkedAt.getTime()) &&
                Date.now() - checkedAt.getTime() < 4 * 60 * 60 * 1_000;
              const variantName =
                variantNames.get(offer.device_variant_id) ??
                offer.device_variant?.variant_name ??
                "Phiên bản sản phẩm";

              return (
                <article
                  key={offer.id}
                  className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-blue-200 hover:shadow-lg hover:shadow-slate-950/5"
                >
                  <div className="relative grid h-32 place-items-center overflow-hidden bg-gradient-to-br from-slate-50 to-white p-3">
                    {offer.image_url ? (
                      // Dynamic partner image hosts cannot be enumerated at build time.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={offer.image_url}
                        alt={offer.product_title || variantName}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-300">
                        <ImageOff size={22} />
                      </span>
                    )}
                    <span className="absolute left-2.5 top-2.5 inline-flex max-w-[65%] items-center gap-1 rounded-full border border-white/80 bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-800 shadow-sm backdrop-blur">
                      {offer.partner?.logo_url ? (
                        // Partner logos are administrator-managed remote URLs.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={offer.partner.logo_url}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="size-3.5 rounded object-contain"
                        />
                      ) : (
                        <Store size={11} className="text-blue-700" />
                      )}
                      <span className="truncate">
                        {offer.partner?.name ?? "Nhà bán lẻ"}
                      </span>
                      <BadgeCheck
                        aria-label="Đối tác uy tín"
                        size={12}
                        className="shrink-0 text-blue-600"
                      />
                    </span>
                    {isBest ? (
                      <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                        <PackageCheck size={10} />
                        Tốt nhất
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col p-3">
                    <p className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-950">
                      {offer.product_title || variantName}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {variantName} · {offer.region_code}
                    </p>

                    <div className="mt-3">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <strong className="text-lg tracking-tight text-rose-600">
                          {Number.isFinite(price)
                            ? formatCommercePrice(price, offer.currency_code)
                            : "Xem giá tại nơi bán"}
                        </strong>
                        {Number.isFinite(originalPrice) &&
                        originalPrice > price ? (
                          <span className="text-xs text-slate-400 line-through">
                            {formatCommercePrice(
                              originalPrice,
                              offer.currency_code,
                            )}
                          </span>
                        ) : null}
                        {Number.isFinite(discountPercent) &&
                        discountPercent > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                            <Tag size={10} />-{Math.round(discountPercent)}%
                          </span>
                        ) : null}
                      </div>
                      {offerInsight?.change_percent != null &&
                      offerInsight.change_percent < 0 ? (
                        <p className="mt-1 text-[11px] font-semibold text-emerald-700">
                          Giảm {Math.abs(offerInsight.change_percent)}% từ lần
                          đổi giá trước
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px]">
                      <span className="rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                        {offer.availability_label || "Còn hàng"}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 ${
                          isFresh ? "text-slate-500" : "text-amber-700"
                        }`}
                      >
                        <Clock3 size={11} />
                        {isFresh ? "Tự cập nhật gần đây" : "Đang chờ làm mới"}
                      </span>
                    </div>

                    <a
                      href={offer.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackOfferClick(offer)}
                      className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-blue-700"
                    >
                      <ArrowUpRight size={16} />
                      Xem sản phẩm
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        <p className="border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-[11px] leading-5 text-slate-500">
          SpecHub tự đọc lại giá định kỳ và lưu mỗi lần giá thay đổi. Giá, ưu
          đãi và tình trạng hàng cuối cùng vẫn được xác nhận tại nơi bán trước
          khi thanh toán.
        </p>
      </Surface>
    </div>
  );
}

function PriceMetric({
  label,
  value,
  note,
  tone = "slate",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "slate" | "blue";
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 ${
        tone === "blue"
          ? "border-blue-200 bg-blue-600 text-white"
          : "border-slate-200 bg-white text-slate-950"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-[11px] leading-4 opacity-70">{note}</p>
    </div>
  );
}

function PriceHistoryChart({
  insight,
}: {
  insight: AffiliatePriceVariantInsight;
}) {
  const series = insight.offers
    .filter((offer) => offer.history.length)
    .map((offer, index) => ({
      ...offer,
      color: CHART_COLORS[index % CHART_COLORS.length]!,
    }));
  const allPoints = series.flatMap((offer) => offer.history);

  if (allPoints.length < 2) {
    return (
      <div className="grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white p-6 text-center">
        <div>
          <ChartNoAxesCombined className="mx-auto text-slate-300" size={28} />
          <p className="mt-2 text-sm font-semibold text-slate-700">
            Đang tạo lịch sử giá
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Biểu đồ sẽ rõ hơn sau các lần cập nhật tự động tiếp theo.
          </p>
        </div>
      </div>
    );
  }

  const width = 760;
  const height = 260;
  const padding = { top: 22, right: 18, bottom: 34, left: 72 };
  const timestamps = allPoints.map((point) =>
    new Date(point.recorded_at).getTime(),
  );
  const prices = allPoints.map((point) => point.price);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const rawMinPrice = Math.min(...prices);
  const rawMaxPrice = Math.max(...prices);
  const pricePadding = Math.max(
    (rawMaxPrice - rawMinPrice) * 0.12,
    rawMaxPrice * 0.02,
  );
  const minPrice = Math.max(0, rawMinPrice - pricePadding);
  const maxPrice = rawMaxPrice + pricePadding;
  const x = (time: number) =>
    padding.left +
    ((time - minTime) / Math.max(1, maxTime - minTime)) *
      (width - padding.left - padding.right);
  const y = (price: number) =>
    padding.top +
    (1 - (price - minPrice) / Math.max(1, maxPrice - minPrice)) *
      (height - padding.top - padding.bottom);
  const gridPrices = Array.from(
    { length: 4 },
    (_, index) => minPrice + ((maxPrice - minPrice) * index) / 3,
  ).reverse();

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Lịch sử giá</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Mỗi đường là một cửa hàng tin cậy
          </p>
        </div>
        <ChartNoAxesCombined size={18} className="text-blue-600" />
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Biểu đồ lịch sử giá ${insight.name}`}
          className="h-auto min-w-[620px] w-full"
        >
          {gridPrices.map((price) => {
            const position = y(price);
            return (
              <g key={price}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={position}
                  y2={position}
                  stroke="#e2e8f0"
                  strokeDasharray="4 5"
                />
                <text
                  x={padding.left - 9}
                  y={position + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#64748b"
                >
                  {compactPrice(price)}
                </text>
              </g>
            );
          })}
          <text x={padding.left} y={height - 8} fontSize="10" fill="#64748b">
            {shortDate(minTime)}
          </text>
          <text
            x={width - padding.right}
            y={height - 8}
            textAnchor="end"
            fontSize="10"
            fill="#64748b"
          >
            {shortDate(maxTime)}
          </text>
          {series.map((offer) => {
            const points = offer.history
              .map(
                (point) =>
                  `${x(new Date(point.recorded_at).getTime())},${y(point.price)}`,
              )
              .join(" ");
            const last = offer.history.at(-1)!;
            return (
              <g key={offer.link_id}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={offer.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx={x(new Date(last.recorded_at).getTime())}
                  cy={y(last.price)}
                  r="4"
                  fill="white"
                  stroke={offer.color}
                  strokeWidth="3"
                />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
        {series.map((offer) => (
          <span
            key={offer.link_id}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600"
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: offer.color }}
            />
            {offer.partner.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function StoreComparison({
  insight,
}: {
  insight: AffiliatePriceVariantInsight;
}) {
  const bestPrice = insight.summary.current_best_price;
  const offers = [...insight.offers]
    .filter((offer) => offer.current_price !== null)
    .sort((left, right) => left.current_price! - right.current_price!);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
      <h3 className="text-sm font-semibold text-slate-950">So sánh cửa hàng</h3>
      <p className="mt-0.5 text-[11px] text-slate-500">
        Cùng phiên bản, cùng khu vực và tiền tệ
      </p>
      <div className="mt-3 divide-y divide-slate-100">
        {offers.map((offer, index) => {
          const difference =
            bestPrice === null ? null : offer.current_price! - bestPrice;
          return (
            <div key={offer.link_id} className="py-3 first:pt-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-xs font-semibold text-slate-800">
                    {index === 0 ? (
                      <PackageCheck
                        size={13}
                        className="shrink-0 text-emerald-600"
                      />
                    ) : (
                      <Store size={13} className="shrink-0 text-slate-400" />
                    )}
                    <span className="truncate">{offer.partner.name}</span>
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Thấp nhất từng ghi:{" "}
                    {formatCommercePrice(
                      offer.lowest_price,
                      offer.currency_code,
                    )}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-bold text-slate-950">
                    {formatCommercePrice(
                      offer.current_price,
                      offer.currency_code,
                    )}
                  </p>
                  <p
                    className={`mt-1 text-[10px] font-semibold ${
                      difference === 0 ? "text-emerald-700" : "text-slate-500"
                    }`}
                  >
                    {difference === 0
                      ? "Rẻ nhất"
                      : `+${formatCommercePrice(difference, offer.currency_code)}`}
                  </p>
                </div>
              </div>
              {offer.change_percent != null && offer.change_percent !== 0 ? (
                <p
                  className={`mt-1.5 text-[10px] font-medium ${
                    offer.change_percent < 0
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {offer.change_percent < 0 ? "Giảm" : "Tăng"}{" "}
                  {Math.abs(offer.change_percent)}% từ mức giá trước
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function priceSignal(
  signal?: AffiliatePriceVariantInsight["summary"]["signal"],
) {
  switch (signal) {
    case "historical_low":
      return {
        label: "Mua tốt",
        description: "Giá hiện tại đang sát mức thấp nhất đã ghi nhận.",
        containerClass: "border-emerald-200 bg-emerald-50 text-emerald-900",
      };
    case "good_buy":
      return {
        label: "Giá tốt",
        description: "Thấp hơn đáng kể so với mặt bằng lịch sử.",
        containerClass: "border-blue-200 bg-blue-50 text-blue-900",
      };
    case "price_drop":
      return {
        label: "Đang giảm",
        description: "Có cửa hàng vừa giảm từ 5% trở lên.",
        containerClass: "border-cyan-200 bg-cyan-50 text-cyan-900",
      };
    case "stable":
      return {
        label: "Ổn định",
        description: "Giá chưa lệch nhiều so với các lần ghi nhận.",
        containerClass: "border-slate-200 bg-white text-slate-900",
      };
    default:
      return {
        label: "Đang theo dõi",
        description: "Cần thêm vài lần cập nhật để đánh giá chính xác.",
        containerClass: "border-amber-200 bg-amber-50 text-amber-900",
      };
  }
}

function formatCommercePrice(value: number | null, currencyCode: string) {
  if (value === null || !Number.isFinite(value)) return "Chưa có dữ liệu";
  return formatPrice(value, {
    code: currencyCode,
    symbol: currencyCode === "VND" ? "₫" : undefined,
  });
}

function compactPrice(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function shortDate(timestamp: number) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(timestamp));
}
