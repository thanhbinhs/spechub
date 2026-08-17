"use client";

import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const apiUnavailable =
    error.message.includes("API SpecHub") ||
    error.message.includes("SpecHub API") ||
    error.message.includes("fetch failed");

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-3xl place-items-center px-4 py-12 sm:px-6">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-700">
          <AlertTriangle size={23} />
        </span>
        <p className="app-section-label mt-5">
          {apiUnavailable ? "Kết nối tạm gián đoạn" : "Có lỗi khi tải trang"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          {apiUnavailable
            ? "SpecHub chưa lấy được dữ liệu."
            : "Trang này chưa thể hiển thị."}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
          {apiUnavailable
            ? "Dịch vụ dữ liệu có thể vẫn đang khởi động. Hãy đợi vài giây rồi thử lại; lựa chọn và bộ lọc của bạn vẫn được giữ nguyên."
            : "Hãy thử tải lại trang. Nếu lỗi vẫn còn, bạn có thể quay về trang chủ và tiếp tục từ đó."}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <RefreshCw size={16} />
            Thử tải lại
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
          >
            <Home size={16} />
            Về trang chủ
          </Link>
        </div>
      </section>
    </div>
  );
}
