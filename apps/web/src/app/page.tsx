import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { DeviceCard } from "@/components/device-card";
import { HomeBannerCarousel } from "@/components/home-banner-carousel";
import { RecentlyViewedDevices } from "@/components/research-workspace";
import { api, categoryTreeData } from "@/lib/api";
import { localizeDeviceCategory, localizeLanguage } from "@/lib/localize";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [models, categoryResult, wiki] = await Promise.all([
    api.listDeviceModels({
      pageSize: 6,
      sortBy: "updated_at",
      sortOrder: "desc",
    }),
    api.getDeviceCategoryTree(),
    api.listWikiArticles({ pageSize: 3, sort: "updated" }).catch(() => null),
  ]);
  const categories = categoryTreeData(categoryResult);

  return (
    <div className="app-page mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <HomeBannerCarousel />

      <RecentlyViewedDevices />

      <section>
        <SectionHeading
          title="Thiết bị đáng xem"
          href="/devices"
          linkLabel="Xem thêm"
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {models.data.map((model) => (
            <DeviceCard key={model.id} model={model} />
          ))}
        </div>
      </section>

      <section className="app-connected grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="border-b border-slate-200 bg-surface-soft p-6 lg:border-b-0 lg:border-r lg:p-7">
          <h2 className="text-2xl font-semibold text-slate-950">
            Tìm theo loại thiết bị
          </h2>
        </div>
        <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
          {categories.slice(0, 9).map((category) => (
            <Link
              key={category.id}
              href={`/devices?category_slug=${category.slug}`}
              className="group flex items-center justify-between rounded-lg border border-transparent bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-blue-200 hover:bg-blue-50"
            >
              {localizeDeviceCategory(category)}
              <ArrowRight
                size={15}
                className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-700"
              />
            </Link>
          ))}
        </div>
      </section>

      {wiki?.data.length ? (
        <section>
          <SectionHeading
            title="Bài viết mới"
            href="/wiki"
            linkLabel="Xem bài viết"
          />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {wiki.data.map((article) => (
              <Link
                key={article.id}
                href={`/wiki/${article.slug}?language=${article.language.code}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  {localizeLanguage(article.language)} ·{" "}
                  {article.reading_time_minutes} phút đọc
                </div>
                <h3 className="mt-3 line-clamp-2 text-base font-semibold leading-6 text-slate-950 group-hover:text-blue-700">
                  {article.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                  {article.summary}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SectionHeading({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700"
      >
        {linkLabel}
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}
