"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Check,
  Cloud,
  CloudOff,
  FileText,
  GitCompareArrows,
  Heart,
  LoaderCircle,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { DeviceArtwork } from "@/components/device-artwork";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/auth-provider";
import {
  CompareToggle,
  useResearchWorkspace,
  type SavedResearchDevice,
  type StoredResearchDevice,
} from "@/components/research-workspace";

export default function ResearchCollectionPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const workspace = useResearchWorkspace();

  if (!workspace.isReady || isAuthLoading) {
    return (
      <div className="app-page mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <LoaderCircle size={22} className="animate-spin text-blue-600" />
          <span className="ml-2 text-sm font-medium text-slate-600">
            Đang mở bộ sưu tập…
          </span>
        </div>
      </div>
    );
  }

  const notedItems = workspace.savedItems.filter((item) => item.notes.trim());
  const compareIds = workspace.compareItems
    .map((item) => item.variantId)
    .filter(Boolean)
    .join(",");

  return (
    <div className="app-page mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader
        title="Bộ sưu tập"
        action={
          <SyncBadge
            signedIn={Boolean(user)}
            status={workspace.syncStatus}
            lastSyncedAt={workspace.lastSyncedAt}
            onRetry={() => void workspace.syncNow()}
          />
        }
      />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-sm">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100 ring-1 ring-white/15">
              <Heart size={14} /> Không gian của bạn
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
              Lưu lại để chọn dễ hơn
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Lưu máy bạn thích, so sánh và ghi chú. Đăng nhập để tiếp tục trên
              thiết bị khác.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <WorkspaceStat
              icon={<Heart size={17} />}
              value={workspace.savedItems.length}
              label="Đã lưu"
            />
            <WorkspaceStat
              icon={<GitCompareArrows size={17} />}
              value={workspace.compareItems.length}
              label="So sánh"
            />
            <WorkspaceStat
              icon={<FileText size={17} />}
              value={notedItems.length}
              label="Có ghi chú"
            />
          </div>
        </div>
      </section>

      {!user ? (
        <section className="flex flex-col gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-blue-700 shadow-sm">
              <CloudOff size={18} />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Đang lưu trên thiết bị này
              </h2>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                Đăng nhập để xem bộ sưu tập trên thiết bị khác.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Đăng nhập <ArrowRight size={15} />
          </Link>
        </section>
      ) : null}

      <section aria-labelledby="compare-collection-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="compare-collection-title"
              className="text-xl font-semibold text-slate-950 sm:text-2xl"
            >
              Đang so sánh
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Chọn tối đa hai phiên bản.
            </p>
          </div>
          {workspace.compareItems.length === 2 ? (
            <Link
              href={`/compare?ids=${compareIds}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              So sánh ngay <ArrowRight size={15} />
            </Link>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[0, 1].map((index) => {
            const device = workspace.compareItems[index];
            return device ? (
              <CompareCollectionCard
                key={device.variantId ?? device.modelId}
                device={device}
                onRemove={() =>
                  device.variantId &&
                  workspace.removeFromCompare(device.variantId)
                }
              />
            ) : (
              <Link
                key={`empty-${index}`}
                href="/devices"
                className="group flex min-h-36 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center transition hover:border-blue-400 hover:bg-blue-50"
              >
                <span>
                  <Search
                    size={20}
                    className="mx-auto text-slate-400 transition group-hover:text-blue-600"
                  />
                  <strong className="mt-2 block text-sm text-slate-700 group-hover:text-blue-700">
                    Chọn thiết bị thứ {index + 1}
                  </strong>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="saved-collection-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2
              id="saved-collection-title"
              className="text-xl font-semibold text-slate-950 sm:text-2xl"
            >
              Thiết bị đã lưu
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Ghi chú được lưu tự động.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {workspace.savedItems.length}/100
          </span>
        </div>

        {workspace.savedItems.length ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {workspace.savedItems.map((device) => (
              <SavedDeviceCard
                key={device.variantId ?? device.modelId}
                device={device}
                onRemove={() =>
                  device.variantId && workspace.removeSaved(device.variantId)
                }
                onNoteChange={(notes) =>
                  device.variantId &&
                  workspace.updateNote(device.variantId, notes)
                }
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
            <Heart size={24} className="mx-auto text-slate-400" />
            <h3 className="mt-3 font-semibold text-slate-950">
              Chưa có thiết bị nào trong bộ sưu tập
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Mở một trang thiết bị và chọn “Lưu phiên bản” để bắt đầu.
            </p>
            <Link
              href="/devices"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Khám phá thiết bị <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function SavedDeviceCard({
  device,
  onRemove,
  onNoteChange,
}: {
  device: SavedResearchDevice;
  onRemove: () => void;
  onNoteChange: (notes: string) => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid sm:grid-cols-[180px_minmax(0,1fr)]">
        <DeviceArtwork
          compact
          className="h-44 rounded-none border-0 border-b sm:h-full sm:min-h-52 sm:border-b-0 sm:border-r"
          brand={device.brand}
          name={device.name}
          category={device.category}
          imageUrl={device.imageUrl}
          accent={device.accent}
        />
        <div className="flex min-w-0 flex-col p-4">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-blue-700">
            {device.brand} · {device.category}
          </p>
          <Link
            href={`/devices/${device.slug}`}
            className="mt-1 truncate text-lg font-semibold text-slate-950 transition hover:text-blue-700"
          >
            {device.name}
          </Link>
          <p className="mt-1 truncate text-xs text-slate-500">
            {device.variantName ?? "Phiên bản mặc định"}
          </p>

          <label className="mt-4 block text-xs font-semibold text-slate-700">
            Ghi chú cá nhân
            <textarea
              value={device.notes}
              maxLength={2_000}
              rows={3}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="Ví dụ: kiểm tra thêm thời lượng pin và giá tháng tới…"
              className="mt-2 w-full resize-y rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-normal leading-5 text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
            <span>Tự động lưu</span>
            <span>{device.notes.length}/2.000</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <CompareToggle device={device} compact />
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              <Trash2 size={14} /> Bỏ lưu
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function CompareCollectionCard({
  device,
  onRemove,
}: {
  device: StoredResearchDevice;
  onRemove: () => void;
}) {
  return (
    <article className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <span
        className="grid size-12 shrink-0 place-items-center rounded-xl text-sm font-bold text-slate-700"
        style={{ backgroundColor: device.accent || "#e2e8f0" }}
      >
        {device.brand.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-semibold text-blue-700">
          {device.brand} · {device.category}
        </span>
        <Link
          href={`/devices/${device.slug}`}
          className="mt-0.5 block truncate text-sm font-semibold text-slate-950 hover:text-blue-700"
        >
          {device.name}
        </Link>
        <span className="block truncate text-xs text-slate-500">
          {device.variantName}
        </span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Bỏ ${device.name} khỏi so sánh`}
        className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-700"
      >
        <Trash2 size={15} />
      </button>
    </article>
  );
}

function WorkspaceStat({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-white/10 p-3 text-center ring-1 ring-white/10">
      <span className="mx-auto grid size-8 place-items-center rounded-lg bg-white/10 text-blue-100">
        {icon}
      </span>
      <strong className="mt-2 block text-xl font-bold">{value}</strong>
      <span className="mt-0.5 block text-[11px] text-slate-300">{label}</span>
    </div>
  );
}

function SyncBadge({
  signedIn,
  status,
  lastSyncedAt,
  onRetry,
}: {
  signedIn: boolean;
  status: "local" | "syncing" | "synced" | "error";
  lastSyncedAt: string | null;
  onRetry: () => void;
}) {
  if (!signedIn) {
    return (
      <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600">
        <CloudOff size={15} /> Chỉ lưu cục bộ
      </span>
    );
  }
  if (status === "error") {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-800"
      >
        <RefreshCw size={15} /> Thử đồng bộ lại
      </button>
    );
  }
  if (status === "syncing") {
    return (
      <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700">
        <LoaderCircle size={15} className="animate-spin" /> Đang đồng bộ
      </span>
    );
  }
  return (
    <span
      title={lastSyncedAt ? formatSyncTime(lastSyncedAt) : undefined}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700"
    >
      {status === "synced" ? <Check size={15} /> : <Cloud size={15} />}
      {status === "synced" ? "Đã đồng bộ" : "Sẵn sàng đồng bộ"}
    </span>
  );
}

function formatSyncTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : `Đồng bộ lúc ${new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      }).format(date)}`;
}
