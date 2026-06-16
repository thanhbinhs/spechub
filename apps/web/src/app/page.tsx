import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BatteryCharging,
  BrainCircuit,
  Cpu,
  Database,
  GitCompareArrows,
  MonitorSmartphone,
  Smartphone,
  Sparkles,
} from "lucide-react";
import type { DeviceModelSummary } from "@spechub/api-client";
import { CommandBar } from "@/components/command-bar";
import { DeviceArtwork } from "@/components/device-artwork";
import { DeviceCard } from "@/components/device-card";
import { Surface, SurfaceHeader } from "@/components/surface";
import { api, categoryTreeData } from "@/lib/api";
import { primaryVariant } from "@/lib/format";

export const dynamic = "force-dynamic";

const researchPrompts = [
  "Best chipset under current catalog",
  "Compare iPhone 16 Pro and Galaxy S25 Ultra",
  "Which device has the largest battery?",
];

export default async function Home() {
  const [models, categoryResult, chipsets, variants, stats] =
    await Promise.all([
      api.listDeviceModels({ pageSize: 6 }),
      api.getDeviceCategoryTree(),
      api.listChipsets({ pageSize: 5 }),
      api.listDeviceVariants({ pageSize: 6, default_only: true }),
      api.getAiEmbeddingStats().catch(() => null),
    ]);
  const categories = categoryTreeData(categoryResult);
  const compareIds = variants.data
    .slice(0, 2)
    .map((variant) => variant.id)
    .join(",");
  const spotlight =
    models.data.find((model) => /iphone|galaxy|pixel|xiaomi/i.test(model.name)) ??
    models.data[0];
  const spotlightBrand = modelBrand(spotlight);
  const spotlightVariant = primaryVariant(spotlight);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="fade-up relative isolate overflow-hidden rounded-lg border border-slate-800 bg-slate-950 text-white shadow-[0_24px_90px_rgba(15,23,42,0.22)]">
        <div className="absolute inset-0 soft-grid opacity-20" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent_0%,rgba(37,99,235,0.20)_100%)]" />
        <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_430px] lg:p-8">
          <div className="flex min-w-0 flex-col justify-between gap-8 py-2">
            <div>
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase text-blue-100">
                  <Sparkles size={14} />
                  Live catalog workspace
                </span>
                <span className="rounded-md border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-200">
                  {models.meta.total} models
                </span>
                <span className="rounded-md border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-200">
                  {stats?.data.total_chunks ?? 0} AI chunks
                </span>
              </div>
              <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
                Find the right device without drowning in specs.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Search the catalog, compare real variants, and ask grounded AI
                questions from one focused research surface.
              </p>
              <div className="mt-7 max-w-3xl">
                <CommandBar className="border-white/20 bg-white/95 shadow-2xl shadow-slate-950/20" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HeroAction
                href="/devices"
                icon={<Smartphone size={18} />}
                label="Browse catalog"
                meta={`${models.meta.total} records`}
              />
              <HeroAction
                href={compareIds ? `/compare?ids=${compareIds}` : "/compare"}
                icon={<GitCompareArrows size={18} />}
                label="Compare"
                meta="Side-by-side board"
              />
              <HeroAction
                href="/ai"
                icon={<BrainCircuit size={18} />}
                label="Ask AI"
                meta="Cited answers"
              />
            </div>
          </div>

          <div className="relative">
            <DeviceArtwork
              hero
              brand={spotlightBrand}
              name={spotlight?.name}
              accent={spotlightVariant?.color_hex}
              className="h-full border-white/30 bg-white/95"
            />
            <div className="absolute inset-x-5 bottom-5 rounded-lg border border-white/70 bg-white/85 p-4 text-slate-950 shadow-xl backdrop-blur">
              <div className="text-xs font-semibold uppercase text-blue-700">
                Spotlight
              </div>
              <div className="mt-1 truncate text-lg font-semibold">
                {spotlight?.name ?? "SpecHub catalog"}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {spotlightBrand} · {modelCategory(spotlight)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Signal
          icon={<Cpu size={18} />}
          label="Performance"
          value="Chipset, RAM ceiling, process node"
        />
        <Signal
          icon={<MonitorSmartphone size={18} />}
          label="Display"
          value="Resolution, refresh rate, peak nits"
        />
        <Signal
          icon={<BatteryCharging size={18} />}
          label="Battery"
          value="Capacity and charging speed"
        />
        <Signal
          icon={<Database size={18} />}
          label="Evidence"
          value="Chunks, citations, related records"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase text-blue-700">
                Latest records
              </div>
              <h2 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
                Devices ready to explore
              </h2>
            </div>
            <Link
              href="/devices"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-slate-950"
            >
              All devices
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {models.data.slice(0, 6).map((model) => (
              <DeviceCard key={model.id} model={model} />
            ))}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <Surface>
            <SurfaceHeader title="Fast prompts" meta="Ask with context" />
            <div className="space-y-2 p-3">
              {researchPrompts.map((prompt) => (
                <Link
                  key={prompt}
                  href={`/ai?q=${encodeURIComponent(prompt)}`}
                  className="group flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-slate-950"
                >
                  <span className="min-w-0">{prompt}</span>
                  <ArrowRight
                    size={15}
                    className="shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
                  />
                </Link>
              ))}
            </div>
          </Surface>

          <Surface>
            <SurfaceHeader title="Browse categories" meta="Start narrow" />
            <div className="flex flex-wrap gap-2 p-3">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/devices?category_slug=${category.slug}`}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-slate-950"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </Surface>

          <Surface>
            <SurfaceHeader title="Chipset trail" meta="Popular components" />
            <div className="space-y-2 p-3">
              {chipsets.data.map((chipset) => (
                <Link
                  key={chipset.id}
                  href={`/search?q=${encodeURIComponent(chipset.name)}`}
                  className="group block rounded-md border border-slate-200 px-3 py-2 transition hover:border-blue-300 hover:bg-blue-50/50"
                >
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {chipset.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {chipset.manufacturer?.short_name ??
                      chipset.manufacturer?.name}
                  </span>
                </Link>
              ))}
            </div>
          </Surface>
        </aside>
      </section>
    </div>
  );
}

function HeroAction({
  href,
  icon,
  label,
  meta,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className="interactive-lift group rounded-lg border border-white/15 bg-white/10 p-4 backdrop-blur transition hover:border-white/30 hover:bg-white/15"
    >
      <span className="mb-4 grid h-10 w-10 place-items-center rounded-md bg-white text-blue-700 shadow-sm">
        {icon}
      </span>
      <span className="block text-sm font-semibold text-white">{label}</span>
      <span className="mt-1 flex items-center justify-between gap-3 text-xs text-slate-300">
        {meta}
        <ArrowRight
          size={15}
          className="transition group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}

function Signal({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="interactive-lift flex min-h-24 items-center gap-4 rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-700">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-950">
          {label}
        </span>
        <span className="mt-1 block text-sm leading-5 text-slate-500">
          {value}
        </span>
      </span>
    </div>
  );
}

function modelBrand(model?: DeviceModelSummary) {
  return (
    model?.product_family?.brand_org?.short_name ??
    model?.product_family?.brand_org?.name ??
    "SpecHub"
  );
}

function modelCategory(model?: DeviceModelSummary) {
  return model?.product_family?.device_category?.name ?? "Device";
}
