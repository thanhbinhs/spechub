"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Bell,
  BrainCircuit,
  BookOpen,
  CreditCard,
  Gauge,
  GitCompareArrows,
  Heart,
  KeyRound,
  LogIn,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Smartphone,
  UserRound,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/components/auth-provider";
import { CommandBar } from "@/components/command-bar";
import { PwaClient } from "@/components/pwa-client";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};

const catalogNav: NavItem[] = [
  { href: "/devices", label: "Thiết bị", icon: Smartphone },
  { href: "/search", label: "Tìm kiếm", icon: Search },
  { href: "/compare", label: "So sánh", icon: GitCompareArrows },
];

const researchNav: NavItem[] = [
  { href: "/ai", label: "Nghiên cứu AI", icon: BrainCircuit },
  { href: "/wiki", label: "Wiki", icon: BookOpen },
  { href: "/alerts", label: "Cảnh báo giá", icon: Bell },
];

const accountNav: NavItem[] = [
  { href: "/dashboard", label: "Tổng quan", icon: Gauge },
  { href: "/wishlist", label: "Thiết bị đã lưu", icon: Heart },
  { href: "/api-access", label: "API B2B", icon: KeyRound },
  { href: "/billing", label: "Thanh toán", icon: CreditCard },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const panel = drawerRef.current;
    const focusable = panel?.querySelector<HTMLElement>(
      'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const frame = window.requestAnimationFrame(() => focusable?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        return;
      }

      if (event.key !== "Tab" || !panel) return;
      const elements = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("disabled"));
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [isMenuOpen]);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-background text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-68 flex-col border-r border-slate-200/80 bg-white px-4 py-5 lg:flex">
        <BrandLink />

        <nav
          className="mt-8 min-h-0 flex-1 space-y-7 overflow-y-auto pr-1"
          aria-label="Điều hướng chính"
        >
          <NavSection label="Danh mục" items={catalogNav} pathname={pathname} />
          <NavSection
            label="Nghiên cứu"
            items={researchNav}
            pathname={pathname}
          />
          <NavSection
            label="Không gian làm việc"
            items={accountNav}
            pathname={pathname}
          />
          {user?.role === "admin" || user?.role === "editor" ? (
            <NavSection
              label="Quản lý"
              items={[{ href: "/admin", label: "Quản trị", icon: ShieldCheck }]}
              pathname={pathname}
            />
          ) : null}
        </nav>

        <AccountPanel user={user} isLoading={isLoading} onSignOut={signOut} />
      </aside>

      <div className="min-h-screen lg:pl-68">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex min-h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:hidden"
              aria-label="Mở điều hướng"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
            >
              <Menu size={19} />
            </button>

            <div className="hidden min-w-0 max-w-xl flex-1 md:block">
              <CommandBar compact />
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <PwaClient />
              <Link
                href="/notifications"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                aria-label="Mở thông báo"
              >
                <Bell size={17} />
              </Link>
              {user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-slate-950 sm:px-3"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-50 text-blue-700">
                    <UserRound size={14} />
                  </span>
                  <span className="hidden max-w-32 truncate sm:inline">
                    {user.display_name ?? user.username ?? user.email}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  <LogIn size={16} />
                  <span className="hidden sm:inline">
                    {isLoading ? "Tài khoản" : "Đăng nhập"}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="page-enter pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-md backdrop-blur lg:hidden"
        aria-label="Điều hướng trên di động"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {catalogNav.map((item) => (
            <MobileNavLink key={item.href} item={item} pathname={pathname} />
          ))}
          <MobileNavLink item={researchNav[0]} pathname={pathname} />
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="flex h-12 flex-col items-center justify-center gap-1 rounded-md text-xs font-medium text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
            aria-label="Mở thêm lựa chọn điều hướng"
          >
            <Menu size={17} />
            Thêm
          </button>
        </div>
      </nav>

      {isMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-slate-950/35 backdrop-blur-sm"
            aria-label="Đóng điều hướng"
            onClick={closeMenu}
          />
          <aside
            id="mobile-navigation"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Điều hướng"
            className="glass-panel relative flex h-full w-[min(20rem,calc(100vw-2rem))] flex-col border-r border-slate-200 p-4 shadow-lg"
          >
            <div className="flex items-center justify-between gap-4">
              <BrandLink onNavigate={closeMenu} />
              <button
                type="button"
                onClick={closeMenu}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                aria-label="Đóng điều hướng"
              >
                <X size={18} />
              </button>
            </div>

            <nav
              className="mt-8 min-h-0 flex-1 space-y-7 overflow-y-auto"
              aria-label="Liên kết điều hướng trên di động"
            >
              <NavSection
                label="Danh mục"
                items={catalogNav}
                pathname={pathname}
                onNavigate={closeMenu}
              />
              <NavSection
                label="Nghiên cứu"
                items={researchNav}
                pathname={pathname}
                onNavigate={closeMenu}
              />
              <NavSection
                label="Không gian làm việc"
                items={accountNav}
                pathname={pathname}
                onNavigate={closeMenu}
              />
              {user?.role === "admin" || user?.role === "editor" ? (
                <NavSection
                  label="Quản lý"
                  items={[
                    { href: "/admin", label: "Quản trị", icon: ShieldCheck },
                  ]}
                  pathname={pathname}
                  onNavigate={closeMenu}
                />
              ) : null}
            </nav>

            <AccountPanel
              user={user}
              isLoading={isLoading}
              onSignOut={() => {
                signOut();
                closeMenu();
              }}
              onNavigate={closeMenu}
            />
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function BrandLink({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-md focus-visible:outline-offset-4"
    >
      <img src="/logo.png" alt="SpecHub" className="h-8 w-8" />
      <span className="leading-tight">
        <span className="block text-base font-semibold tracking-tight text-slate-950">
          SpecHub
        </span>
      </span>
    </Link>
  );
}

function NavSection({
  label,
  items,
  pathname,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <section>
      <h2 className="mb-2 px-3 text-xs font-semibold text-slate-500">
        {label}
      </h2>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={clsx(
                "flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              )}
            >
              <Icon
                size={18}
                className={active ? "text-blue-600" : "text-slate-500"}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function AccountPanel({
  user,
  isLoading,
  onSignOut,
  onNavigate,
}: {
  user: ReturnType<typeof useAuth>["user"];
  isLoading: boolean;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  if (!user) {
    return (
      <Link
        href="/login"
        onClick={onNavigate}
        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-surface-soft p-3 transition hover:border-blue-200"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-blue-700 shadow-sm">
            <UserRound size={17} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-950">
              {isLoading
                ? "Đang tải tài khoản"
                : "Đăng nhập vào không gian làm việc"}
            </span>
            <span className="block truncate text-xs text-slate-500">
              Nghiên cứu đã lưu và cảnh báo
            </span>
          </span>
        </span>
        <LogIn size={17} className="shrink-0 text-slate-500" />
      </Link>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-surface-soft p-3">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex min-w-0 items-center gap-3 rounded-md"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700">
          <UserRound size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-950">
            {user.display_name ?? user.username ?? "Người dùng SpecHub"}
          </span>
          <span className="block truncate text-xs text-slate-500">
            {user.email}
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={onSignOut}
        className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
      >
        <LogOut size={15} />
        Đăng xuất
      </button>
    </div>
  );
}

function MobileNavLink({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  const Icon = item.icon;
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      className={clsx(
        "flex h-12 flex-col items-center justify-center gap-1 rounded-md text-xs font-medium transition",
        active
          ? "bg-blue-50 text-blue-700"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-950",
      )}
    >
      <Icon size={17} />
      <span className="max-w-full truncate px-1">
        {item.label === "Nghiên cứu AI" ? "AI" : item.label}
      </span>
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
