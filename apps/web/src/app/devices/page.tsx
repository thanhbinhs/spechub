import Link from "next/link";
import { ArrowRight, BrainCircuit, SearchX } from "lucide-react";
import { api, categoryTreeData } from "@/lib/api";
import { DeviceList } from "@/components/device-list";
import { EmptyState } from "@/components/empty-state";
import { FilterForm } from "@/components/filter-form";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { Surface, SurfaceHeader } from "@/components/surface";

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
          <div className="grid gap-3 md:grid-cols-3">
            <SummaryTile
              label="Tổng số"
              value={`${models.meta.total} mẫu máy`}
            />
            <SummaryTile
              label="Trang"
              value={`${models.meta.page}/${models.meta.totalPages}`}
            />
            <SummaryTile
              label="Bộ lọc"
              value={
                [q, brandSlug, categorySlug].filter(Boolean).length
                  ? "Đang áp dụng"
                  : "Không có"
              }
            />
          </div>

          <Surface>
            <SurfaceHeader
              title="Bản ghi danh mục"
              meta={`${models.data.length} đang hiển thị`}
              action={
                q ? (
                  <Link
                    href={`/ai?q=${encodeURIComponent(q)}`}
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-slate-950"
                  >
                    <BrainCircuit size={15} />
                    Hỏi AI
                  </Link>
                ) : (
                  <Link
                    href="/compare"
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-slate-950"
                  >
                    So sánh
                    <ArrowRight size={15} />
                  </Link>
                )
              }
            />
            <DeviceList models={models.data} />
          </Surface>
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

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="interactive-lift rounded-lg border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-950">{value}</div>
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
