"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CreditCard,
  GitCompareArrows,
  Heart,
  LogOut,
  MessageCircle,
  Search,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { EngagementDashboard } from "@/components/engagement-dashboard";
import { LoadingPanel } from "@/components/loading-panel";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/auth-provider";

const quickActions = [
  {
    href: "/devices",
    label: "Xem thiết bị",
    icon: Smartphone,
  },
  {
    href: "/compare",
    label: "So sánh",
    icon: GitCompareArrows,
  },
  {
    href: "/ai",
    label: "Hỏi AI",
    icon: MessageCircle,
  },
  {
    href: "/search",
    label: "Tìm thiết bị",
    icon: Search,
  },
  {
    href: "/wishlist",
    label: "Bộ sưu tập",
    icon: Heart,
  },
  {
    href: "/alerts",
    label: "Theo dõi giá",
    icon: Bell,
  },
  {
    href: "/billing",
    label: "Gói của bạn",
    icon: CreditCard,
  },
];

export default function DashboardPage() {
  const { user, tokens, isLoading, signOut } = useAuth();

  if (isLoading) return <LoadingPanel label="Đang tải tài khoản" />;

  if (!user) {
    return (
      <div className="app-page mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          icon={<UserRound size={20} />}
          title="Đăng nhập để mở trang tổng quan"
          action={
            <Link
              href="/login"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Đăng nhập
              <ArrowRight size={16} />
            </Link>
          }
        />
      </div>
    );
  }

  const roleAwareActions = [
    ...quickActions,
    ...(user.role === "admin" || user.role === "editor"
      ? [
          {
            href: "/admin",
            label: "Quản trị",
            icon: ShieldCheck,
          },
        ]
      : []),
  ];

  return (
    <div className="app-page mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader
        title={`Xin chào, ${user.display_name ?? user.username ?? user.email}`}
        action={
          <button
            onClick={signOut}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        }
      />

      <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="app-panel p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-slate-950 text-white">
              <UserRound size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-slate-950">
                {user.display_name ?? user.username ?? "Người dùng SpecHub"}
              </h2>
              <p className="truncate text-sm text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <AccountRow label="Vai trò" value={roleLabel(user.role)} />
            <AccountRow
              label="Tên người dùng"
              value={user.username ?? "Chưa thiết lập"}
            />
            <AccountRow
              label="Phiên đăng nhập"
              value={
                tokens?.access_token ? "Đang hoạt động" : "Thiếu mã truy cập"
              }
            />
          </div>
        </aside>

        <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:grid-cols-2">
          {roleAwareActions.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group border-b border-slate-200 p-5 transition hover:bg-blue-50/50 md:border-r md:[&:nth-child(2n)]:border-r-0"
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
              </Link>
            );
          })}
        </div>
      </section>

      <EngagementDashboard />

      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
            <ShieldCheck size={17} />
            Trạng thái xác thực
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Đăng nhập, đăng ký, lưu mã truy cập và tải `/auth/me` đã được kết
            nối. Quản trị viên và biên tập viên có thể mở không gian vận hành
            trực tiếp từ đây.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-950">
            <Bell size={17} />
            Tương tác người dùng
          </div>
          <p className="text-sm leading-6 text-slate-600">
            Danh sách yêu thích, cảnh báo giá, thông báo trong ứng dụng, liên
            kết mua hàng và thông tin gói đăng ký đã kết nối với API có xác
            thực.
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

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    reader: "Người xem",
    contributor: "Cộng tác viên",
    editor: "Biên tập viên",
    moderator: "Kiểm duyệt viên",
    admin: "Quản trị viên",
  };
  return labels[role] ?? role;
}
