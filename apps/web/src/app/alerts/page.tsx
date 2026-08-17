"use client";

import Link from "next/link";
import {
  FormEvent,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import { SearchableSelect } from "@/components/searchable-select";
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
  const [currencyCode, setCurrencyCode] = useState("VND");
  const [regionCode, setRegionCode] = useState("VN");
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const [draftCurrencies, setDraftCurrencies] = useState<
    Record<string, string>
  >({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setVariantId(params.get("variant") ?? "");
    setTargetPrice(params.get("target") ?? "");
    setCurrencyCode(params.get("currency")?.toUpperCase() ?? "VND");
    setRegionCode(params.get("region")?.toUpperCase() ?? "VN");
    setVariantSearch(params.get("device") ?? "");
  }, []);

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
  const currencies = useQuery({
    queryKey: ["currencies"],
    queryFn: () => api.listCurrencies(),
    enabled: Boolean(user),
  });
  const selectedVariant = useMemo(
    () => variants.data?.find((variant) => variant.id === variantId),
    [variantId, variants.data],
  );
  const currencyOptions = useMemo(() => {
    const available = currencies.data?.length
      ? currencies.data
      : [
          { code: "VND", symbol: "₫" },
          { code: "USD", symbol: "$" },
          { code: "EUR", symbol: "€" },
          { code: "JPY", symbol: "¥" },
        ];
    return available.map((currency) => ({
      value: currency.code,
      label: currency.code,
      meta: currency.symbol ? `Ký hiệu ${currency.symbol}` : undefined,
    }));
  }, [currencies.data]);
  const createAlert = useMutation({
    mutationFn: () =>
      api.createPriceAlert(
        {
          device_variant_id: variantId,
          target_price: Number(targetPrice),
          currency_code:
            currencyCode || selectedVariant?.currency?.code || "VND",
          region_code: regionCode,
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
      currency_code,
      is_active,
    }: {
      id: string;
      target_price?: number;
      currency_code?: string;
      is_active?: boolean;
    }) =>
      api.updatePriceAlert(
        id,
        {
          ...(target_price !== undefined && { target_price }),
          ...(currency_code !== undefined && { currency_code }),
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
      setDraftCurrencies((current) => {
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
    return <AuthRequired title="Đăng nhập để quản lý cảnh báo giá" />;
  }

  return (
    <div className="app-page mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader title="Cảnh báo giá" />

      <section className="app-panel p-5">
        <h2 className="text-base font-semibold text-slate-950">Tạo cảnh báo</h2>
        <form
          onSubmit={submit}
          className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[210px_minmax(280px,1fr)_120px_180px_auto]"
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
          <SearchableSelect
            label="Phiên bản thiết bị"
            labelClassName="sr-only"
            controlClassName="h-10 rounded-md"
            value={variantId}
            onChange={setVariantId}
            disabled={variants.isLoading}
            placeholder={
              variants.isLoading
                ? "Đang tải phiên bản..."
                : "Chọn phiên bản thiết bị"
            }
            searchPlaceholder="Tìm tên máy, phiên bản hoặc màu..."
            options={(variants.data ?? []).map((variant) => ({
              value: variant.id,
              label: variant.device_model?.name ?? "Thiết bị",
              meta: variant.variant_name,
              keywords: variant.color_name ?? "",
            }))}
            required
          />
          <SearchableSelect
            label="Tiền tệ"
            labelClassName="sr-only"
            controlClassName="h-10 rounded-md"
            value={currencyCode || selectedVariant?.currency?.code || "VND"}
            onChange={setCurrencyCode}
            options={currencyOptions}
            placeholder="Tiền tệ"
            searchPlaceholder="Tìm mã tiền tệ..."
            clearable={false}
            required
          />
          <input
            value={targetPrice}
            onChange={(event) => setTargetPrice(event.target.value)}
            type="number"
            aria-label="Giá mục tiêu"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="Giá mục tiêu"
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

      <section className="app-panel">
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
                className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_180px_120px_120px_auto] lg:items-center"
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
                  <input
                    value={draftPrices[alert.id] ?? String(alert.target_price)}
                    onChange={(event) =>
                      setDraftPrices((current) => ({
                        ...current,
                        [alert.id]: event.target.value,
                      }))
                    }
                    type="number"
                    min="0.01"
                    step="0.01"
                    className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"
                  />
                </label>
                <SearchableSelect
                  label={`Tiền tệ của ${alert.device_variant?.variant_name ?? "cảnh báo"}`}
                  labelClassName="sr-only"
                  controlClassName="h-9 rounded-md"
                  value={draftCurrencies[alert.id] ?? alert.currency_code}
                  onChange={(nextCurrency) =>
                    setDraftCurrencies((current) => ({
                      ...current,
                      [alert.id]: nextCurrency,
                    }))
                  }
                  options={currencyOptions}
                  clearable={false}
                />
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
                      (!draftPrices[alert.id] && !draftCurrencies[alert.id]) ||
                      (Boolean(draftPrices[alert.id]) &&
                        (!Number.isFinite(Number(draftPrices[alert.id])) ||
                          Number(draftPrices[alert.id]) <= 0))
                    }
                    onClick={() =>
                      updateAlert.mutate({
                        id: alert.id,
                        ...(draftPrices[alert.id] && {
                          target_price: Number(draftPrices[alert.id]),
                        }),
                        ...(draftCurrencies[alert.id] && {
                          currency_code: draftCurrencies[alert.id],
                        }),
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
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function AuthRequired({ title }: { title: string }) {
  return (
    <div className="app-page mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <EmptyState
        icon={<UserRound size={20} />}
        title={title}
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
