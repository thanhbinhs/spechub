"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import {
  BrainCircuit,
  Gauge,
  GitCompareArrows,
  LogOut,
  Search,
  Smartphone,
  UserRound,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/components/auth-provider";
import { CommandBar } from "@/components/command-bar";

const navItems = [
  { href: "/devices", label: "Devices", icon: Smartphone },
  { href: "/search", label: "Search", icon: Search },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
  { href: "/ai", label: "AI", icon: BrainCircuit },
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, signOut } = useAuth();

  return (
    <div className="min-h-screen text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto grid min-h-16 max-w-7xl gap-3 px-4 py-3 sm:px-6 lg:grid-cols-[220px_minmax(320px,1fr)_auto] lg:items-center lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-slate-950 text-white shadow-sm">
              <Smartphone size={18} />
            </div>
            <div className="leading-tight">
              <div className="font-semibold">SpecHub</div>
              <div className="text-xs text-slate-500">Research OS</div>
            </div>
          </Link>

          <div className="hidden min-w-0 md:block">
            <CommandBar compact />
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <nav className="hidden items-center gap-1 xl:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition",
                      active
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                    )}
                  >
                    <Icon size={17} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="hidden h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-slate-950 sm:inline-flex"
                  >
                    <UserRound size={17} />
                    <span className="max-w-32 truncate">
                      {user.display_name ?? user.username ?? user.email}
                    </span>
                  </Link>
                  <button
                    onClick={signOut}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:text-slate-950"
                    title="Sign out"
                  >
                    <LogOut size={17} />
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-slate-950"
                >
                  <UserRound size={17} />
                  {isLoading ? "Account" : "Sign in"}
                </Link>
              )}
            </div>
          </div>
        </div>

        <nav className="hidden gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:flex xl:hidden">
          <div className="mx-auto flex w-full max-w-7xl gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition",
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                  )}
                >
                  <Icon size={17} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="page-enter pb-20 md:pb-0">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-medium",
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-950",
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
