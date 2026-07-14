"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw, ServerOff } from "lucide-react";

export default function DevicesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[65vh] w-full max-w-2xl items-center px-4 py-10 sm:px-6">
      <section className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/70 p-6">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200">
            <ServerOff size={22} />
          </span>
          <h1 className="mt-5 text-xl font-semibold text-slate-950">
            Chưa thể tải dữ liệu thiết bị
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            SpecHub chưa kết nối được với dịch vụ dữ liệu. Hãy kiểm tra API đang
            hoạt động rồi thử tải lại trang.
          </p>
        </div>

        <div className="p-6">
          {process.env.NODE_ENV === "development" ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Phát triển local
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Chạy API từ thư mục gốc dự án trong một terminal riêng:
              </p>
              <code className="mt-2 block rounded-md bg-slate-950 px-3 py-2 text-sm text-slate-100">
                pnpm dev:api
              </code>
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <RefreshCw size={16} />
              Thử tải lại
            </button>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-slate-950"
            >
              <ArrowLeft size={16} />
              Về trang chủ
            </Link>
          </div>

          {error.digest ? (
            <p className="mt-4 text-xs text-slate-400">
              Mã tham chiếu: {error.digest}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
