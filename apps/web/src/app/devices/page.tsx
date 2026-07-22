import Link from "next/link";
import { SearchX } from "lucide-react";
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
  const page = numberParam(params.page, 1);
  const query = {
    q: q || undefined,
    brand_slug: brandSlug || undefined,
    category_slug: categorySlug || undefined,
    page,
    pageSize: 12,
  };

  const [models, brands, categoryResult] = await Promise.all([
    api.listDeviceModels(query),
    api.listOrganizations({ pageSize: 50, sortBy: "name", sortOrder: "asc" }),
    api.getDeviceCategoryTree(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Danh mục"
        title="Thiết bị"
        description={`${models.meta.total} mẫu máy thuộc các hãng, danh mục, phiên bản và linh kiện.`}
        action={
          <Link
            href="/compare"
            className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Bắt đầu so sánh
          </Link>
        }
      />

      <FilterForm
        action="/devices"
        q={q}
        brandSlug={brandSlug}
        categorySlug={categorySlug}
        brands={brands.data}
        categories={categoryTreeData(categoryResult)}
      />

      {models.data.length ? (
        <>
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-sm">
            <span className="text-slate-500">
              Hiển thị {models.data.length} trong {models.meta.total} thiết bị
            </span>
            <span className="font-medium text-slate-700">
              Trang {models.meta.page}/{models.meta.totalPages}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
            }}
          />
        </>
      ) : (
        <EmptyState
          icon={<SearchX size={20} />}
          title="Không tìm thấy thiết bị phù hợp"
          description="Hãy thử từ khóa rộng hơn hoặc xóa một trong các bộ lọc."
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

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function numberParam(value: string | string[] | undefined, fallback: number) {
  const raw = stringParam(value);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
