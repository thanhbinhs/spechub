"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell, CreditCard, Heart, ShoppingBag } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";

export function EngagementDashboard() {
  const { tokens } = useAuth();
  const accessToken = tokens?.access_token;

  const wishlists = useQuery({
    queryKey: ["wishlists"],
    queryFn: () =>
      api.listWishlists(accessToken!).then((result) => result.data),
    enabled: Boolean(accessToken),
  });
  const alerts = useQuery({
    queryKey: ["alerts"],
    queryFn: () =>
      api.listPriceAlerts(accessToken!).then((result) => result.data),
    enabled: Boolean(accessToken),
  });
  const notifications = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () =>
      api
        .getUnreadNotificationCount(accessToken!)
        .then((result) => result.data),
    enabled: Boolean(accessToken),
  });
  const subscription = useQuery({
    queryKey: ["subscriptions", "me"],
    queryFn: () =>
      api.getMySubscription(accessToken!).then((result) => result.data),
    enabled: Boolean(accessToken),
  });

  const wishlistCount =
    wishlists.data?.reduce(
      (sum, wishlist) => sum + (wishlist._count?.items ?? 0),
      0,
    ) ?? 0;
  const activeAlerts =
    alerts.data?.filter((alert) => alert.is_active).length ?? 0;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <DashboardTile
        href="/wishlist"
        icon={<Heart size={18} />}
        label="Thiết bị đã lưu"
        value={String(wishlistCount)}
        detail={`${wishlists.data?.length ?? 0} danh sách`}
      />
      <DashboardTile
        href="/alerts"
        icon={<ShoppingBag size={18} />}
        label="Cảnh báo đang bật"
        value={String(activeAlerts)}
        detail="Theo dõi giá thủ công"
      />
      <DashboardTile
        href="/notifications"
        icon={<Bell size={18} />}
        label="Chưa đọc"
        value={String(notifications.data?.count ?? 0)}
        detail="Thông báo trong ứng dụng"
      />
      <DashboardTile
        href="/billing"
        icon={<CreditCard size={18} />}
        label="Gói dịch vụ"
        value={subscription.data?.plan.name ?? "Miễn phí"}
        detail="Tính năng gói đăng ký"
      />
    </section>
  );
}

function DashboardTile({
  href,
  icon,
  label,
  value,
  detail,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-blue-50 text-blue-700">
          {icon}
        </div>
        <span className="text-xs font-medium text-slate-500">{detail}</span>
      </div>
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-1 truncate text-2xl font-semibold text-slate-950">
        {value}
      </div>
    </Link>
  );
}
