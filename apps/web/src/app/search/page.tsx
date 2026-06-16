import Link from "next/link";
import { BrainCircuit, SearchX } from "lucide-react";
import { api, categoryTreeData } from "@/lib/api";
import { DeviceList } from "@/components/device-list";
import { EmptyState } from "@/components/empty-state";
import { FilterForm } from "@/components/filter-form";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { Surface, SurfaceHeader } from "@/components/surface";

export const dynamic = "force-dynamic";

export default async function SearchPage({
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

  const [results, brands, categoryResult] = await Promise.all([
    api.search(query),
    api.listOrganizations({ pageSize: 50, sortBy: "name", sortOrder: "asc" }),
    api.getDeviceCategoryTree(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Search"
        title={q ? `Results for "${q}"` : "Search"}
        description={`${results.meta.total} results from ${results.meta.source ?? "database"} search.`}
        action={
          q ? (
            <Link
              href={`/ai?q=${encodeURIComponent(q)}`}
              className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Ask AI
            </Link>
          ) : null
        }
      />

      <FilterForm
        action="/search"
        q={q}
        brandSlug={brandSlug}
        categorySlug={categorySlug}
        brands={brands.data}
        categories={categoryTreeData(categoryResult)}
      />

      {results.data.length ? (
        <>
          <Surface>
            <SurfaceHeader
              title="Matched records"
              meta={`${results.data.length} visible · ${results.meta.source ?? "database"}`}
              action={
                q ? (
                  <Link
                    href={`/ai?q=${encodeURIComponent(q)}`}
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                  >
                    <BrainCircuit size={15} />
                    Ask AI
                  </Link>
                ) : null
              }
            />
            <DeviceList models={results.data} />
          </Surface>
          <Pagination
            basePath="/search"
            meta={results.meta}
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
          title="No results matched"
          description="Try a broader keyword or ask AI to inspect the current catalog."
          action={
            q ? (
              <Link
                href={`/ai?q=${encodeURIComponent(q)}`}
                className="inline-flex h-10 items-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-400"
              >
                Ask AI instead
              </Link>
            ) : null
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
