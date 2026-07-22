import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WikiEditor } from "@/components/wiki-editor";

export default function NewWikiArticlePage() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/wiki"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700"
      >
        <ArrowLeft size={15} />
        Quay lại Wiki
      </Link>
      <div className="mb-6 mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          Đóng góp cộng đồng
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950 sm:text-3xl">
          Tạo bài viết mới
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Soạn bài giới thiệu, hướng dẫn hoặc chia sẻ trải nghiệm. Mọi bài viết
          được kiểm tra nguồn và chất lượng trước khi xuất bản.
        </p>
      </div>
      <WikiEditor />
    </div>
  );
}
