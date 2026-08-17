import Link from "next/link";
import type { ReactNode } from "react";
import {
  Building2,
  GitCompareArrows,
  Layers3,
  SearchX,
  Smartphone,
} from "lucide-react";
import { api, categoryTreeData } from "@/lib/api";
import { DeviceCard } from "@/components/device-card";
import { EmptyState } from "@/components/empty-state";
import { FilterForm } from "@/components/filter-form";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";

export const dynamic = "force-dynamic";

export default async function DevicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = stringParam(params.q);
  const brandSlug = stringParam(params.brand_slug);
  const categorySlug = stringParam(params.category_slug);
  const sort = stringParam(params.sort) || "newest";
  const page = numberParam(params.page, 1);
  const sortQuery =
    sort === "name-asc"
      ? { sortBy: "name", sortOrder: "asc" as const }
      : sort === "updated"
        ? { sortBy: "updated_at", sortOrder: "desc" as const }
        : { sortBy: "release_date", sortOrder: "desc" as const };
  const query = {
    q: q || undefined,
    brand_slug: brandSlug || undefined,
    category_slug: categorySlug || undefined,
    page,
    pageSize: 12,
    ...sortQuery,
  };

  const [models, brands, categoryResult] = await Promise.all([
    api.listDeviceModels(query),
    api.listOrganizations({ pageSize: 50, sortBy: "name", sortOrder: "asc" }),
    api.getDeviceCategoryTree(),
  ]);
  const categoryOptions = categoryTreeData(categoryResult);

  return (
    <div className="app-page mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader
        title="Thiết bị"
        action={
          <Link
            href="/compare"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <GitCompareArrows size={16} />
            Bắt đầu so sánh
          </Link>
        }
      />

      <section
        className="grid gap-3 sm:grid-cols-3"
        aria-label="Tổng quan danh mục thiết bị"
      >
        <CatalogStat
          icon={<Smartphone size={18} />}
          value={models.meta.total}
          label="mẫu thiết bị"
        />
        <CatalogStat
          icon={<Building2 size={18} />}
          value={brands.meta.total}
          label="thương hiệu"
        />
        <CatalogStat
          icon={<Layers3 size={18} />}
          value={categoryOptions.length}
          label="danh mục"
        />
      </section>

      <FilterForm
        action="/devices"
        q={q}
        brandSlug={brandSlug}
        categorySlug={categorySlug}
        sort={sort}
        showSort
        instant
        brands={brands.data}
        categories={categoryOptions}
      />

      {models.data.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {models.data.map((model) => (
              <DeviceCard key={model.id} model={model} />
            ))}
          </div>
          <Pagination
            basePath="/devices"
            meta={models.meta}
            params={{
              q,
              brand_slug: brandSlug,
              category_slug: categorySlug,
              sort: sort === "newest" ? "" : sort,
            }}
          />
        </>
      ) : (
        <EmptyState
          icon={<SearchX size={20} />}
          title="Không tìm thấy thiết bị phù hợp"
          action={
            <Link
              href="/devices"
              className="inline-flex h-10 items-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-blue-300"
            >
              Đặt lại bộ lọc
            </Link>
          }
        />
      )}
    </div>
  );
}

function CatalogStat({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className="grid size-10 place-items-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </span>
      <span>
        <strong className="block text-lg font-semibold leading-none text-slate-950">
          {value.toLocaleString("vi-VN")}
        </strong>
        <span className="mt-1 block text-xs text-slate-500">{label}</span>
      </span>
    </div>
  );
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function numberParam(value: string | string[] | undefined, fallback: number) {
  const raw = stringParam(value);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
