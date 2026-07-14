"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BrainCircuit,
  CreditCard,
  GitCompareArrows,
  Heart,
  LogOut,
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
    label: "Xem danh mục",
    description: "Xem các bản ghi mẫu máy và đi đến trang tra cứu chi tiết.",
    icon: Smartphone,
  },
  {
    href: "/compare",
    label: "Tạo so sánh",
    description: "Chọn phiên bản và xem các khác biệt song song.",
    icon: GitCompareArrows,
  },
  {
    href: "/ai",
    label: "Hỏi AI",
    description: "Đặt câu hỏi về danh mục đã lập chỉ mục, kèm trích dẫn.",
    icon: BrainCircuit,
  },
  {
    href: "/search",
    label: "Tìm kiếm",
    description: "Tìm theo từ khóa trên thiết bị và thông số có sẵn.",
    icon: Search,
  },
  {
    href: "/wishlist",
    label: "Thiết bị đã lưu",
    description: "Xem lại các phiên bản đã lưu trong danh sách yêu thích.",
    icon: Heart,
  },
  {
    href: "/alerts",
    label: "Cảnh báo giá",
    description: "Theo dõi mức giá mục tiêu cho các phiên bản có thể mua.",
    icon: Bell,
  },
  {
    href: "/billing",
    label: "Thanh toán",
    description: "Xem gói hiện tại và các giới hạn tính năng.",
    icon: CreditCard,
  },
];

export default function DashboardPage() {
  const { user, tokens, isLoading, signOut } = useAuth();

  if (isLoading) return <LoadingPanel label="Đang tải tài khoản" />;

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyState
          icon={<UserRound size={20} />}
          title="Đăng nhập để mở trang tổng quan"
          description="Trang tổng quan kết nối danh mục, so sánh và nghiên cứu AI trong luồng tài khoản."
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
            label: "Không gian quản trị",
            description: "Quản lý danh mục, đối tác bán lẻ và hàng đợi duyệt.",
            icon: ShieldCheck,
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Tổng quan"
        title={`Chào mừng, ${user.display_name ?? user.username ?? user.email}`}
        description="Không gian gọn gàng để xem trạng thái tài khoản, điều hướng nhanh và truy cập nghiên cứu đã lưu."
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
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
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

        <div className="grid gap-5 md:grid-cols-2">
          {roleAwareActions.map((item) => {
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
