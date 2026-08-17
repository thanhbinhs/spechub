"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  GitCompareArrows,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import type {
  ResearchWorkspaceSyncResponse,
  WishlistItem,
} from "@spechub/api-client";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { localizeDeviceCategory } from "@/lib/localize";
import type { ResearchDevice } from "@/lib/research-device";

const STORAGE_KEY = "spechub.research-workspace.v1";
const COMPARE_DOCK_MINIMIZED_KEY = "spechub.compare-dock.minimized.v1";
const MAX_COMPARE_ITEMS = 2;
const MAX_RECENT_ITEMS = 8;
const MAX_RECENT_SEARCHES = 6;
const MAX_SAVED_ITEMS = 100;

export type StoredResearchDevice = ResearchDevice & { savedAt: number };
export type SavedResearchDevice = StoredResearchDevice & {
  notes: string;
  noteUpdatedAt: number;
};

type PersistedWorkspace = {
  ownerUserId: string | null;
  savedItems: SavedResearchDevice[];
  compareItems: StoredResearchDevice[];
  recentItems: StoredResearchDevice[];
  recentSearches: string[];
};

type WorkspaceSyncStatus = "local" | "syncing" | "synced" | "error";

type ResearchWorkspaceValue = PersistedWorkspace & {
  isReady: boolean;
  syncStatus: WorkspaceSyncStatus;
  lastSyncedAt: string | null;
  syncNow: () => Promise<void>;
  toggleSaved: (device: ResearchDevice) => void;
  removeSaved: (variantId: string) => void;
  isSaved: (variantId?: string) => boolean;
  updateNote: (variantId: string, notes: string) => void;
  toggleCompare: (device: ResearchDevice) => void;
  removeFromCompare: (variantId: string) => void;
  clearCompare: () => void;
  isInCompare: (variantId?: string) => boolean;
  recordViewed: (device: ResearchDevice) => void;
  recordSearch: (query: string) => void;
  clearRecentSearches: () => void;
};

const emptyWorkspace: PersistedWorkspace = {
  ownerUserId: null,
  savedItems: [],
  compareItems: [],
  recentItems: [],
  recentSearches: [],
};

const ResearchWorkspaceContext = createContext<ResearchWorkspaceValue | null>(
  null,
);

export function ResearchWorkspaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user, tokens, isLoading: isAuthLoading } = useAuth();
  const [workspace, setWorkspace] =
    useState<PersistedWorkspace>(emptyWorkspace);
  const [isReady, setIsReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<WorkspaceSyncStatus>("local");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const announcementTimer = useRef<number | null>(null);
  const workspaceRef = useRef(workspace);
  const activeUserIdRef = useRef<string | null>(user?.id ?? null);
  const syncedUserRef = useRef<string | null>(null);
  const skipNextSyncRef = useRef(false);

  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);

  useEffect(() => {
    activeUserIdRef.current = user?.id ?? null;
  }, [user?.id]);

  const announce = useCallback((message: string) => {
    setAnnouncement(message);
    if (announcementTimer.current) {
      window.clearTimeout(announcementTimer.current);
    }
    announcementTimer.current = window.setTimeout(
      () => setAnnouncement(""),
      2_800,
    );
  }, []);

  useEffect(() => {
    setWorkspace(readWorkspace());
    setIsReady(true);

    function syncWorkspace(event: StorageEvent) {
      if (event.key === STORAGE_KEY) setWorkspace(readWorkspace());
    }

    window.addEventListener("storage", syncWorkspace);
    return () => window.removeEventListener("storage", syncWorkspace);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch {
      // Browsing can continue normally when storage is unavailable or full.
    }
  }, [isReady, workspace]);

  const syncWorkspace = useCallback(
    async (mode: "merge" | "replace") => {
      const accessToken = tokens?.access_token;
      if (!user || !accessToken) {
        setSyncStatus("local");
        return;
      }

      setSyncStatus("syncing");
      try {
        const response = await api.syncResearchWorkspace(
          workspacePayload(workspaceRef.current, mode),
          accessToken,
        );
        if (activeUserIdRef.current !== user.id) return;
        skipNextSyncRef.current = true;
        const synced = workspaceFromResponse(
          response,
          user.id,
          workspaceRef.current.recentItems,
          workspaceRef.current.recentSearches,
        );
        workspaceRef.current = synced;
        setWorkspace(synced);
        syncedUserRef.current = user.id;
        setLastSyncedAt(response.data.synced_at);
        setSyncStatus("synced");
      } catch {
        setSyncStatus("error");
      }
    },
    [tokens?.access_token, user],
  );

  useEffect(() => {
    if (!isReady || isAuthLoading) return;
    if (!user || !tokens?.access_token) {
      syncedUserRef.current = null;
      setSyncStatus("local");
      setLastSyncedAt(null);
      if (workspaceRef.current.ownerUserId) {
        const localWorkspace = {
          ...workspaceRef.current,
          ownerUserId: null,
          savedItems: [],
          compareItems: [],
        };
        workspaceRef.current = localWorkspace;
        setWorkspace(localWorkspace);
      }
      return;
    }
    if (syncedUserRef.current === user.id) return;
    void syncWorkspace("merge");
  }, [isAuthLoading, isReady, syncWorkspace, tokens?.access_token, user]);

  useEffect(() => {
    if (
      !isReady ||
      !user ||
      !tokens?.access_token ||
      syncedUserRef.current !== user.id
    ) {
      return;
    }
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    setSyncStatus("syncing");
    const timer = window.setTimeout(() => {
      void syncWorkspace("replace");
    }, 700);
    return () => window.clearTimeout(timer);
  }, [isReady, syncWorkspace, tokens?.access_token, user, workspace]);

  useEffect(
    () => () => {
      if (announcementTimer.current) {
        window.clearTimeout(announcementTimer.current);
      }
    },
    [],
  );

  const toggleCompare = useCallback(
    (device: ResearchDevice) => {
      if (!device.variantId) {
        announce("Thiết bị này chưa có phiên bản để so sánh.");
        return;
      }

      setWorkspace((current) => {
        const existing = current.compareItems.some(
          (item) => item.variantId === device.variantId,
        );
        if (existing) {
          announce(`Đã bỏ ${device.name} khỏi danh sách so sánh.`);
          return {
            ...current,
            compareItems: current.compareItems.filter(
              (item) => item.variantId !== device.variantId,
            ),
          };
        }

        const stored = { ...device, savedAt: Date.now() };
        if (current.compareItems.length >= MAX_COMPARE_ITEMS) {
          const replaced = current.compareItems[0];
          announce(`Đã thay ${replaced.name} bằng ${device.name}.`);
          return {
            ...current,
            compareItems: [...current.compareItems.slice(1), stored],
          };
        }

        announce(`Đã chọn ${device.name} để so sánh.`);
        return {
          ...current,
          compareItems: [...current.compareItems, stored],
        };
      });
    },
    [announce],
  );

  const toggleSaved = useCallback(
    (device: ResearchDevice) => {
      if (!device.variantId) {
        announce("Thiết bị này chưa có phiên bản để lưu.");
        return;
      }
      setWorkspace((current) => {
        const existing = current.savedItems.some(
          (item) => item.variantId === device.variantId,
        );
        if (existing) {
          announce(`Đã bỏ ${device.name} khỏi bộ sưu tập.`);
          return {
            ...current,
            savedItems: current.savedItems.filter(
              (item) => item.variantId !== device.variantId,
            ),
          };
        }
        announce(`Đã lưu ${device.name} vào bộ sưu tập.`);
        const now = Date.now();
        return {
          ...current,
          savedItems: [
            { ...device, savedAt: now, notes: "", noteUpdatedAt: now },
            ...current.savedItems,
          ].slice(0, MAX_SAVED_ITEMS),
        };
      });
    },
    [announce],
  );

  const removeSaved = useCallback(
    (variantId: string) => {
      setWorkspace((current) => {
        const removed = current.savedItems.find(
          (item) => item.variantId === variantId,
        );
        if (removed) announce(`Đã bỏ ${removed.name} khỏi bộ sưu tập.`);
        return {
          ...current,
          savedItems: current.savedItems.filter(
            (item) => item.variantId !== variantId,
          ),
        };
      });
    },
    [announce],
  );

  const updateNote = useCallback((variantId: string, notes: string) => {
    setWorkspace((current) => ({
      ...current,
      savedItems: current.savedItems.map((item) =>
        item.variantId === variantId
          ? { ...item, notes: notes.slice(0, 2_000), noteUpdatedAt: Date.now() }
          : item,
      ),
    }));
  }, []);

  const removeFromCompare = useCallback(
    (variantId: string) => {
      setWorkspace((current) => {
        const removed = current.compareItems.find(
          (item) => item.variantId === variantId,
        );
        if (removed) announce(`Đã bỏ ${removed.name} khỏi danh sách so sánh.`);
        return {
          ...current,
          compareItems: current.compareItems.filter(
            (item) => item.variantId !== variantId,
          ),
        };
      });
    },
    [announce],
  );

  const clearCompare = useCallback(() => {
    setWorkspace((current) => ({ ...current, compareItems: [] }));
    announce("Đã xóa danh sách so sánh.");
  }, [announce]);

  const recordViewed = useCallback((device: ResearchDevice) => {
    setWorkspace((current) => ({
      ...current,
      recentItems: [
        { ...device, savedAt: Date.now() },
        ...current.recentItems.filter(
          (item) => item.modelId !== device.modelId,
        ),
      ].slice(0, MAX_RECENT_ITEMS),
    }));
  }, []);

  const recordSearch = useCallback((query: string) => {
    const normalized = query.trim().replace(/\s+/g, " ");
    if (!normalized) return;
    setWorkspace((current) => ({
      ...current,
      recentSearches: [
        normalized,
        ...current.recentSearches.filter(
          (item) =>
            item.toLocaleLowerCase("vi") !== normalized.toLocaleLowerCase("vi"),
        ),
      ].slice(0, MAX_RECENT_SEARCHES),
    }));
  }, []);

  const clearRecentSearches = useCallback(() => {
    setWorkspace((current) => ({ ...current, recentSearches: [] }));
  }, []);

  const value = useMemo<ResearchWorkspaceValue>(
    () => ({
      ...workspace,
      isReady,
      syncStatus,
      lastSyncedAt,
      syncNow: () => syncWorkspace(syncedUserRef.current ? "replace" : "merge"),
      toggleSaved,
      removeSaved,
      isSaved: (variantId?: string) =>
        Boolean(
          variantId &&
            workspace.savedItems.some((item) => item.variantId === variantId),
        ),
      updateNote,
      toggleCompare,
      removeFromCompare,
      clearCompare,
      isInCompare: (variantId?: string) =>
        Boolean(
          variantId &&
            workspace.compareItems.some((item) => item.variantId === variantId),
        ),
      recordViewed,
      recordSearch,
      clearRecentSearches,
    }),
    [
      clearCompare,
      clearRecentSearches,
      isReady,
      lastSyncedAt,
      recordSearch,
      recordViewed,
      removeFromCompare,
      removeSaved,
      syncStatus,
      syncWorkspace,
      toggleCompare,
      toggleSaved,
      updateNote,
      workspace,
    ],
  );

  return (
    <ResearchWorkspaceContext.Provider value={value}>
      {children}
      {announcement ? (
        <div
          className="fixed left-1/2 top-20 z-[80] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-xl"
          role="status"
          aria-live="polite"
        >
          <span className="grid size-5 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <Check size={13} strokeWidth={3} />
          </span>
          <span className="truncate">{announcement}</span>
        </div>
      ) : null}
    </ResearchWorkspaceContext.Provider>
  );
}

export function useResearchWorkspace() {
  const context = useContext(ResearchWorkspaceContext);
  if (!context) {
    throw new Error(
      "useResearchWorkspace must be used inside ResearchWorkspaceProvider",
    );
  }
  return context;
}

export function CompareToggle({
  device,
  className,
  compact = false,
}: {
  device: ResearchDevice;
  className?: string;
  compact?: boolean;
}) {
  const { isReady, isInCompare, toggleCompare } = useResearchWorkspace();
  const selected = isInCompare(device.variantId);

  return (
    <button
      type="button"
      onClick={() => toggleCompare(device)}
      disabled={!device.variantId}
      aria-pressed={selected}
      title={selected ? "Bỏ khỏi so sánh" : "Thêm vào so sánh"}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-md border text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
        compact ? "h-9 px-2.5" : "h-11 px-4",
        selected
          ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
          : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800",
        !isReady && "opacity-70",
        className,
      )}
    >
      {selected ? <Check size={15} /> : <GitCompareArrows size={15} />}
      <span>{selected ? "Đã chọn" : "So sánh"}</span>
    </button>
  );
}

export function TrackDeviceView({ device }: { device: ResearchDevice }) {
  const { recordViewed } = useResearchWorkspace();
  const serialized = JSON.stringify(device);

  useEffect(() => {
    recordViewed(JSON.parse(serialized) as ResearchDevice);
  }, [recordViewed, serialized]);

  return null;
}

export function CompareDock() {
  const pathname = usePathname();
  const { compareItems, isReady, removeFromCompare, clearCompare } =
    useResearchWorkspace();
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    try {
      setIsMinimized(
        window.localStorage.getItem(COMPARE_DOCK_MINIMIZED_KEY) === "true",
      );
    } catch {
      // The dock remains usable when storage is unavailable.
    }
  }, []);

  const updateMinimized = useCallback((next: boolean) => {
    setIsMinimized(next);
    try {
      window.localStorage.setItem(COMPARE_DOCK_MINIMIZED_KEY, String(next));
    } catch {
      // The current session can still minimize the dock without persistence.
    }
  }, []);

  if (!isReady || !compareItems.length || pathname === "/compare") return null;

  const ids = compareItems
    .map((item) => item.variantId)
    .filter(Boolean)
    .join(",");
  const ready = compareItems.length === MAX_COMPARE_ITEMS;

  if (isMinimized) {
    return (
      <aside
        aria-label="Danh sách so sánh"
        className={clsx(
          "fixed right-3 z-40 sm:right-5 lg:right-6",
          "bottom-[calc(4.9rem+env(safe-area-inset-bottom))] lg:bottom-6",
        )}
      >
        <button
          type="button"
          onClick={() => updateMinimized(false)}
          aria-expanded="false"
          aria-controls="compare-dock-panel"
          className="inline-flex h-12 items-center gap-2 rounded-full border border-slate-200 bg-white/96 px-3.5 text-sm font-semibold text-slate-800 shadow-[0_14px_36px_rgba(15,23,42,0.18)] backdrop-blur-xl transition hover:border-blue-300 hover:text-blue-700"
        >
          <span className="grid size-7 place-items-center rounded-full bg-blue-50 text-blue-700">
            <GitCompareArrows size={15} />
          </span>
          <span className="hidden sm:inline">Đang so sánh</span>
          <span className="sm:hidden">So sánh</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs tabular-nums text-slate-600">
            {compareItems.length}/{MAX_COMPARE_ITEMS}
          </span>
          <ChevronUp size={15} className="text-slate-400" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      id="compare-dock-panel"
      aria-label="Danh sách so sánh"
      className={clsx(
        "fixed inset-x-3 z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white/96 shadow-[0_20px_55px_rgba(15,23,42,0.2)] backdrop-blur-xl sm:left-auto sm:right-5 sm:w-[28rem] lg:right-6",
        "bottom-[calc(4.9rem+env(safe-area-inset-bottom))] lg:bottom-6",
      )}
    >
      <div className="hidden items-center justify-between gap-3 border-b border-slate-100 px-3.5 py-2.5 sm:flex">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-700">
            <GitCompareArrows size={15} />
          </span>
          Đang so sánh · {compareItems.length}/{MAX_COMPARE_ITEMS}
        </span>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => updateMinimized(true)}
            aria-label="Thu gọn danh sách so sánh"
            aria-expanded="true"
            aria-controls="compare-dock-panel"
            title="Thu gọn"
            className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <ChevronDown size={15} />
          </button>
          <button
            type="button"
            onClick={clearCompare}
            className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-slate-400 transition hover:bg-rose-50 hover:text-rose-700"
          >
            <Trash2 size={12} />
            Xóa hết
          </button>
        </span>
      </div>

      <div className="hidden grid-cols-2 gap-2 p-3 sm:grid">
        {[0, 1].map((index) => {
          const item = compareItems[index];
          return item ? (
            <div
              key={item.variantId}
              className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5"
            >
              <span
                className="grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold text-slate-700"
                style={{ backgroundColor: item.accent || "#e2e8f0" }}
              >
                {item.brand.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-slate-900">
                  {item.name}
                </span>
                <span className="block truncate text-[10px] text-slate-500">
                  {item.variantName || item.category}
                </span>
              </span>
              <button
                type="button"
                onClick={() =>
                  item.variantId && removeFromCompare(item.variantId)
                }
                aria-label={`Bỏ ${item.name} khỏi so sánh`}
                className="grid size-7 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-white hover:text-rose-700"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <Link
              key={`empty-${index}`}
              href="/devices"
              className="flex min-h-14 items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs font-semibold text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <Plus size={14} /> Chọn thêm
            </Link>
          );
        })}
      </div>

      <div className="hidden items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-3.5 py-2.5 sm:flex">
        <span className="text-[11px] text-slate-500">
          {ready ? "Sẵn sàng so sánh" : "Chọn thêm một thiết bị"}
        </span>
        <Link
          href={ready ? `/compare?ids=${ids}` : "/devices"}
          className={clsx(
            "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition",
            ready
              ? "bg-slate-950 text-white hover:bg-slate-800"
              : "border border-slate-200 bg-white text-slate-700 hover:border-blue-300",
          )}
        >
          {ready ? "Mở so sánh" : "Tìm thiết bị"}
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="flex h-14 items-center gap-2 px-2.5 sm:hidden">
        <span className="flex -space-x-2">
          {compareItems.map((item) => (
            <span
              key={item.variantId}
              className="grid size-8 place-items-center rounded-full border-2 border-white text-[10px] font-bold text-slate-700"
              style={{ backgroundColor: item.accent || "#e2e8f0" }}
              title={item.name}
            >
              {item.brand.slice(0, 1).toUpperCase()}
            </span>
          ))}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-slate-900">
            {ready ? "2 thiết bị đã sẵn sàng" : "Đã chọn 1 thiết bị"}
          </span>
          <span className="block truncate text-[10px] text-slate-500">
            {compareItems.map((item) => item.name).join(" · ")}
          </span>
        </span>
        <button
          type="button"
          onClick={() => updateMinimized(true)}
          aria-label="Thu gọn danh sách so sánh"
          aria-expanded="true"
          aria-controls="compare-dock-panel"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
        >
          <ChevronDown size={15} />
        </button>
        <button
          type="button"
          onClick={clearCompare}
          aria-label="Xóa danh sách so sánh"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-rose-700"
        >
          <Trash2 size={14} />
        </button>
        <Link
          href={ready ? `/compare?ids=${ids}` : "/devices"}
          className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white"
        >
          {ready ? "So sánh" : "Chọn thêm"}
          <ArrowRight size={13} />
        </Link>
      </div>
    </aside>
  );
}

export function RecentlyViewedDevices() {
  const { recentItems, isReady } = useResearchWorkspace();
  if (!isReady || !recentItems.length) return null;

  return (
    <section aria-labelledby="recently-viewed-title">
      <div className="flex items-end justify-between gap-4">
        <h2
          id="recently-viewed-title"
          className="text-xl font-semibold text-slate-950 sm:text-2xl"
        >
          Vừa xem
        </h2>
      </div>
      <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2">
        {recentItems.slice(0, 6).map((item) => (
          <article
            key={item.modelId}
            className="min-w-[17rem] snap-start rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:min-w-[19rem]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="grid size-12 shrink-0 place-items-center rounded-xl text-sm font-bold text-slate-700"
                style={{ backgroundColor: item.accent || "#e2e8f0" }}
              >
                {item.brand.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-semibold text-blue-700">
                  {item.brand} · {item.category}
                </span>
                <Link
                  href={`/devices/${item.slug}`}
                  className="mt-0.5 block truncate text-sm font-semibold text-slate-950 transition hover:text-blue-700"
                >
                  {item.name}
                </Link>
                <span className="block truncate text-[11px] text-slate-500">
                  {item.variantName || "Xem lại thông tin thiết bị"}
                </span>
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <Link
                href={`/devices/${item.slug}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-700"
              >
                Xem lại <ArrowRight size={13} />
              </Link>
              {item.variantId ? <CompareToggle device={item} compact /> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function readWorkspace(): PersistedWorkspace {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as Partial<PersistedWorkspace> | null;
    if (!parsed || typeof parsed !== "object") return emptyWorkspace;

    return {
      ownerUserId:
        typeof parsed.ownerUserId === "string" ? parsed.ownerUserId : null,
      savedItems: validSavedDevices(parsed.savedItems).slice(
        0,
        MAX_SAVED_ITEMS,
      ),
      compareItems: validDevices(parsed.compareItems).slice(
        0,
        MAX_COMPARE_ITEMS,
      ),
      recentItems: validDevices(parsed.recentItems).slice(0, MAX_RECENT_ITEMS),
      recentSearches: Array.isArray(parsed.recentSearches)
        ? parsed.recentSearches
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, MAX_RECENT_SEARCHES)
        : [],
    };
  } catch {
    return emptyWorkspace;
  }
}

function validDevices(value: unknown): StoredResearchDevice[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is StoredResearchDevice => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Partial<StoredResearchDevice>;
    return (
      typeof candidate.modelId === "string" &&
      typeof candidate.slug === "string" &&
      typeof candidate.name === "string" &&
      typeof candidate.brand === "string" &&
      typeof candidate.category === "string" &&
      typeof candidate.savedAt === "number"
    );
  });
}

function validSavedDevices(value: unknown): SavedResearchDevice[] {
  return validDevices(value)
    .filter((item) => Boolean(item.variantId))
    .map((item) => {
      const candidate = item as Partial<SavedResearchDevice>;
      return {
        ...item,
        notes: typeof candidate.notes === "string" ? candidate.notes : "",
        noteUpdatedAt:
          typeof candidate.noteUpdatedAt === "number"
            ? candidate.noteUpdatedAt
            : item.savedAt,
      };
    });
}

function workspacePayload(
  workspace: PersistedWorkspace,
  mode: "merge" | "replace",
) {
  return {
    mode,
    saved_items: workspace.savedItems.flatMap((item) =>
      item.variantId
        ? [{ device_variant_id: item.variantId, notes: item.notes }]
        : [],
    ),
    compare_variant_ids: workspace.compareItems.flatMap((item) =>
      item.variantId ? [item.variantId] : [],
    ),
  };
}

function workspaceFromResponse(
  response: ResearchWorkspaceSyncResponse,
  ownerUserId: string,
  recentItems: StoredResearchDevice[],
  recentSearches: string[],
): PersistedWorkspace {
  return {
    ownerUserId,
    savedItems: response.data.saved_items
      .map((item) => wishlistItemToDevice(item, true))
      .filter((item): item is SavedResearchDevice => Boolean(item))
      .slice(0, MAX_SAVED_ITEMS),
    compareItems: response.data.compare_items
      .map((item) => wishlistItemToDevice(item, false))
      .filter((item): item is StoredResearchDevice => Boolean(item))
      .slice(0, MAX_COMPARE_ITEMS),
    recentItems,
    recentSearches,
  };
}

function wishlistItemToDevice(
  item: WishlistItem,
  saved: true,
): SavedResearchDevice | null;
function wishlistItemToDevice(
  item: WishlistItem,
  saved: false,
): StoredResearchDevice | null;
function wishlistItemToDevice(item: WishlistItem, saved: boolean) {
  const variant = item.device_variant;
  const model = variant?.device_model;
  if (!variant || !model) return null;
  const brand =
    model.product_family?.brand_org?.short_name ??
    model.product_family?.brand_org?.name ??
    "SpecHub";
  const stored: StoredResearchDevice = {
    modelId: model.id,
    slug: model.slug,
    name: model.name,
    brand,
    category: localizeDeviceCategory(model.product_family?.device_category),
    imageUrl: model.cover_image_url,
    accent: variant.color_hex,
    variantId: variant.id,
    variantName: variant.variant_name,
    savedAt: Date.parse(item.added_at) || Date.now(),
  };
  if (!saved) return stored;
  return {
    ...stored,
    notes: item.notes ?? "",
    noteUpdatedAt: Date.parse(item.added_at) || Date.now(),
  };
}
