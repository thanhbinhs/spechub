import type { DeviceCategory, Organization } from "@spechub/api-client";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";

type FilterFormProps = {
  action: string;
  q?: string;
  brandSlug?: string;
  categorySlug?: string;
  brands?: Organization[];
  categories?: DeviceCategory[];
};

export function FilterForm({
  action,
  q,
  brandSlug,
  categorySlug,
  brands = [],
  categories = [],
}: FilterFormProps) {
  const brand = brands.find((item) => item.slug === brandSlug);
  const category = categories.find((item) => item.slug === categorySlug);
  const chips = [
    q
      ? {
          label: "Query",
          value: q,
          href: filterHref(action, { brandSlug, categorySlug }),
        }
      : null,
    brandSlug
      ? {
          label: "Brand",
          value: brand?.short_name ?? brand?.name ?? brandSlug,
          href: filterHref(action, { q, categorySlug }),
        }
      : null,
    categorySlug
      ? {
          label: "Category",
          value: category?.name ?? categorySlug,
          href: filterHref(action, { q, brandSlug }),
        }
      : null,
  ].filter((chip): chip is { label: string; value: string; href: string } =>
    Boolean(chip),
  );

  return (
    <div className="rounded-lg border border-slate-200/80 bg-white shadow-sm">
      <form
        action={action}
        className="grid gap-3 p-3 lg:grid-cols-[minmax(220px,1fr)_180px_180px_auto]"
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            size={18}
          />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search model, brand, chipset..."
            className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-500"
          />
        </div>
        <select
          name="brand_slug"
          defaultValue={brandSlug ?? ""}
          className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500"
        >
          <option value="">All brands</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.slug}>
              {brand.short_name ?? brand.name}
            </option>
          ))}
        </select>
        <select
          name="category_slug"
          defaultValue={categorySlug ?? ""}
          className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700">
          <SlidersHorizontal size={17} />
          Apply
        </button>
      </form>

      {chips.length ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-3 py-2">
          {chips.map((chip) => (
            <Link
              key={`${chip.label}-${chip.value}`}
              href={chip.href}
              className="inline-flex max-w-full items-center gap-2 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-blue-100"
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
            Reset
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function filterHref(
  action: string,
  values: {
    q?: string;
    brandSlug?: string;
    categorySlug?: string;
  },
) {
  const search = new URLSearchParams();
  if (values.q) search.set("q", values.q);
  if (values.brandSlug) search.set("brand_slug", values.brandSlug);
  if (values.categorySlug) search.set("category_slug", values.categorySlug);
  const query = search.toString();
  return query ? `${action}?${query}` : action;
}
