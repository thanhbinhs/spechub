"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Bell, CheckCheck, UserRound } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LoadingPanel } from "@/components/loading-panel";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";

export default function NotificationsPage() {
  const { user, tokens, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = tokens?.access_token;
  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      api
        .listNotifications({ pageSize: 50 }, accessToken!)
        .then((result) => result.data),
    enabled: Boolean(accessToken),
  });
  const markRead = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id, accessToken!),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAll = useMutation({
    mutationFn: () => api.markAllNotificationsRead(accessToken!),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (isLoading) return <LoadingPanel label="Đang tải thông báo" />;
  if (!user) {
    return <AuthRequired title="Đăng nhập để xem thông báo" />;
  }

  return (
    <div className="app-page mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <PageHeader
        title="Thông báo"
        action={
          <button
            onClick={() => markAll.mutate()}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-blue-300"
          >
            <CheckCheck size={16} />
            Đánh dấu đã đọc tất cả
          </button>
        }
      />

      <section className="app-panel overflow-hidden">
        {notifications.isLoading ? (
          <LoadingPanel label="Đang tải thông báo" />
        ) : null}
        {notifications.data?.length ? (
          <div className="divide-y divide-slate-100">
            {notifications.data.map((notification) => (
              <div
                key={notification.id}
                className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_120px_auto] md:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {!notification.read_at ? (
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                    ) : null}
                    <h2 className="truncate font-semibold text-slate-950">
                      {notification.title}
                    </h2>
                  </div>
                  {notification.body ? (
                    <p className="mt-1 text-sm text-slate-500">
                      {notification.body}
                    </p>
                  ) : null}
                </div>
                <div className="text-sm text-slate-500">
                  {formatDate(notification.created_at)}
                </div>
                <button
                  disabled={Boolean(notification.read_at)}
                  onClick={() => markRead.mutate(notification.id)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:border-blue-300 disabled:opacity-50"
                >
                  <CheckCheck size={15} />
                  Đã đọc
                </button>
              </div>
            ))}
          </div>
        ) : !notifications.isLoading ? (
          <div className="p-5">
            <EmptyState icon={<Bell size={20} />} title="Chưa có thông báo" />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function AuthRequired({ title }: { title: string }) {
  return (
    <div className="app-page mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <EmptyState
        icon={<UserRound size={20} />}
        title={title}
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
