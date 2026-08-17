import Link from "next/link";
import { ArrowRight, BookOpen, Home, Search, Smartphone } from "lucide-react";

const suggestions = [
  {
    href: "/devices",
    label: "Danh mục thiết bị",
    description: "Duyệt mẫu máy, phiên bản và linh kiện.",
    icon: Smartphone,
  },
  {
    href: "/search",
    label: "Tìm kiếm",
    description: "Tìm theo tên máy, hãng hoặc chipset.",
    icon: Search,
  },
  {
    href: "/wiki",
    label: "Wiki",
    description: "Đọc hướng dẫn và kiến thức công nghệ.",
    icon: BookOpen,
  },
];

export default function NotFoundPage() {
  return (
    <div className="app-page mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-6 border-b border-slate-200 bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">
              Lỗi 404
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Không tìm thấy trang này
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Liên kết có thể đã thay đổi hoặc nội dung đã được chuyển sang một
              địa chỉ mới.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-blue-50"
          >
            <Home size={16} />
            Về trang chủ
          </Link>
        </div>

        <div className="grid gap-px bg-slate-200 sm:grid-cols-3">
          {suggestions.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex min-w-0 items-start gap-3 bg-white p-5 transition hover:bg-blue-50/60"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700 transition group-hover:bg-white group-hover:text-blue-700">
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <strong className="flex items-center gap-1.5 text-sm text-slate-950">
                    {item.label}
                    <ArrowRight
                      size={14}
                      className="transition group-hover:translate-x-0.5"
                    />
                  </strong>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
