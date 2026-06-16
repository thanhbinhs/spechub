"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, UserPlus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [message, setMessage] = useState("");
  const mutation = useMutation({
    mutationFn: (payload: {
      email: string;
      password: string;
      username?: string;
      display_name?: string;
    }) => signUp(payload),
    onSuccess: (response) => {
      setMessage(`Created ${response.user.email}`);
      router.push("/dashboard");
    },
    onError: (error) => {
      setMessage(
        error instanceof Error ? error.message : "Registration failed",
      );
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    mutation.mutate({
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
      username: String(data.get("username") ?? "") || undefined,
      display_name: String(data.get("display_name") ?? "") || undefined,
    });
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_440px] lg:px-8">
      <section className="flex items-center">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase text-blue-700">
            Account
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
            Create a SpecHub account for the MVP workspace.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Registration signs you in immediately so the dashboard can become
            the starting point for saved research, alerts, and role-aware tools.
          </p>
        </div>
      </section>

      <form
        onSubmit={submit}
        className="self-center rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-slate-950 text-white">
            <UserPlus size={18} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Create account
            </h2>
            <div className="text-sm text-slate-500">SpecHub account</div>
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
              className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Username
            </span>
            <input
              name="username"
              className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Display name
            </span>
            <input
              name="display_name"
              className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </span>
            <input
              name="password"
              type="password"
              minLength={8}
              required
              className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-blue-500"
            />
          </label>
        </div>
        <button
          disabled={mutation.isPending}
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {mutation.isPending ? "Creating" : "Create account"}
          <ArrowRight size={16} />
        </button>
        {message ? (
          <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
            {message}
          </div>
        ) : null}
        <Link
          href="/login"
          className="mt-4 block text-center text-sm font-medium text-slate-700 hover:text-slate-950"
        >
          Sign in
        </Link>
      </form>
    </div>
  );
}
