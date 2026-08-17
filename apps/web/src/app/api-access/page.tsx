"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Copy,
  KeyRound,
  RefreshCw,
  Trash2,
  UserRound,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LoadingPanel } from "@/components/loading-panel";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";

export default function ApiAccessPage() {
  const { user, tokens, isLoading } = useAuth();
  const accessToken = tokens?.access_token;
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [rateLimit, setRateLimit] = useState("60");
  const [monthlyQuota, setMonthlyQuota] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const keys = useQuery({
    queryKey: ["api-keys"],
    queryFn: () => api.listApiKeys(accessToken!).then((result) => result.data),
    enabled: Boolean(accessToken),
  });
  const createKey = useMutation({
    mutationFn: () =>
      api.createApiKey(
        {
          name: name.trim(),
          rate_limit_per_minute: Number(rateLimit),
          ...(monthlyQuota.trim()
            ? { monthly_quota: Number(monthlyQuota) }
            : {}),
        },
        accessToken!,
      ),
    onSuccess: (result) => {
      setRevealedKey(result.data.key);
      setName("");
      setMonthlyQuota("");
      setMessage(
        "Khóa API đã được tạo. Hãy sao chép ngay; khóa này chỉ hiện một lần.",
      );
      void queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: () =>
      setMessage(
        "Không thể tạo khóa. API B2B yêu cầu gói dịch vụ đã bật quyền truy cập API.",
      ),
  });
  const rotateKey = useMutation({
    mutationFn: (id: string) => api.rotateApiKey(id, accessToken!),
    onSuccess: (result) => {
      setRevealedKey(result.data.key);
      setMessage("Đã xoay key cũ và tạo key mới. Key cũ không còn hiệu lực.");
      void queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: () => setMessage("Không thể thay khóa API."),
  });
  const revokeKey = useMutation({
    mutationFn: (id: string) => api.revokeApiKey(id, accessToken!),
    onSuccess: () => {
      setMessage("Khóa API đã bị thu hồi.");
      void queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: () => setMessage("Không thể thu hồi khóa API."),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rate = Number(rateLimit);
    const quota = monthlyQuota.trim() ? Number(monthlyQuota) : undefined;
    if (!name.trim() || !Number.isInteger(rate) || rate < 1 || rate > 600)
      return;
    if (quota !== undefined && (!Number.isInteger(quota) || quota < 1)) return;
    createKey.mutate();
  }

  async function copyKey() {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      setMessage("Đã sao chép khóa API vào bộ nhớ tạm.");
    } catch {
      setMessage(
        "Không thể sao chép tự động. Hãy sao chép thủ công key ở trên.",
      );
    }
  }

  if (isLoading) return <LoadingPanel label="Đang tải quyền truy cập API" />;
  if (!user) {
    return <AuthRequired title="Đăng nhập để quản lý API B2B" />;
  }

  return (
    <div className="app-page mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader title="API B2B" />

      <section className="app-panel p-5">
        <p className="text-sm leading-6 text-slate-600">
          Đồng bộ catalog SpecHub vào storefront, công cụ tư vấn, kho dữ liệu
          hoặc hệ thống mua sắm nội bộ bằng khóa API có thể thu hồi.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Capability
            title="Đồng bộ tăng dần"
            description="Chỉ nhận bản ghi thay đổi, có cursor ổn định để tiếp tục sau khi tác vụ bị ngắt."
          />
          <Capability
            title="Tải chi tiết theo lô"
            description="Gộp tối đa 50 model hoặc variant vào một lần lấy dữ liệu sau khi đọc change feed."
          />
          <Capability
            title="Quản trị vận hành"
            description="Biết bản ghi bị xoá qua tombstone; phản hồi cũng cho biết phần rate limit và quota còn lại."
          />
        </div>
      </section>

      {revealedKey ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-amber-950">
            Sao chép khóa API ngay
          </h2>
          <p className="mt-1 text-sm leading-6 text-amber-900">
            Vì an toàn, secret này sẽ không thể xem lại sau khi bạn rời trang.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <code className="min-w-0 flex-1 overflow-x-auto rounded-md border border-amber-200 bg-white px-3 py-2 text-sm text-slate-900">
              {revealedKey}
            </code>
            <button
              type="button"
              onClick={() => void copyKey()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-amber-700 px-4 text-sm font-medium text-white transition hover:bg-amber-800"
            >
              <Copy size={16} />
              Sao chép
            </button>
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="app-panel p-5">
          <h2 className="text-base font-semibold text-slate-950">
            Tạo khóa API
          </h2>
          <form onSubmit={submit} className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Tên nhận diện
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                required
                placeholder="Đồng bộ danh mục sản phẩm"
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Giới hạn mỗi phút
              </span>
              <input
                value={rateLimit}
                onChange={(event) => setRateLimit(event.target.value)}
                type="number"
                min="1"
                max="600"
                required
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Quota mỗi tháng (tuỳ chọn)
              </span>
              <input
                value={monthlyQuota}
                onChange={(event) => setMonthlyQuota(event.target.value)}
                type="number"
                min="1"
                placeholder="Để trống theo quota gói dịch vụ"
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
              />
            </label>
            <button
              disabled={createKey.isPending}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              <KeyRound size={16} />
              {createKey.isPending ? "Đang tạo" : "Tạo khóa API"}
            </button>
          </form>
          {message ? (
            <p className="mt-4 text-sm leading-6 text-slate-600">{message}</p>
          ) : null}
        </section>

        <section className="app-panel overflow-hidden">
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-base font-semibold text-slate-950">
              Khóa API hiện có
            </h2>
          </div>
          {keys.isLoading ? <LoadingPanel label="Đang tải khóa API" /> : null}
          {keys.data?.length ? (
            <div className="divide-y divide-slate-100">
              {keys.data.map((key) => (
                <div
                  key={key.id}
                  className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-950">
                        {key.name}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${key.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {key.is_active ? "Đang hoạt động" : "Đã thu hồi"}
                      </span>
                    </div>
                    <code className="mt-1 block text-xs text-slate-500">
                      {key.key_prefix}…
                    </code>
                    <p className="mt-2 text-sm text-slate-500">
                      {key.rate_limit_per_minute} request/phút
                      {key.monthly_quota
                        ? ` · hạn mức ${key.monthly_quota.toLocaleString("vi-VN")}/tháng`
                        : ""}
                      {key.last_used_at
                        ? ` · dùng gần nhất ${formatDate(key.last_used_at)}`
                        : " · chưa sử dụng"}
                    </p>
                  </div>
                  {key.is_active ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Key hiện tại sẽ hết hiệu lực ngay. Tiếp tục xoay key?",
                            )
                          )
                            rotateKey.mutate(key.id);
                        }}
                        disabled={rotateKey.isPending}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:opacity-50"
                      >
                        <RefreshCw size={15} /> Xoay
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Thu hồi key này? Thao tác không thể hoàn tác.",
                            )
                          )
                            revokeKey.mutate(key.id);
                        }}
                        disabled={revokeKey.isPending}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-rose-200 px-3 text-sm font-medium text-rose-700 transition hover:border-rose-400 disabled:opacity-50"
                      >
                        <Trash2 size={15} /> Thu hồi
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : !keys.isLoading ? (
            <div className="p-5">
              <EmptyState
                icon={<KeyRound size={20} />}
                title="Chưa có khóa API"
              />
            </div>
          ) : null}
        </section>
      </div>

      <section className="app-panel p-5">
        <h2 className="text-base font-semibold text-slate-950">
          Quy trình đồng bộ khuyến nghị
        </h2>
        <ol className="mt-3 grid gap-3 text-sm leading-6 text-slate-600 md:grid-cols-3">
          <li>
            <span className="font-semibold text-slate-950">1. Đọc change feed.</span>{" "}
            Lần đầu không gửi cursor để lấy ảnh chụp catalog.
          </li>
          <li>
            <span className="font-semibold text-slate-950">2. Resolve bản ghi upsert.</span>{" "}
            Gửi các reference về endpoint batch để nhận dữ liệu chi tiết.
          </li>
          <li>
            <span className="font-semibold text-slate-950">3. Lưu next_cursor.</span>{" "}
            Xoá cục bộ các tombstone và dùng cursor đã lưu cho lần sau.
          </li>
        </ol>
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-slate-100 shadow-sm">
        <h2 className="text-base font-semibold">Bắt đầu đồng bộ catalog</h2>
        <pre className="mt-3 overflow-x-auto rounded-md bg-slate-900 p-4 text-xs leading-6 text-slate-200">{`# 1. Đọc thay đổi (lần đầu không truyền cursor)
curl -H "X-API-Key: $SPECHUB_API_KEY" \\
  "${process.env.NEXT_PUBLIC_SPECHUB_API_URL ?? "http://localhost:4000/api/v1"}/b2b/catalog/changes?limit=100"

# 2. Resolve các event operation=upsert
curl --request POST \\
  -H "X-API-Key: $SPECHUB_API_KEY" \\
  -H "Content-Type: application/json" \\
  --data '{"records":[{"entity_type":"device_model","id":"<uuid>"}]}' \\
  "${process.env.NEXT_PUBLIC_SPECHUB_API_URL ?? "http://localhost:4000/api/v1"}/b2b/catalog/records"`}</pre>
      </section>
    </div>
  );
}

function Capability({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-surface-soft p-4">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-slate-600">{description}</p>
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
            Đăng nhập <ArrowRight size={16} />
          </Link>
        }
      />
    </div>
  );
}
