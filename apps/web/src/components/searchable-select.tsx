"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";

export type SearchableSelectOption = {
  value: string;
  label: string;
  meta?: string;
  keywords?: string;
};

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Tìm và chọn...",
  searchPlaceholder,
  emptyLabel = "Không có kết quả phù hợp",
  hint,
  required,
  disabled,
  clearable = true,
  name,
  className,
  labelClassName = "text-sm font-medium text-slate-700",
  controlClassName = "h-11",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  name?: string;
  className?: string;
  labelClassName?: string;
  controlClassName?: string;
}) {
  const instanceId = useId();
  const listboxId = `searchable-select-${instanceId}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState<{
    left: number;
    top: number;
    width: number;
    maxHeight: number;
    openUpward: boolean;
  } | null>(null);
  const selected = options.find((option) => option.value === value);
  const visibleOptions = useMemo(() => {
    const normalized = normalizeSearch(query);
    return options
      .filter((option) =>
        normalizeSearch(
          `${option.label} ${option.meta ?? ""} ${option.keywords ?? ""}`,
        ).includes(normalized),
      )
      .slice(0, 50);
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }

    function positionMenu() {
      const control = controlRef.current;
      if (!control) return;
      const rect = control.getBoundingClientRect();
      const viewportPadding = 12;
      const gap = 6;
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
      const spaceAbove = rect.top - viewportPadding;
      const openUpward = spaceBelow < 220 && spaceAbove > spaceBelow;
      const availableSpace = Math.max(
        120,
        (openUpward ? spaceAbove : spaceBelow) - gap,
      );
      const width = Math.min(
        Math.max(rect.width, 240),
        window.innerWidth - viewportPadding * 2,
      );
      const left = Math.min(
        Math.max(viewportPadding, rect.left),
        window.innerWidth - width - viewportPadding,
      );
      setMenuPosition({
        left,
        top: openUpward ? rect.top - gap : rect.bottom + gap,
        width,
        maxHeight: Math.min(288, availableSpace),
        openUpward,
      });
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
      setQuery("");
      setActiveIndex(0);
    }

    positionMenu();
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", positionMenu, true);
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => {
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", positionMenu, true);
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, [open]);

  function choose(nextValue: string) {
    onChange(nextValue);
    setQuery("");
    setOpen(false);
    setActiveIndex(0);
  }

  return (
    <div
      ref={rootRef}
      className={`relative min-w-0 ${className ?? ""}`}
      onBlur={(event) => {
        const nextTarget = event.relatedTarget as Node | null;
        if (
          !event.currentTarget.contains(nextTarget) &&
          !menuRef.current?.contains(nextTarget)
        ) {
          setOpen(false);
          setQuery("");
          setActiveIndex(0);
        }
      }}
    >
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <label className="block min-w-0">
        <span className={`mb-1.5 block ${labelClassName}`}>
          {label}
          {required ? <span className="ml-1 text-rose-600">*</span> : null}
        </span>
        <span className="relative block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            ref={controlRef}
            type="search"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-required={required}
            disabled={disabled}
            value={open ? query : (selected?.label ?? "")}
            placeholder={
              open ? (searchPlaceholder ?? placeholder) : placeholder
            }
            onFocus={() => {
              setOpen(true);
              setQuery("");
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setOpen(true);
                setActiveIndex((current) =>
                  Math.min(current + 1, Math.max(0, visibleOptions.length - 1)),
                );
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((current) => Math.max(0, current - 1));
              } else if (event.key === "Enter" && open) {
                event.preventDefault();
                const option = visibleOptions[activeIndex];
                if (option) choose(option.value);
              } else if (event.key === "Escape") {
                event.preventDefault();
                setOpen(false);
                setQuery("");
              }
            }}
            className={`form-control min-w-0 w-full pl-9 ${
              clearable && value ? "pr-10" : "pr-9"
            } ${controlClassName} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`}
          />
          {clearable && value && !disabled ? (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose("")}
              aria-label={`Bỏ chọn ${label.toLocaleLowerCase("vi-VN")}`}
              className="absolute right-2 top-1/2 z-10 grid size-7 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          ) : !value ? (
            <ChevronDown
              aria-hidden="true"
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          ) : null}
        </span>
      </label>
      {hint ? (
        <p className="mt-1.5 text-xs leading-5 text-slate-500">{hint}</p>
      ) : null}

      {open && !disabled && menuPosition && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              id={listboxId}
              role="listbox"
              style={{
                position: "fixed",
                left: menuPosition.left,
                top: menuPosition.top,
                width: menuPosition.width,
                maxHeight: menuPosition.maxHeight,
                transform: menuPosition.openUpward
                  ? "translateY(-100%)"
                  : undefined,
              }}
              className="z-[120] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-950/15"
            >
              {visibleOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(option.value)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition ${
                    index === activeIndex
                      ? "bg-blue-50 text-blue-950"
                      : "text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {option.label}
                    </span>
                    {option.meta ? (
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {option.meta}
                      </span>
                    ) : null}
                  </span>
                  {option.value === value ? (
                    <Check size={15} className="shrink-0 text-blue-600" />
                  ) : null}
                </button>
              ))}
              {!visibleOptions.length ? (
                <p className="px-3 py-6 text-center text-sm text-slate-500">
                  {emptyLabel}
                </p>
              ) : null}
              {options.length > visibleOptions.length ? (
                <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-400">
                  Nhập thêm ký tự để thu hẹp kết quả.
                </p>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("vi-VN")
    .trim();
}
