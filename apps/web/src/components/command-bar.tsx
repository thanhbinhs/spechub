"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock3,
  GitCompareArrows,
  MessageCircle,
  Search,
  SendHorizontal,
  Smartphone,
  Trash2,
} from "lucide-react";
import { clsx } from "clsx";
import { useResearchWorkspace } from "@/components/research-workspace";

type CommandMode = "search" | "ai";

type CommandBarProps = {
  defaultValue?: string;
  initialMode?: CommandMode;
  compact?: boolean;
  className?: string;
};

const modes = [
  {
    value: "search" as const,
    label: "Tìm máy",
    icon: Search,
    placeholder: "Tìm điện thoại, laptop...",
  },
  {
    value: "ai" as const,
    label: "Hỏi AI",
    icon: MessageCircle,
    placeholder: "Bạn đang cần thiết bị như thế nào?",
  },
];

const quickDestinations = [
  {
    href: "/devices",
    label: "Xem tất cả thiết bị",
    icon: Smartphone,
  },
  {
    href: "/compare",
    label: "So sánh nhanh",
    icon: GitCompareArrows,
  },
  {
    href: "/ai",
    label: "Nhờ AI tư vấn",
    icon: MessageCircle,
  },
];

export function CommandBar({
  defaultValue = "",
  initialMode = "search",
  compact,
  className,
}: CommandBarProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<CommandMode>(initialMode);
  const [query, setQuery] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const { recentSearches, recordSearch, clearRecentSearches } =
    useResearchWorkspace();
  const activeMode = modes.find((item) => item.value === mode) ?? modes[0];
  const ActiveIcon = activeMode.icon;

  useEffect(() => {
    if (!compact || !isOpen) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!formRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [compact, isOpen]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    const path = mode === "ai" ? "/ai" : "/search";
    if (trimmed) recordSearch(trimmed);
    setIsOpen(false);
    router.push(trimmed ? `${path}?q=${encodeURIComponent(trimmed)}` : path);
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      className={clsx(
        "relative rounded-xl border border-slate-200/90 bg-surface shadow-sm",
        compact ? "p-1.5" : "p-2",
        className,
      )}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        {!compact ? (
          <div
            className="inline-flex rounded-lg bg-slate-100 p-1"
            aria-label="Chọn cách tìm"
          >
            {modes.map((item) => {
              const Icon = item.icon;
              const active = item.value === mode;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setMode(item.value)}
                  className={clsx(
                    "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition",
                    active
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-900",
                  )}
                  title={item.label}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="relative min-w-0 flex-1">
          <ActiveIcon
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={17}
          />
          <input
            id={compact ? "global-command-input" : undefined}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => compact && setIsOpen(true)}
            placeholder={activeMode.placeholder}
            aria-label={activeMode.placeholder}
            className={clsx(
              "w-full rounded-lg border border-transparent bg-slate-50 pl-10 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100",
              compact ? "pr-10" : "pr-3",
              compact ? "h-9" : "h-11",
            )}
          />
          {compact ? (
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:inline">
              /
            </kbd>
          ) : null}
        </div>

        <button
          type="submit"
          className={clsx(
            "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none disabled:opacity-50",
            compact ? "h-9" : "h-11",
          )}
        >
          {mode === "ai" ? <SendHorizontal size={16} /> : <Search size={16} />}
          <span>{mode === "ai" ? "Gửi" : "Tìm"}</span>
        </button>
      </div>

      {compact && isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
          {recentSearches.length ? (
            <section className="border-b border-slate-100 p-2.5">
              <div className="mb-1.5 flex items-center justify-between gap-3 px-1.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  <Clock3 size={12} /> Tìm gần đây
                </span>
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 transition hover:text-rose-700"
                >
                  <Trash2 size={11} /> Xóa
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((item) => (
                  <Link
                    key={item}
                    href={`/search?q=${encodeURIComponent(item)}`}
                    onClick={() => {
                      recordSearch(item);
                      setIsOpen(false);
                    }}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="p-2.5">
            <div className="grid gap-1 sm:grid-cols-3">
              {quickDestinations.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="group flex items-center gap-2.5 rounded-lg p-2.5 transition hover:bg-blue-50"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-white group-hover:text-blue-700">
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </form>
  );
}
