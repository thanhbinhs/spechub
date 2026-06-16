"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BrainCircuit,
  GitCompareArrows,
  LogOut,
  Search,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LoadingPanel } from "@/components/loading-panel";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/auth-provider";

const quickActions = [
  {
    href: "/devices",
    label: "Browse catalog",
    description: "Scan dense model records and jump into research detail.",
    icon: Smartphone,
  },
  {
    href: "/compare",
    label: "Build comparison",
    description: "Select variants and review differences side by side.",
    icon: GitCompareArrows,
  },
  {
    href: "/ai",
    label: "Ask AI",
    description: "Question the indexed catalog with citations.",
    icon: BrainCircuit,
  },
  {
    href: "/search",
    label: "Search",
    description: "Run keyword search across devices and seeded specs.",
    icon: Search,
  },
];

export default function DashboardPage() {
  const { user, tokens, isLoading, signOut } = useAuth();

  if (isLoading) return <LoadingPanel label="Loading account" />;

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          icon={<UserRound size={20} />}
          title="Sign in to open the dashboard"
          description="The dashboard anchors the MVP account flow and connects catalog, compare, and AI research."
          action={
            <Link
              href="/login"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Sign in
              <ArrowRight size={16} />
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome, ${user.display_name ?? user.username ?? user.email}`}
        description="A compact workspace for account state, quick navigation, and the next MVP hooks for saved research."
        action={
          <button
            onClick={signOut}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            <LogOut size={16} />
            Sign out
          </button>
        }
      />

      <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-slate-950 text-white">
              <UserRound size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-slate-950">
                {user.display_name ?? user.username ?? "SpecHub user"}
              </h2>
              <p className="truncate text-sm text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <AccountRow label="Role" value={user.role} />
            <AccountRow
              label="Username"
              value={user.username ?? "Not configured"}
            />
            <AccountRow
              label="Session"
              value={tokens?.access_token ? "Active" : "Missing token"}
            />
          </div>
        </aside>

        <div className="grid gap-5 md:grid-cols-2">
          {quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700">
                    <Icon size={18} />
                  </div>
                  <ArrowRight
                    size={17}
                    className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-900"
                  />
                </div>
                <h3 className="text-base font-semibold text-slate-950">
                  {item.label}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
            <ShieldCheck size={17} />
            MVP auth status
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Login, registration, token persistence, and `/auth/me` hydration are
            connected. This is ready for saved lists and role-aware admin tools
            in a later phase.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
            <Bell size={17} />
            Coming next
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Wishlist, alerts, and saved comparisons have placeholder ownership
            in the dashboard flow, but are intentionally not blocking the MVP
            frontend.
          </p>
        </div>
      </section>
    </div>
  );
}

function AccountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-slate-100 px-3 py-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="max-w-44 truncate text-right text-sm font-medium capitalize text-slate-950">
        {value}
      </span>
    </div>
  );
}
