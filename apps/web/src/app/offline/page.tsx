import Link from "next/link";
import { CloudOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-4 py-8 sm:px-6">
      <section className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid h-11 w-11 place-items-center rounded-md bg-slate-100 text-slate-700">
          <CloudOff size={20} />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-slate-950">
          Bạn đang ngoại tuyến
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Các trang đã mở trước đó vẫn khả dụng khi được lưu đệm. Hãy kết nối
          lại để tải danh mục, tài khoản và dữ liệu thanh toán mới nhất.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          <RefreshCw size={16} />
          Thử lại
        </Link>
      </section>
    </div>
  );
}
