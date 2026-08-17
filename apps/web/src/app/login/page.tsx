"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, LogIn } from "lucide-react";
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
    <div className="app-page mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-md place-items-center px-4 py-8 sm:px-6">
      <form onSubmit={submit} className="app-panel w-full p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">
            <LogIn size={18} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-950">Đăng nhập</h1>
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
              className="form-control"
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
              className="form-control"
            />
          </label>
        </div>
        <button
          disabled={mutation.isPending}
          className="app-button-primary mt-5 w-full"
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
