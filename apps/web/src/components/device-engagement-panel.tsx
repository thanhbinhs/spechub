"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Heart, ShoppingBag } from "lucide-react";
import { clsx } from "clsx";
import type { DeviceVariantDetail } from "@spechub/api-client";
import { useAuth } from "@/components/auth-provider";
import { useResearchWorkspace } from "@/components/research-workspace";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { ResearchDevice } from "@/lib/research-device";

export function DeviceEngagementPanel({
  variants,
  device,
}: {
  variants: DeviceVariantDetail[];
  device: ResearchDevice;
}) {
  const { user, tokens } = useAuth();
  const { isReady, isSaved, toggleSaved, syncStatus } = useResearchWorkspace();
  const queryClient = useQueryClient();
  const defaultVariant = useMemo(
    () => variants.find((variant) => variant.is_default) ?? variants[0],
    [variants],
  );
  const [targetPrice, setTargetPrice] = useState("");
  const accessToken = tokens?.access_token;

  const buyLinks = useQuery({
    queryKey: ["affiliate-links", defaultVariant?.id],
    queryFn: () =>
      api
        .listAffiliateLinks({
          device_variant_id: defaultVariant?.id,
          in_stock_only: true,
        })
        .then((result) => result.data),
    enabled: Boolean(defaultVariant?.id),
  });

  const alertMutation = useMutation({
    mutationFn: (price: number) =>
      api.createPriceAlert(
        {
          device_variant_id: defaultVariant!.id,
          target_price: price,
          currency_code: defaultVariant?.currency?.code ?? "USD",
          region_code: "US",
        },
        accessToken!,
      ),
    onSuccess: () => {
      setTargetPrice("");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  function submitAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const price = Number(targetPrice);
    if (!Number.isFinite(price) || price <= 0) return;
    alertMutation.mutate(price);
  }

  if (!defaultVariant) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-950">
        <ShoppingBag size={17} />
        Mua và theo dõi
      </div>

      <div className="space-y-2">
        {buyLinks.data?.length ? (
          buyLinks.data.slice(0, 3).map((link) => (
            <a
              key={link.id}
              href={link.product_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                void api.trackAffiliateClick(link.id).catch(() => undefined);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-left transition hover:border-blue-300"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-950">
                  {link.partner?.name ?? "Nhà bán lẻ"}
                </span>
                <span className="block text-xs text-slate-500">
                  {link.region_code} ·{" "}
                  {link.in_stock ? "Còn hàng" : "Kiểm tra tồn kho"}
                </span>
              </span>
              <span className="text-sm font-semibold text-slate-950">
                {formatPrice(link.current_price, {
                  code: link.currency_code,
                })}
              </span>
            </a>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-slate-200 p-3 text-sm text-slate-500">
            Chưa có liên kết mua hàng đang hoạt động cho phiên bản này.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-2">
        <button
          disabled={!isReady}
          aria-pressed={isSaved(defaultVariant.id)}
          onClick={() => toggleSaved(device)}
          className={clsx(
            "inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
            isSaved(defaultVariant.id)
              ? "border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300"
              : "border-slate-300 text-slate-700 hover:border-blue-300",
          )}
        >
          <Heart
            size={16}
            fill={isSaved(defaultVariant.id) ? "currentColor" : "none"}
          />
          {isSaved(defaultVariant.id)
            ? "Đã lưu vào bộ sưu tập"
            : "Lưu phiên bản"}
        </button>

        <form onSubmit={submitAlert} className="flex gap-2">
          <input
            value={targetPrice}
            onChange={(event) => setTargetPrice(event.target.value)}
            inputMode="decimal"
            placeholder="Giá mục tiêu"
            className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
          />
          <button
            disabled={!user || !accessToken || alertMutation.isPending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Bell size={16} />
            Cảnh báo
          </button>
        </form>
      </div>

      {!user ? (
        <p className="mt-3 text-xs text-slate-500">
          Thiết bị được lưu trên máy này. Đăng nhập để đồng bộ bộ sưu tập và ghi
          chú.
        </p>
      ) : syncStatus === "syncing" ? (
        <p className="mt-3 text-xs text-blue-600">Đang đồng bộ bộ sưu tập…</p>
      ) : null}
      {alertMutation.error ? (
        <p className="mt-3 text-xs text-red-600">
          Cảnh báo giá yêu cầu gói dịch vụ có quyền sử dụng tính năng này.
        </p>
      ) : null}
    </div>
  );
}
