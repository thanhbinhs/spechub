"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, LogIn, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [message, setMessage] = useState("");
  const mutation = useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      signIn(payload),
    onSuccess: (response) => {
      setMessage(`Đã đăng nhập với ${response.user.email}`);
      router.push("/dashboard");
    },
    onError: (error) => {
      setMessage(
        error instanceof Error ? error.message : "Đăng nhập không thành công",
      );
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    mutation.mutate({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    });
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
      <section className="flex items-center">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            <ShieldCheck size={14} />
            Không gian xác thực
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
            Đăng nhập để kết nối không gian tra cứu.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Phiên bản hiện tại giữ quy trình xác thực gọn nhẹ: đăng nhập, kiểm
            tra trạng thái tài khoản rồi chuyển giữa danh mục, so sánh và AI mà
            không mất ngữ cảnh.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {["Danh mục", "So sánh", "AI"].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="text-sm font-semibold text-slate-950">
                  {item}
                </div>
                <div className="mt-1 text-xs leading-5 text-slate-500">
                  Điều hướng theo trạng thái tài khoản.
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <form
        onSubmit={submit}
        className="self-center rounded-xl border border-slate-200 bg-white p-5 shadow-md sm:p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">
            <LogIn size={18} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Đăng nhập</h2>
            <div className="text-sm text-slate-500">Tài khoản SpecHub</div>
          </div>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Mật khẩu
            </span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>
        <button
          disabled={mutation.isPending}
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
        >
          {mutation.isPending ? "Đang đăng nhập" : "Đăng nhập"}
          <ArrowRight size={16} />
        </button>
        {message ? (
          <div
            className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600"
            role="status"
          >
            {message}
          </div>
        ) : null}
        <Link
          href="/register"
          className="mt-4 block text-center text-sm font-medium text-slate-700 hover:text-slate-950"
        >
          Tạo tài khoản
        </Link>
      </form>
    </div>
  );
}
