"use client";

import type { DeviceCategory, Organization } from "@spechub/api-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  LoaderCircle,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { localizeDeviceCategory } from "@/lib/localize";
import { SearchableSelect } from "@/components/searchable-select";

type FilterFormProps = {
  action: string;
  q?: string;
  brandSlug?: string;
  categorySlug?: string;
  sort?: string;
  brands?: Organization[];
  categories?: DeviceCategory[];
  hideQuery?: boolean;
  embedded?: boolean;
  showSort?: boolean;
  instant?: boolean;
};

type FilterValues = {
  q?: string;
  brandSlug?: string;
  categorySlug?: string;
  sort?: string;
};

type FilterChip = {
  key: string;
  label: string;
  value: string;
  clear: Partial<FilterValues>;
};

type FilterOption = {
  value: string;
  label: string;
};

export function FilterForm({
  action,
  q,
  brandSlug,
  categorySlug,
  sort,
  brands = [],
  categories = [],
  hideQuery = false,
  embedded = false,
  showSort = false,
  instant = false,
}: FilterFormProps) {
  const router = useRouter();
  const queryInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(q ?? "");
  const [formBrand, setFormBrand] = useState(brandSlug ?? "");
  const [formCategory, setFormCategory] = useState(categorySlug ?? "");
  const [formSort, setFormSort] = useState(sort || "newest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const normalizedSort = sort || "newest";
  const brand = brands.find((item) => item.slug === brandSlug);
  const category = categories.find((item) => item.slug === categorySlug);
  const brandOptions: FilterOption[] = [
    { value: "", label: "Tất cả hãng" },
    ...brands.map((item) => ({
      value: item.slug,
      label: item.short_name ?? item.name,
    })),
  ];
  const categoryOptions: FilterOption[] = [
    { value: "", label: "Tất cả danh mục" },
    ...categories.map((item) => ({
      value: item.slug,
      label: localizeDeviceCategory(item),
    })),
  ];
  const activeOptionCount =
    Number(Boolean(brandSlug)) +
    Number(Boolean(categorySlug)) +
    Number(showSort && normalizedSort !== "newest");
  const chips = createChips({
    q,
    brandSlug,
    categorySlug,
    sort: normalizedSort,
    brand,
    category,
    includeSort: instant && showSort,
  });

  useEffect(() => {
    setQuery(q ?? "");
    setFormBrand(brandSlug ?? "");
    setFormCategory(categorySlug ?? "");
    setFormSort(sort || "newest");
  }, [brandSlug, categorySlug, q, sort]);

  function navigate(values: FilterValues) {
    const href = filterHref(action, values);
    startTransition(() => router.replace(href, { scroll: false }));
  }

  function updateFilter(values: Partial<FilterValues>) {
    navigate({
      q: queryInputRef.current?.value.trim() ?? query.trim(),
      brandSlug,
      categorySlug,
      sort: normalizedSort,
      ...values,
    });
  }

  function submitInstant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedQuery = new FormData(event.currentTarget).get("q");
    updateFilter({
      q: typeof submittedQuery === "string" ? submittedQuery.trim() : "",
    });
  }

  function clearQuery() {
    setQuery("");
    updateFilter({ q: "" });
  }

  function submitQueryOnEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    updateFilter({ q: event.currentTarget.value.trim() });
  }

  if (instant) {
    return (
      <div
        className={`relative ${
          embedded
            ? "bg-white"
            : "rounded-xl border border-slate-200/90 bg-white shadow-sm"
        }`}
        aria-busy={isPending}
      >
        <form
          action={action}
          onSubmit={submitInstant}
          className="p-4 sm:p-5"
          aria-label="Lọc thiết bị"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 lg:grid-cols-[minmax(280px,1.35fr)_minmax(150px,0.7fr)_minmax(170px,0.75fr)_minmax(160px,0.7fr)] lg:gap-3">
            {!hideQuery ? (
              <div>
                <label
                  htmlFor="catalog-query"
                  className="mb-1.5 block text-xs font-semibold text-slate-600"
                >
                  Tìm thiết bị
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    ref={queryInputRef}
                    name="q"
                    id="catalog-query"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={submitQueryOnEnter}
                    placeholder="Tên máy, hãng hoặc chipset"
                    className="form-control pl-10 pr-10"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={clearQuery}
                      className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Xóa từ khóa"
                    >
                      <X size={16} />
                    </button>
                  ) : null}
                </div>
                <button type="submit" className="sr-only">
                  Tìm thiết bị
                </button>
              </div>
            ) : q ? (
              <input type="hidden" name="q" value={q} />
            ) : null}

            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/50 lg:hidden"
              aria-expanded={filtersOpen}
              aria-controls="catalog-filter-options"
              aria-label={`Bộ lọc${
                activeOptionCount
                  ? `, ${activeOptionCount} tùy chọn đang áp dụng`
                  : ""
              }`}
            >
              <SlidersHorizontal size={17} />
              <span className="hidden sm:inline">Bộ lọc</span>
              {activeOptionCount ? (
                <span className="grid size-5 place-items-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  {activeOptionCount}
                </span>
              ) : null}
            </button>

            <div
              id="catalog-filter-options"
              className={`col-span-full grid gap-3 pt-2 sm:grid-cols-3 lg:contents ${
                filtersOpen ? "grid" : "hidden"
              }`}
            >
              <FilterMenu
                id="catalog-brand"
                name="brand_slug"
                label="Hãng"
                value={brandSlug ?? ""}
                options={brandOptions}
                onChange={(value) => updateFilter({ brandSlug: value })}
                searchable={brands.length > 7}
                searchPlaceholder="Tìm hãng"
                wideMenu
              />

              <FilterMenu
                id="catalog-category"
                name="category_slug"
                label="Danh mục"
                value={categorySlug ?? ""}
                options={categoryOptions}
                onChange={(value) => updateFilter({ categorySlug: value })}
                searchable={categories.length > 9}
                searchPlaceholder="Tìm danh mục"
                wideMenu
              />

              {showSort ? (
                <FilterMenu
                  id="catalog-sort"
                  name="sort"
                  label="Sắp xếp"
                  value={normalizedSort}
                  options={[
                    { value: "newest", label: "Mới phát hành" },
                    { value: "updated", label: "Mới cập nhật" },
                    { value: "name-asc", label: "Tên A–Z" },
                  ]}
                  onChange={(value) => updateFilter({ sort: value })}
                />
              ) : null}
            </div>
          </div>
        </form>

        {chips.length ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3 sm:px-5">
            {chips.map((chip) => (
              <button
                key={`${chip.key}-${chip.value}`}
                type="button"
                onClick={() => updateFilter(chip.clear)}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-blue-100"
                aria-label={`Bỏ lọc ${chip.label.toLocaleLowerCase("vi-VN")} ${chip.value}`}
              >
                <span className="text-slate-500">{chip.label}</span>
                <span className="max-w-40 truncate">{chip.value}</span>
                <X size={13} />
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setQuery("");
                navigate({});
              }}
              className="ml-auto inline-flex rounded-md px-2.5 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Đặt lại
            </button>
          </div>
        ) : null}

        {isPending ? (
          <span
            className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-500 shadow-sm backdrop-blur sm:right-5"
            role="status"
          >
            <LoaderCircle className="animate-spin" size={13} />
            Đang lọc
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={embedded ? "bg-white" : "app-connected"}>
      <form
        action={action}
        className={`grid gap-3 p-4 sm:p-5 ${
          hideQuery
            ? showSort
              ? "md:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_180px_auto]"
              : "md:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_auto]"
            : showSort
              ? "md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_175px_175px_175px_auto]"
              : "xl:grid-cols-[minmax(240px,1fr)_190px_190px_auto]"
        } items-end`}
        aria-label="Lọc kết quả danh mục"
      >
        {hideQuery ? (
          q ? (
            <input type="hidden" name="q" value={q} />
          ) : null
        ) : (
          <div>
            <label
              htmlFor="catalog-query"
              className="mb-1.5 block text-xs font-semibold text-slate-600"
            >
              Tìm kiếm
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                size={18}
              />
              <input
                name="q"
                id="catalog-query"
                defaultValue={q}
                placeholder="Mẫu máy, hãng hoặc chipset..."
                className="form-control pl-10"
              />
            </div>
          </div>
        )}
        <SearchableSelect
          name="brand_slug"
          label="Thương hiệu"
          labelClassName="text-xs font-semibold text-slate-600"
          value={formBrand}
          onChange={setFormBrand}
          options={brands.map((item) => ({
            value: item.slug,
            label: item.short_name ?? item.name,
            meta: item.slug,
          }))}
          placeholder="Tất cả thương hiệu"
          searchPlaceholder="Tìm thương hiệu..."
        />
        <SearchableSelect
          name="category_slug"
          label="Danh mục"
          labelClassName="text-xs font-semibold text-slate-600"
          value={formCategory}
          onChange={setFormCategory}
          options={categories.map((item) => ({
            value: item.slug,
            label: localizeDeviceCategory(item),
            meta: item.slug,
          }))}
          placeholder="Tất cả danh mục"
          searchPlaceholder="Tìm danh mục..."
        />
        {showSort ? (
          <SearchableSelect
            name="sort"
            label="Sắp xếp"
            labelClassName="text-xs font-semibold text-slate-600"
            value={formSort}
            onChange={setFormSort}
            options={[
              { value: "newest", label: "Mới phát hành" },
              { value: "updated", label: "Mới cập nhật" },
              { value: "name-asc", label: "Tên A–Z" },
            ]}
            clearable={false}
          />
        ) : sort ? (
          <input type="hidden" name="sort" value={sort} />
        ) : null}
        <button className="app-button-primary">
          <SlidersHorizontal size={17} />
          Áp dụng
        </button>
      </form>

      {chips.length ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3 sm:px-5">
          {chips.map((chip) => (
            <Link
              key={`${chip.key}-${chip.value}`}
              href={filterHref(action, {
                q,
                brandSlug,
                categorySlug,
                sort: normalizedSort,
                ...chip.clear,
              })}
              className="inline-flex max-w-full items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-blue-100"
            >
              <span className="text-slate-500">{chip.label}</span>
              <span className="truncate">{chip.value}</span>
              <X size={13} />
            </Link>
          ))}
          <Link
            href={action}
            className="inline-flex rounded-md px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:text-slate-950"
          >
            Đặt lại
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function FilterMenu({
  id,
  name,
  label,
  value,
  options,
  onChange,
  searchable = false,
  searchPlaceholder = "Tìm nhanh",
  wideMenu = false,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  wideMenu?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];
  const normalizedSearch = normalizeSearch(search);
  const visibleOptions = normalizedSearch
    ? options.filter((option) =>
        normalizeSearch(option.label).includes(normalizedSearch),
      )
    : options;
  const listboxId = `${id}-listbox`;

  useEffect(() => {
    if (!open) return;

    function closeOnPointerDown(event: MouseEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
      setSearch("");
    }

    function closeOnFocusOutside(event: FocusEvent) {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
      setSearch("");
    }

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      setSearch("");
      triggerRef.current?.focus();
    }

    document.addEventListener("mousedown", closeOnPointerDown);
    document.addEventListener("focusin", closeOnFocusOutside);
    document.addEventListener("keydown", closeOnEscape);
    const focusFrame = requestAnimationFrame(() => {
      const selectedIndex = visibleOptions.findIndex(
        (option) => option.value === value,
      );
      if (searchable) {
        searchRef.current?.focus();
        if (!normalizedSearch && selectedIndex >= 0) {
          optionRefs.current[selectedIndex]?.scrollIntoView({
            block: "nearest",
          });
        }
        return;
      }

      optionRefs.current[Math.max(selectedIndex, 0)]?.focus();
    });

    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("mousedown", closeOnPointerDown);
      document.removeEventListener("focusin", closeOnFocusOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [normalizedSearch, open, searchable, value, visibleOptions]);

  function selectOption(option: FilterOption) {
    setOpen(false);
    setSearch("");
    if (option.value !== value) onChange(option.value);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function moveOptionFocus(
    event: KeyboardEvent<HTMLElement>,
    currentIndex: number,
  ) {
    const lastIndex = visibleOptions.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowDown")
      nextIndex = Math.min(currentIndex + 1, lastIndex);
    if (event.key === "ArrowUp") nextIndex = Math.max(currentIndex - 1, 0);
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = lastIndex;
    if (nextIndex === null) return;

    event.preventDefault();
    optionRefs.current[nextIndex]?.focus();
  }

  return (
    <div ref={containerRef} className="relative block min-w-0">
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold text-slate-600"
      >
        {label}
      </label>
      <input type="hidden" name={name} value={value} />
      <button
        ref={triggerRef}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          setOpen((current) => !current);
          if (open) setSearch("");
        }}
        className={`form-control flex items-center justify-between gap-2 text-left ${
          open ? "border-blue-500 ring-4 ring-blue-100" : ""
        }`}
      >
        <span className="truncate">{selectedOption?.label ?? label}</span>
        <ChevronDown
          className={`shrink-0 text-slate-400 transition ${
            open ? "rotate-180" : ""
          }`}
          size={16}
        />
      </button>

      {open ? (
        <div
          className={`absolute left-0 top-full z-[70] mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_18px_50px_-16px_rgba(15,23,42,0.32)] ${
            wideMenu ? "lg:min-w-72" : ""
          }`}
        >
          {searchable ? (
            <div className="relative mb-1.5">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                ref={searchRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowDown") return;
                  event.preventDefault();
                  optionRefs.current[0]?.focus();
                }}
                placeholder={searchPlaceholder}
                aria-label={`${searchPlaceholder} trong danh sách`}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          ) : null}

          <div
            id={listboxId}
            role="listbox"
            aria-label={label}
            className="max-h-64 overflow-y-auto overscroll-contain py-0.5"
          >
            {visibleOptions.length ? (
              visibleOptions.map((option, index) => {
                const selected = option.value === value;
                return (
                  <button
                    key={option.value || "all"}
                    ref={(node) => {
                      optionRefs.current[index] = node;
                    }}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    title={option.label}
                    onClick={() => selectOption(option)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectOption(option);
                        return;
                      }
                      moveOptionFocus(event, index);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                      selected
                        ? "bg-blue-50 font-semibold text-blue-700"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                    }`}
                  >
                    <span className="grid size-5 shrink-0 place-items-center">
                      {selected ? <Check size={15} strokeWidth={2.5} /> : null}
                    </span>
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-6 text-center text-sm text-slate-500">
                Không tìm thấy
              </p>
            )}
          </div>
        </div>
      ) : null}
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

function createChips({
  q,
  brandSlug,
  categorySlug,
  sort,
  brand,
  category,
  includeSort,
}: FilterValues & {
  brand?: Organization;
  category?: DeviceCategory;
  includeSort: boolean;
}) {
  const chips: Array<FilterChip | null> = [
    q
      ? {
          key: "query",
          label: "Từ khóa",
          value: q,
          clear: { q: "" },
        }
      : null,
    brandSlug
      ? {
          key: "brand",
          label: "Hãng",
          value: brand?.short_name ?? brand?.name ?? brandSlug,
          clear: { brandSlug: "" },
        }
      : null,
    categorySlug
      ? {
          key: "category",
          label: "Danh mục",
          value: localizeDeviceCategory(category, categorySlug),
          clear: { categorySlug: "" },
        }
      : null,
    includeSort && sort && sort !== "newest"
      ? {
          key: "sort",
          label: "Sắp xếp",
          value: sortLabel(sort),
          clear: { sort: "newest" },
        }
      : null,
  ];

  return chips.filter((chip): chip is FilterChip => Boolean(chip));
}

function sortLabel(sort: string) {
  if (sort === "updated") return "Mới cập nhật";
  if (sort === "name-asc") return "Tên A–Z";
  return "Mới phát hành";
}

function filterHref(action: string, values: FilterValues) {
  const search = new URLSearchParams();
  if (values.q) search.set("q", values.q);
  if (values.brandSlug) search.set("brand_slug", values.brandSlug);
  if (values.categorySlug) search.set("category_slug", values.categorySlug);
  if (values.sort && values.sort !== "newest") search.set("sort", values.sort);
  const query = search.toString();
  return query ? `${action}?${query}` : action;
}
