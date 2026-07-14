"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  CreditCard,
  History,
  RotateCcw,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export default function BillingPage() {
  const { tokens, user } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = tokens?.access_token;
  const [checkoutState, setCheckoutState] = useState<string | null>(null);

  useEffect(() => {
    setCheckoutState(
      new URLSearchParams(window.location.search).get("checkout"),
    );
  }, []);
  const plans = useQuery({
    queryKey: ["subscriptions", "plans"],
    queryFn: () => api.listSubscriptionPlans().then((result) => result.data),
  });
  const current = useQuery({
    queryKey: ["subscriptions", "me"],
    queryFn: () =>
      api.getMySubscription(accessToken!).then((result) => result.data),
    enabled: Boolean(accessToken),
  });
  const checkout = useMutation({
    mutationFn: (planCode: string) =>
      api.createCheckout(
        { plan_code: planCode, billing_cycle: "monthly" },
        accessToken!,
      ),
    onSuccess: (result) => {
      const checkoutUrl = result.data.checkout_url;
      if (typeof checkoutUrl === "string") {
        window.location.assign(checkoutUrl);
      }
    },
  });
  const cancel = useMutation({
    mutationFn: () => api.cancelMySubscription(accessToken!),
    onSuccess: () => void invalidateBilling(queryClient),
  });
  const resume = useMutation({
    mutationFn: () => api.resumeMySubscription(accessToken!),
    onSuccess: () => void invalidateBilling(queryClient),
  });
  const retry = useMutation({
    mutationFn: () => api.retryMySubscriptionPayment(accessToken!),
    onSuccess: () => void invalidateBilling(queryClient),
  });
  const audit = useQuery({
    queryKey: ["subscriptions", "audit"],
    queryFn: () =>
      api
        .listMyBillingAudit({ limit: 8 }, accessToken!)
        .then((result) => result.data),
    enabled: Boolean(accessToken),
  });
  const currentSubscription = current.data?.subscription;
  const checkoutMessage = checkout.data?.data.message;
  const mutationError = [
    cancel.error,
    resume.error,
    retry.error,
    checkout.error,
  ].find(Boolean)?.message;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Thanh toán"
        title="Gói dịch vụ và giới hạn tính năng"
        description="Quản lý gói, trạng thái thanh toán và hoạt động thanh toán gần đây."
      />

      {checkoutState === "success" ? (
        <StatusNotice
          icon={<Check size={17} />}
          tone="success"
          message="Đã hoàn tất thanh toán. Gói của bạn sẽ được cập nhật sau khi hệ thống xử lý thông báo xác thực từ nhà cung cấp."
        />
      ) : null}
      {checkoutState === "cancelled" ? (
        <StatusNotice
          icon={<X size={17} />}
          tone="neutral"
          message="Đã hủy thanh toán. Gói hiện tại của bạn không thay đổi."
        />
      ) : null}
      {checkoutMessage ? (
        <StatusNotice
          icon={<AlertTriangle size={17} />}
          tone="warning"
          message={String(checkoutMessage)}
        />
      ) : null}
      {mutationError ? (
        <StatusNotice
          icon={<AlertTriangle size={17} />}
          tone="warning"
          message={mutationError}
        />
      ) : null}

      {user && current.data ? (
        <section className="rounded-lg border border-blue-100 bg-blue-50/60 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <CreditCard size={17} />
              Gói hiện tại: {current.data.plan.name}
            </div>
            {currentSubscription ? (
              <span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold capitalize text-blue-800">
                {subscriptionStatusLabel(currentSubscription.status)}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Cảnh báo giá:{" "}
            {current.data.features.price_alerts ? "đã bật" : "không bao gồm"} ·
            Giới hạn danh sách yêu thích:{" "}
            {String(current.data.features.wishlist_limit ?? "không áp dụng")}
          </p>
          {currentSubscription?.last_payment_error ? (
            <p className="mt-2 text-sm text-amber-800">
              Lỗi thanh toán: {currentSubscription.last_payment_error}
            </p>
          ) : null}
          {currentSubscription ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {currentSubscription.status === "past_due" ||
              currentSubscription.status === "incomplete" ? (
                <button
                  type="button"
                  onClick={() => retry.mutate()}
                  disabled={retry.isPending}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-amber-600 px-3 text-sm font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw size={15} />
                  Thử lại thanh toán
                </button>
              ) : null}
              {currentSubscription.cancel_at_period_end ? (
                <button
                  type="button"
                  onClick={() => resume.mutate()}
                  disabled={resume.isPending}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-blue-200 bg-white px-3 text-sm font-medium text-blue-800 transition hover:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Tiếp tục gói
                </button>
              ) : currentSubscription.status !== "canceled" ? (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Hủy gói đăng ký này khi hết chu kỳ thanh toán?",
                      )
                    ) {
                      cancel.mutate();
                    }
                  }}
                  disabled={cancel.isPending}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Hủy gói
                </button>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-5 md:grid-cols-3">
        {plans.data?.map((plan) => {
          const isCurrentPlan = current.data?.plan.code === plan.code;
          const isActiveCurrentPlan =
            isCurrentPlan && currentSubscription?.status === "active";

          return (
            <div
              key={plan.id}
              className="flex min-h-72 flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {plan.name}
                </h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                  {plan.description}
                </p>
                <div className="mt-4 text-3xl font-semibold text-slate-950">
                  {formatPrice(plan.price_monthly, {
                    code: plan.currency_code,
                    decimal_digits: 2,
                  })}
                  <span className="text-sm font-medium text-slate-500">
                    /tháng
                  </span>
                </div>
              </div>
              <div className="mt-5 space-y-2 text-sm text-slate-600">
                {Object.entries(plan.features)
                  .slice(0, 5)
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Check size={15} className="text-blue-600" />
                      <span>
                        {featureLabel(key)}: {formatFeatureValue(value)}
                      </span>
                    </div>
                  ))}
              </div>
              <button
                type="button"
                disabled={
                  !accessToken || checkout.isPending || isActiveCurrentPlan
                }
                onClick={() => checkout.mutate(plan.code)}
                className="mt-auto inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCurrentPlan ? "Đang dùng" : "Chọn gói"}
              </button>
            </div>
          );
        })}
      </section>

      {user ? (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-950">
            <History size={17} />
            Hoạt động thanh toán gần đây
          </div>
          <div className="divide-y divide-slate-100">
            {audit.data?.length ? (
              audit.data.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {billingActionLabel(entry.action)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {new Date(entry.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                    {subscriptionStatusLabel(entry.status)}
                  </span>
                </div>
              ))
            ) : (
              <p className="px-5 py-6 text-sm text-slate-500">
                Chưa có hoạt động thanh toán.
              </p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StatusNotice({
  icon,
  message,
  tone,
}: {
  icon: ReactNode;
  message: string;
  tone: "success" | "warning" | "neutral";
}) {
  const toneClasses = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    neutral: "border-slate-200 bg-white text-slate-700",
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${toneClasses[tone]}`}
    >
      {icon}
      {message}
    </div>
  );
}

async function invalidateBilling(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["subscriptions", "me"] }),
    queryClient.invalidateQueries({ queryKey: ["subscriptions", "audit"] }),
  ]);
}

function subscriptionStatusLabel(status: string) {
  const labels: Record<string, string> = {
    active: "Đang hoạt động",
    canceled: "Đã hủy",
    incomplete: "Chưa hoàn tất",
    past_due: "Quá hạn thanh toán",
    paused: "Tạm dừng",
    pending: "Đang chờ",
    succeeded: "Thành công",
    failed: "Thất bại",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

function featureLabel(key: string) {
  const labels: Record<string, string> = {
    price_alerts: "Cảnh báo giá",
    wishlist_limit: "Giới hạn danh sách yêu thích",
    ai_queries: "Lượt hỏi AI",
    comparison_limit: "Giới hạn so sánh",
  };
  return labels[key] ?? key.replaceAll("_", " ");
}

function formatFeatureValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Có" : "Không";
  return String(value);
}

function billingActionLabel(action: string) {
  const labels: Record<string, string> = {
    checkout_created: "Đã tạo yêu cầu thanh toán",
    subscription_created: "Đã tạo gói đăng ký",
    subscription_cancelled: "Đã hủy gói đăng ký",
    subscription_resumed: "Đã tiếp tục gói đăng ký",
    payment_retry: "Đã thử lại thanh toán",
  };
  return labels[action] ?? action.replaceAll("_", " ");
}
