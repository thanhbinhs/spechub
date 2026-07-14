"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, Search, SendHorizontal } from "lucide-react";
import { clsx } from "clsx";

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
    label: "Tìm kiếm",
    icon: Search,
    placeholder: "Tìm mẫu máy, chipset, pin...",
  },
  {
    value: "ai" as const,
    label: "Hỏi AI",
    icon: BrainCircuit,
    placeholder: "Đặt câu hỏi về danh mục...",
  },
];

export function CommandBar({
  defaultValue = "",
  initialMode = "search",
  compact,
  className,
}: CommandBarProps) {
  const router = useRouter();
  const [mode, setMode] = useState<CommandMode>(initialMode);
  const [query, setQuery] = useState(defaultValue);
  const activeMode = modes.find((item) => item.value === mode) ?? modes[0];
  const ActiveIcon = activeMode.icon;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    const path = mode === "ai" ? "/ai" : "/search";
    router.push(trimmed ? `${path}?q=${encodeURIComponent(trimmed)}` : path);
  }

  return (
    <form
      onSubmit={submit}
      className={clsx(
        "rounded-xl border border-slate-200/90 bg-surface shadow-sm",
        compact ? "p-1.5" : "p-2",
        className,
      )}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div
          className="inline-flex rounded-lg bg-slate-100 p-1"
          aria-label="Chế độ thao tác"
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
                  compact && "md:w-10 md:px-0",
                  active
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-900",
                )}
                title={item.label}
              >
                <Icon size={16} />
                <span className={clsx(compact && "md:hidden")}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-0 flex-1">
          <ActiveIcon
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={17}
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={activeMode.placeholder}
            aria-label={activeMode.placeholder}
            className={clsx(
              "w-full rounded-lg border border-transparent bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100",
              compact ? "h-9" : "h-11",
            )}
          />
        </div>

        <button
          type="submit"
          className={clsx(
            "inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none disabled:opacity-50",
            compact ? "h-9" : "h-11",
          )}
        >
          <SendHorizontal size={16} />
          <span>{mode === "ai" ? "Hỏi" : "Tìm"}</span>
        </button>
      </div>
    </form>
  );
}
