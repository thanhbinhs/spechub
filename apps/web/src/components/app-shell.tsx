"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowUp,
  BadgeDollarSign,
  Bell,
  BookmarkCheck,
  BotMessageSquare,
  Braces,
  LayoutDashboard,
  Library,
  LogIn,
  LogOut,
  Menu,
  Search,
  Scale,
  TabletSmartphone,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/components/auth-provider";
import { CommandBar } from "@/components/command-bar";
import { PwaClient } from "@/components/pwa-client";
import { CompareDock } from "@/components/research-workspace";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  tone?: string;
};

const primaryNav: NavItem[] = [
  {
    href: "/devices",
    label: "Thiết bị",
    icon: TabletSmartphone,
    tone: "bg-sky-50 text-sky-700",
  },
  {
    href: "/compare",
    label: "So sánh",
    icon: Scale,
    tone: "bg-violet-50 text-violet-700",
  },
  {
    href: "/recommend",
    label: "Chọn máy",
    icon: WandSparkles,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    href: "/ai",
    label: "Hỏi AI",
    icon: BotMessageSquare,
    tone: "bg-fuchsia-50 text-fuchsia-700",
  },
  {
    href: "/wiki",
    label: "Bài viết",
    icon: Library,
    tone: "bg-emerald-50 text-emerald-700",
  },
];

const accountNav: NavItem[] = [
  {
    href: "/wishlist",
    label: "Bộ sưu tập",
    icon: BookmarkCheck,
    tone: "bg-rose-50 text-rose-700",
  },
  {
    href: "/alerts",
    label: "Theo dõi giá",
    icon: BadgeDollarSign,
    tone: "bg-orange-50 text-orange-700",
  },
  {
    href: "/api-access",
    label: "API cho đội nhóm",
    icon: Braces,
    tone: "bg-slate-100 text-slate-700",
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const sectionLabel = currentSectionLabel(pathname);
  const visibleAccountNav = user ? accountNav : accountNav.slice(0, 1);

  useEffect(() => {
    function focusGlobalSearch(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;
      const commandShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const slashShortcut = event.key === "/" && !isEditing;
      if (!commandShortcut && !slashShortcut) return;

      const input = document.getElementById("global-command-input");
      if (!(input instanceof HTMLInputElement)) return;
      event.preventDefault();
      input.focus();
      input.select();
    }

    document.addEventListener("keydown", focusGlobalSearch);
    return () => document.removeEventListener("keydown", focusGlobalSearch);
  }, []);

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
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-lg transition focus:translate-y-0"
      >
        Đến nội dung
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-20 flex-col border-r border-slate-200/80 bg-surface-soft px-3 py-5 transition-[width] lg:flex xl:w-64 xl:px-4">
        <BrandLink />

        <nav
          className="mt-6 min-h-0 flex-1 space-y-5 overflow-y-auto pr-0 xl:mt-8 xl:space-y-6 xl:pr-1"
          aria-label="Điều hướng chính"
        >
          <NavSection label="Bắt đầu" items={primaryNav} pathname={pathname} />
          <NavSection
            label="Của bạn"
            items={visibleAccountNav}
            pathname={pathname}
          />
          {user?.role === "admin" || user?.role === "editor" ? (
            <NavSection
              label="Quản lý"
              items={[
                {
                  href: "/admin",
                  label: "Quản trị",
                  icon: LayoutDashboard,
                  tone: "bg-blue-50 text-blue-700",
                },
              ]}
              pathname={pathname}
            />
          ) : null}
        </nav>

        <AccountPanel user={user} isLoading={isLoading} onSignOut={signOut} />
      </aside>

      <div className="min-h-screen transition-[padding] lg:pl-20 xl:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/88 backdrop-blur-xl">
          <div className="mx-auto flex min-h-16 max-w-[1480px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:hidden"
              aria-label="Mở menu"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
            >
              <Menu size={19} />
            </button>

            <div className="min-w-0 flex-1 md:hidden">
              <p className="truncate text-sm font-semibold text-slate-950">
                {sectionLabel}
              </p>
            </div>

            <div className="hidden min-w-0 max-w-xl flex-1 md:block">
              <CommandBar compact />
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              {user ? (
                <Link
                  href="/notifications"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  aria-label="Mở thông báo"
                >
                  <Bell size={17} />
                </Link>
              ) : null}
              <PwaClient />
              {user ? (
                <Link
                  href="/dashboard"
                  aria-label={`Mở tài khoản của ${
                    user.display_name ?? user.username ?? user.email
                  }`}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-slate-950 sm:px-3"
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
                  aria-label="Đăng nhập"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
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

        <main
          id="main-content"
          tabIndex={-1}
          className="page-enter min-h-[calc(100vh-4rem)] pb-[calc(5.5rem+env(safe-area-inset-bottom))] outline-none lg:pb-0"
        >
          <span className="sr-only" aria-live="polite">
            Đã mở {sectionLabel}
          </span>
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-lg backdrop-blur lg:hidden"
        aria-label="Điều hướng trên di động"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          <MobileNavLink
            item={{ href: "/search", label: "Tìm", icon: Search }}
            pathname={pathname}
          />
          <MobileNavLink item={primaryNav[0]} pathname={pathname} />
          <MobileNavLink item={primaryNav[1]} pathname={pathname} />
          <MobileNavLink item={primaryNav[2]} pathname={pathname} />
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="flex h-12 flex-col items-center justify-center gap-1 rounded-md text-xs font-medium text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
            aria-label="Mở thêm lựa chọn"
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
            aria-label="Đóng menu"
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
                aria-label="Đóng menu"
              >
                <X size={18} />
              </button>
            </div>

            <nav
              className="mt-8 min-h-0 flex-1 space-y-7 overflow-y-auto"
              aria-label="Liên kết điều hướng trên di động"
            >
              <NavSection
                label="Bắt đầu"
                items={primaryNav}
                pathname={pathname}
                onNavigate={closeMenu}
              />
              <NavSection
                label="Của bạn"
                items={visibleAccountNav}
                pathname={pathname}
                onNavigate={closeMenu}
              />
              {user?.role === "admin" || user?.role === "editor" ? (
                <NavSection
                  label="Quản lý"
                  items={[
                    {
                      href: "/admin",
                      label: "Quản trị",
                      icon: LayoutDashboard,
                      tone: "bg-blue-50 text-blue-700",
                    },
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

      <CompareDock />
      <ScrollToTop />
    </div>
  );
}

function BrandLink({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="flex items-center justify-start gap-3 rounded-lg focus-visible:outline-offset-4 lg:justify-center xl:justify-start"
    >
      <Image
        src="/logo.png"
        alt="SpecHub"
        width={36}
        height={36}
        className="h-9 w-9 rounded-lg"
      />
      <span className="leading-tight lg:hidden xl:block">
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
      <h2 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 lg:sr-only xl:not-sr-only">
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
              title={item.label}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex min-h-10 items-center justify-start gap-3 rounded-lg px-3 py-2 text-sm font-medium transition lg:justify-center lg:px-2 xl:justify-start xl:px-3",
                active
                  ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-600 hover:bg-white hover:text-slate-950",
              )}
            >
              <span
                className={clsx(
                  "grid size-8 shrink-0 place-items-center rounded-lg transition",
                  active ? "bg-blue-50 text-blue-700" : item.tone,
                )}
              >
                <Icon size={17} />
              </span>
              <span className="truncate lg:sr-only xl:not-sr-only">
                {item.label}
              </span>
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
        title="Đăng nhập"
        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-surface-soft p-3 transition hover:border-blue-200 lg:justify-center lg:p-2 xl:justify-between xl:p-3"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-blue-700 shadow-sm">
            <UserRound size={17} />
          </span>
          <span className="min-w-0 lg:hidden xl:block">
            <span className="block text-sm font-semibold text-slate-950">
              {isLoading ? "Đang tải" : "Đăng nhập"}
            </span>
          </span>
        </span>
        <LogIn
          size={17}
          className="shrink-0 text-slate-500 lg:hidden xl:block"
        />
      </Link>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-surface-soft p-3 lg:p-2 xl:p-3">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        title="Mở tài khoản"
        className="flex min-w-0 items-center justify-start gap-3 rounded-md lg:justify-center xl:justify-start"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700">
          <UserRound size={17} />
        </span>
        <span className="min-w-0 flex-1 lg:hidden xl:block">
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
        title="Đăng xuất"
        className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 lg:px-0 xl:px-3"
      >
        <LogOut size={15} />
        <span className="lg:sr-only xl:not-sr-only">Đăng xuất</span>
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
      <span
        className={clsx(
          "grid size-6 place-items-center rounded-md",
          active ? "bg-blue-100 text-blue-700" : item.tone,
        )}
      >
        <Icon size={15} />
      </span>
      <span className="max-w-full truncate px-1">
        {item.href === "/ai" ? "AI" : item.label}
      </span>
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function currentSectionLabel(pathname: string) {
  if (pathname === "/") return "Trang chủ";
  const routes = [
    ["/devices", "Khám phá thiết bị"],
    ["/compare", "So sánh"],
    ["/recommend", "Chọn máy"],
    ["/search", "Tìm thiết bị"],
    ["/ai", "Hỏi AI"],
    ["/wiki", "Bài viết"],
    ["/wishlist", "Bộ sưu tập"],
    ["/alerts", "Theo dõi giá"],
    ["/notifications", "Thông báo"],
    ["/billing", "Gói dịch vụ"],
    ["/api-access", "API cho đội nhóm"],
    ["/dashboard", "Tài khoản"],
    ["/admin", "Quản trị"],
  ] as const;
  return routes.find(([href]) => isActive(pathname, href))?.[1] ?? "SpecHub";
}

function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      setVisible(window.scrollY > 640);
    }
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-24 right-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700 lg:bottom-6 lg:right-6"
      aria-label="Trở về đầu trang"
      title="Trở về đầu trang"
    >
      <ArrowUp size={17} />
    </button>
  );
}
