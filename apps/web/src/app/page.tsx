import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  GitCompareArrows,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { CommandBar } from "@/components/command-bar";
import { DeviceCard } from "@/components/device-card";
import { api, categoryTreeData } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [models, categoryResult, variants, wiki] = await Promise.all([
    api.listDeviceModels({
      pageSize: 6,
      sortBy: "updated_at",
      sortOrder: "desc",
    }),
    api.getDeviceCategoryTree(),
    api.listDeviceVariants({ pageSize: 2, default_only: true }),
    api.listWikiArticles({ pageSize: 3, sort: "updated" }).catch(() => null),
  ]);
  const categories = categoryTreeData(categoryResult);
  const compareIds = variants.data.map((variant) => variant.id).join(",");

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="grid gap-8 border-b border-slate-200 pb-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            Cơ sở dữ liệu thiết bị mở
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.035em] text-slate-950 sm:text-5xl">
            Hiểu thiết bị trước khi chọn mua.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Tra cứu thông số, so sánh hiệu năng theo bằng chứng và kiểm tra giá
            từ nhiều nơi bán trong một giao diện gọn, dễ đọc.
          </p>
          <div className="mt-7 max-w-2xl">
            <CommandBar />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-l border-slate-200 pl-6">
          <Stat
            value={models.meta.total.toLocaleString("vi")}
            label="mẫu thiết bị"
          />
          <Stat value={String(categories.length)} label="danh mục" />
          <Stat value="2–4" label="thiết bị / so sánh" />
          <Stat value="Có nguồn" label="dữ liệu kiểm chứng" />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <QuickLink
          href="/devices"
          icon={<Search size={19} />}
          title="Tìm thiết bị"
          text="Lọc theo hãng, danh mục và tên sản phẩm."
        />
        <QuickLink
          href={compareIds ? `/compare?ids=${compareIds}` : "/compare"}
          icon={<GitCompareArrows size={19} />}
          title="So sánh rõ ràng"
          text="Xem điểm mạnh, điểm yếu và thiết bị tốt hơn theo từng tiêu chí."
        />
        <QuickLink
          href="/wiki"
          icon={<BookOpen size={19} />}
          title="Đọc và đóng góp Wiki"
          text="Kiến thức cộng đồng có lịch sử sửa đổi và kiểm duyệt."
        />
      </section>

      <section>
        <SectionHeading
          eyebrow="Danh mục mới cập nhật"
          title="Thiết bị nổi bật"
          href="/devices"
          linkLabel="Xem tất cả"
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {models.data.map((model) => (
            <DeviceCard key={model.id} model={model} />
          ))}
        </div>
      </section>

      <section className="grid gap-8 border-y border-slate-200 py-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Bắt đầu từ loại thiết bị
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Duyệt danh mục
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Đi thẳng vào nhóm sản phẩm bạn đang quan tâm.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {categories.slice(0, 9).map((category) => (
            <Link
              key={category.id}
              href={`/devices?category_slug=${category.slug}`}
              className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-blue-300"
            >
              {category.name}
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
            eyebrow="Cộng đồng biên tập"
            title="Mới trên Wiki"
            href="/wiki"
            linkLabel="Mở Wiki"
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
                  {article.language.name} · {article.reading_time_minutes} phút
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

      <section className="flex flex-col gap-4 rounded-xl bg-slate-950 px-6 py-7 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles size={16} /> Cần câu trả lời theo ngữ cảnh?
          </div>
          <p className="mt-1 text-sm text-slate-300">
            Hỏi AI trên dữ liệu danh mục và xem nguồn đi kèm.
          </p>
        </div>
        <Link
          href="/ai"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950"
        >
          Mở trợ lý <ArrowRight size={15} />
        </Link>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold text-slate-950">{value}</div>
      <div className="mt-0.5 text-xs text-slate-500">{label}</div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  text,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="group flex gap-4 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
        {icon}
      </span>
      <span>
        <strong className="flex items-center gap-2 text-sm text-slate-950">
          {title}
          <ArrowRight
            size={14}
            className="text-slate-400 transition group-hover:translate-x-0.5"
          />
        </strong>
        <span className="mt-1 block text-sm leading-6 text-slate-600">
          {text}
        </span>
      </span>
    </Link>
  );
}

function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-950">{title}</h2>
      </div>
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
