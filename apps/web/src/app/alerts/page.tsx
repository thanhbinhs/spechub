"use client";

import Link from "next/link";
import { FormEvent, useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  PauseCircle,
  PlayCircle,
  Save,
  Search,
  UserRound,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LoadingPanel } from "@/components/loading-panel";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";

export default function AlertsPage() {
  const { user, tokens, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = tokens?.access_token;
  const [variantSearch, setVariantSearch] = useState("");
  const deferredVariantSearch = useDeferredValue(variantSearch.trim());
  const [variantId, setVariantId] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const variants = useQuery({
    queryKey: ["device-variants", "alert-picker", deferredVariantSearch],
    queryFn: () =>
      api
        .listDeviceVariants({
          page: 1,
          pageSize: 100,
          q: deferredVariantSearch || undefined,
        })
        .then((result) => result.data),
    enabled: Boolean(user),
  });
  const alerts = useQuery({
    queryKey: ["alerts"],
    queryFn: () =>
      api.listPriceAlerts(accessToken!).then((result) => result.data),
    enabled: Boolean(accessToken),
  });
  const selectedVariant = useMemo(
    () => variants.data?.find((variant) => variant.id === variantId),
    [variantId, variants.data],
  );
  const createAlert = useMutation({
    mutationFn: () =>
      api.createPriceAlert(
        {
          device_variant_id: variantId,
          target_price: Number(targetPrice),
          currency_code: selectedVariant?.currency?.code ?? "USD",
          region_code: "US",
        },
        accessToken!,
      ),
    onSuccess: () => {
      setVariantId("");
      setTargetPrice("");
      setMessage("Đã tạo cảnh báo giá.");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: () => {
      setMessage(
        "Không thể tạo cảnh báo. Tính năng này yêu cầu gói dịch vụ phù hợp.",
      );
    },
  });
  const updateAlert = useMutation({
    mutationFn: ({
      id,
      target_price,
      is_active,
    }: {
      id: string;
      target_price?: number;
      is_active?: boolean;
    }) =>
      api.updatePriceAlert(
        id,
        {
          ...(target_price !== undefined && { target_price }),
          ...(is_active !== undefined && { is_active }),
        },
        accessToken!,
      ),
    onSuccess: (_result, variables) => {
      setDraftPrices((current) => {
        const next = { ...current };
        delete next[variables.id];
        return next;
      });
      setMessage("Đã cập nhật cảnh báo giá.");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: () => setMessage("Không thể cập nhật cảnh báo giá."),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const price = Number(targetPrice);
    if (!variantId || !Number.isFinite(price) || price <= 0) return;
    createAlert.mutate();
  }

  if (isLoading) return <LoadingPanel label="Đang tải cảnh báo" />;
  if (!user) {
    return (
      <AuthRequired
        title="Đăng nhập để quản lý cảnh báo giá"
        description="Cảnh báo được liên kết với tài khoản và tính năng của gói dịch vụ."
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Cảnh báo"
        title="Cảnh báo giá"
        description="Chọn phiên bản, đặt giá mục tiêu và để worker kiểm tra các liên kết mua hàng theo lịch đã cấu hình."
      />

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Tạo cảnh báo</h2>
        <form
          onSubmit={submit}
          className="mt-4 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_180px_auto]"
        >
          <label className="relative">
            <span className="sr-only">Tìm phiên bản</span>
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={variantSearch}
              onChange={(event) => setVariantSearch(event.target.value)}
              placeholder="Tìm thiết bị..."
              className="h-10 w-full rounded-md border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </label>
          <label>
            <span className="sr-only">Phiên bản thiết bị</span>
            <select
              value={variantId}
              onChange={(event) => setVariantId(event.target.value)}
              disabled={variants.isLoading}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
            >
              <option value="">
                {variants.isLoading
                  ? "Đang tải phiên bản..."
                  : "Chọn phiên bản thiết bị"}
              </option>
              {variants.data?.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.device_model?.name ?? "Thiết bị"} ·{" "}
                  {variant.variant_name}
                </option>
              ))}
            </select>
          </label>
          <input
            value={targetPrice}
            onChange={(event) => setTargetPrice(event.target.value)}
            type="number"
            aria-label="Giá mục tiêu"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder={`Giá mục tiêu (${selectedVariant?.currency?.code ?? "USD"})`}
            className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
          />
          <button
            disabled={
              createAlert.isPending ||
              !variantId ||
              !Number.isFinite(Number(targetPrice)) ||
              Number(targetPrice) <= 0
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Bell size={16} />
            {createAlert.isPending ? "Đang tạo" : "Tạo"}
          </button>
        </form>
        {variants.isError ? (
          <p className="mt-3 text-sm text-red-600">
            Không thể tải danh sách phiên bản thiết bị.
          </p>
        ) : null}
        {message ? (
          <p className="mt-3 text-sm text-slate-600">{message}</p>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-base font-semibold text-slate-950">
            Cảnh báo hiện tại
          </h2>
        </div>
        {alerts.isLoading ? <LoadingPanel label="Đang tải cảnh báo" /> : null}
        {alerts.data?.length ? (
          <div className="divide-y divide-slate-100">
            {alerts.data.map((alert) => (
              <div
                key={alert.id}
                className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_180px_120px_auto] lg:items-center"
              >
                <div>
                  {alert.device_variant?.device_model?.slug ? (
                    <Link
                      href={`/devices/${alert.device_variant.device_model.slug}`}
                      className="font-semibold text-slate-950 hover:text-blue-700"
                    >
                      {alert.device_variant.device_model.name}
                    </Link>
                  ) : (
                    <div className="font-semibold text-slate-950">Thiết bị</div>
                  )}
                  <p className="mt-1 text-sm text-slate-500">
                    {alert.device_variant?.variant_name ??
                      alert.device_variant_id}
                  </p>
                </div>
                <label>
                  <span className="sr-only">Giá mục tiêu</span>
                  <div className="flex h-9 items-center rounded-md border border-slate-200 bg-white focus-within:border-blue-500">
                    <input
                      value={
                        draftPrices[alert.id] ?? String(alert.target_price)
                      }
                      onChange={(event) =>
                        setDraftPrices((current) => ({
                          ...current,
                          [alert.id]: event.target.value,
                        }))
                      }
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="h-full min-w-0 flex-1 rounded-md px-3 text-sm outline-none"
                    />
                    <span className="pr-3 text-xs font-medium text-slate-500">
                      {alert.currency_code}
                    </span>
                  </div>
                </label>
                <div className="text-sm text-slate-600">
                  {alert.is_active
                    ? "Đang theo dõi"
                    : alert.triggered_at
                      ? "Đã đạt mục tiêu"
                      : "Đã tạm dừng"}
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button
                    disabled={
                      updateAlert.isPending ||
                      !draftPrices[alert.id] ||
                      !Number.isFinite(Number(draftPrices[alert.id])) ||
                      Number(draftPrices[alert.id]) <= 0
                    }
                    onClick={() =>
                      updateAlert.mutate({
                        id: alert.id,
                        target_price: Number(draftPrices[alert.id]),
                      })
                    }
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Save size={15} />
                    Lưu giá
                  </button>
                  <button
                    disabled={updateAlert.isPending}
                    onClick={() =>
                      updateAlert.mutate({
                        id: alert.id,
                        is_active: !alert.is_active,
                      })
                    }
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:border-blue-300 disabled:opacity-50"
                  >
                    {alert.is_active ? (
                      <PauseCircle size={15} />
                    ) : (
                      <PlayCircle size={15} />
                    )}
                    {alert.is_active ? "Tạm dừng" : "Bật lại"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : !alerts.isLoading ? (
          <div className="p-5">
            <EmptyState
              icon={<Bell size={20} />}
              title="Chưa có cảnh báo nào"
              description="Tìm và chọn một phiên bản thiết bị ở biểu mẫu phía trên để bắt đầu theo dõi giá."
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function AuthRequired({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <EmptyState
        icon={<UserRound size={20} />}
        title={title}
        description={description}
        action={
          <Link
            href="/login"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Đăng nhập
            <ArrowRight size={16} />
          </Link>
        }
      />
    </div>
  );
}
