import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Cpu,
  Radio,
  SearchX,
  SlidersHorizontal,
} from "lucide-react";
import type { Chipset, DeviceCategory } from "@spechub/api-client";
import { api, categoryTreeData } from "@/lib/api";
import { DeviceList } from "@/components/device-list";
import { EmptyState } from "@/components/empty-state";
import { FilterForm } from "@/components/filter-form";
import { HardwareDeviceExplorer } from "@/components/hardware-device-explorer";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { Surface, SurfaceHeader } from "@/components/surface";
import { localizeDeviceCategory } from "@/lib/localize";

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

  const [results, brands, categoryResult, chipsetResult] = await Promise.all([
    api.search(query),
    api.listOrganizations({ pageSize: 50, sortBy: "name", sortOrder: "asc" }),
    api.getDeviceCategoryTree(),
    q
      ? api.listChipsets({ q, pageSize: 4 }).catch(() => null)
      : Promise.resolve(null),
  ]);
  const chipsets = chipsetResult?.data ?? [];
  const categories = categoryTreeData(categoryResult);
  const primaryChipset =
    chipsets.find(
      (chipset) =>
        normalize(chipset.name) === normalize(q) ||
        normalize(chipset.slug) === normalize(q),
    ) ?? chipsets[0];
  const [hardwareResult, hardwareResearch] = primaryChipset
    ? await Promise.all([
        api.getHardwareModule("chipset", primaryChipset.slug).catch(() => null),
        api
          .researchHardwareModule("chipset", primaryChipset.slug)
          .catch(() => null),
      ])
    : [null, null];
  const hardwareDevices =
    hardwareResult?.data.devices.filter((device) => {
      const family = device.device_model.product_family;
      const matchesBrand = !brandSlug || family?.brand_org?.slug === brandSlug;
      const matchesCategory =
        !categorySlug || family?.device_category?.slug === categorySlug;
      return matchesBrand && matchesCategory;
    }) ?? [];
  const linkedModelIds = new Set(
    hardwareDevices.map((device) => device.device_model.id),
  );
  const remainingModels = results.data.filter(
    (model) => !linkedModelIds.has(model.id),
  );
  const hasResults =
    chipsets.length > 0 ||
    results.data.length > 0 ||
    hardwareDevices.length > 0;

  return (
    <div className="app-page mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader
        title={q ? `Kết quả cho "${q}"` : "Tìm kiếm"}
        action={
          q ? (
            <Link
              href={`/ai?q=${encodeURIComponent(q)}`}
              className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Hỏi AI
            </Link>
          ) : null
        }
      />

      {!q ? <DiscoveryShortcuts categories={categories} /> : null}

      {chipsets.length ? <ChipsetMatches chipsets={chipsets} /> : null}

      {hardwareResult?.data && hardwareDevices.length ? (
        <HardwareDeviceExplorer
          moduleName={hardwareResult.data.name}
          devices={hardwareDevices}
          assessments={hardwareResearch?.data.device_assessments}
          summary={hardwareResearch?.data.summary}
        />
      ) : null}

      {q ? (
        <details className="group rounded-xl border border-slate-200 bg-white">
          <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-slate-700 sm:px-5">
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal size={16} />
              Lọc theo hãng hoặc danh mục
            </span>
            <span className="text-xs font-normal text-slate-500 group-open:hidden">
              Tùy chọn
            </span>
          </summary>
          <div className="border-t border-slate-100">
            <FilterForm
              action="/search"
              q={q}
              brandSlug={brandSlug}
              categorySlug={categorySlug}
              brands={brands.data}
              categories={categories}
              hideQuery
              embedded
            />
          </div>
        </details>
      ) : (
        <FilterForm
          action="/search"
          brandSlug={brandSlug}
          categorySlug={categorySlug}
          brands={brands.data}
          categories={categories}
        />
      )}

      {remainingModels.length ? (
        <>
          <Surface>
            <SurfaceHeader
              title={
                hardwareDevices.length
                  ? "Kết quả liên quan khác"
                  : "Thiết bị phù hợp"
              }
              meta={`${remainingModels.length} thiết bị đang hiển thị`}
            />
            <DeviceList models={remainingModels} />
          </Surface>
          {!hardwareDevices.length ? (
            <Pagination
              basePath="/search"
              meta={results.meta}
              params={{
                q,
                brand_slug: brandSlug,
                category_slug: categorySlug,
              }}
            />
          ) : null}
        </>
      ) : !hasResults ? (
        <EmptyState
          icon={<SearchX size={20} />}
          title="Không tìm thấy kết quả phù hợp"
          description="Thử một từ khóa khác."
          action={
            q ? (
              <Link
                href={`/ai?q=${encodeURIComponent(q)}`}
                className="inline-flex h-10 items-center rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-400"
              >
                Hỏi AI thay thế
              </Link>
            ) : null
          }
        />
      ) : null}
    </div>
  );
}

function DiscoveryShortcuts({ categories }: { categories: DeviceCategory[] }) {
  const componentQueries = ["Snapdragon", "Apple M", "Ryzen", "OLED", "5G"];

  return (
    <section className="app-connected overflow-hidden">
      <div className="grid gap-px bg-slate-200 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="bg-slate-950 p-5 text-white">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/10">
            <Compass size={19} />
          </span>
          <h2 className="mt-4 font-semibold">Khám phá nhanh</h2>
        </div>
        <div className="space-y-4 bg-white p-5">
          <div>
            <div className="mb-2 text-xs font-semibold text-slate-500">
              Theo loại thiết bị
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category.id}
                  href={`/search?category_slug=${encodeURIComponent(category.slug)}`}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  {localizeDeviceCategory(category)}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold text-slate-500">
              Theo công nghệ
            </div>
            <div className="flex flex-wrap gap-2">
              {componentQueries.map((query) => (
                <Link
                  key={query}
                  href={`/search?q=${encodeURIComponent(query)}`}
                  className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
                >
                  {query}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChipsetMatches({ chipsets }: { chipsets: Chipset[] }) {
  return (
    <section aria-labelledby="matched-components">
      <div className="mb-3">
        <div>
          <p className="app-section-label">Linh kiện phù hợp</p>
          <h2
            id="matched-components"
            className="mt-1 text-lg font-semibold text-slate-950"
          >
            Chipset
          </h2>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {chipsets.map((chipset) => (
          <Link
            key={chipset.id}
            href={`/hardware/chipset/${chipset.slug}`}
            className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-950 text-white">
                <Cpu size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-blue-700">
                      {chipset.manufacturer?.short_name ??
                        chipset.manufacturer?.name ??
                        "Chipset"}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-950 group-hover:text-blue-700">
                      {chipset.name}
                    </h3>
                  </div>
                  <ArrowRight
                    size={18}
                    className="mt-1 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-700"
                  />
                </div>
                {chipset.description ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                    {chipset.description}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <ChipFact
                    icon={<CheckCircle2 size={13} />}
                    text={`${chipset._count?.variant_chipsets ?? 0} phiên bản sử dụng`}
                  />
                  {chipset.integrated_5g ? (
                    <ChipFact icon={<Radio size={13} />} text="Tích hợp 5G" />
                  ) : null}
                  {chipset.max_ram_gb ? (
                    <ChipFact
                      icon={<Cpu size={13} />}
                      text={`RAM tối đa ${chipset.max_ram_gb} GB`}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ChipFact({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5 font-medium text-slate-600">
      {icon}
      {text}
    </span>
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

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("vi").replace(/[-_]+/g, " ");
}
