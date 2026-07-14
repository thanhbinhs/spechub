"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Heart, Trash2, UserRound } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LoadingPanel } from "@/components/loading-panel";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export default function WishlistPage() {
  const { user, tokens, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const accessToken = tokens?.access_token;
  const wishlists = useQuery({
    queryKey: ["wishlists"],
    queryFn: () =>
      api.listWishlists(accessToken!).then((result) => result.data),
    enabled: Boolean(accessToken),
  });
  const removeItem = useMutation({
    mutationFn: ({
      wishlistId,
      itemId,
    }: {
      wishlistId: string;
      itemId: string;
    }) => api.deleteWishlistItem(wishlistId, itemId, accessToken!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlists"] }),
  });

  if (isLoading) return <LoadingPanel label="Đang tải danh sách yêu thích" />;
  if (!user) {
    return (
      <AuthRequired
        title="Đăng nhập để xem thiết bị đã lưu"
        description="Danh sách yêu thích được gắn với tài khoản SpecHub của bạn."
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Yêu thích"
        title="Thiết bị đã lưu"
        description="Các phiên bản được lưu từ trang chi tiết thiết bị sẽ xuất hiện ở đây để so sánh sau."
      />

      {wishlists.isLoading ? (
        <LoadingPanel label="Đang tải thiết bị đã lưu" />
      ) : null}
      {wishlists.data?.length ? (
        <div className="space-y-5">
          {wishlists.data.map((wishlist) => (
            <section
              key={wishlist.id}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-100 p-4">
                <h2 className="text-base font-semibold text-slate-950">
                  {wishlist.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {wishlist._count?.items ?? wishlist.items?.length ?? 0} phiên
                  bản đã lưu
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {wishlist.items?.length ? (
                  wishlist.items.map((item) => {
                    const variant = item.device_variant;
                    const model = variant?.device_model;
                    return (
                      <div
                        key={item.id}
                        className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_150px_auto] md:items-center"
                      >
                        <div className="min-w-0">
                          <Link
                            href={
                              model?.slug
                                ? `/devices/${model.slug}`
                                : "/devices"
                            }
                            className="font-semibold text-slate-950 hover:text-blue-700"
                          >
                            {model?.name ?? "Thiết bị"}
                          </Link>
                          <p className="mt-1 text-sm text-slate-500">
                            {variant?.variant_name ?? item.device_variant_id}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-slate-950">
                          {formatPrice(
                            variant?.launch_price,
                            variant?.currency,
                          )}
                        </div>
                        <button
                          onClick={() =>
                            removeItem.mutate({
                              wishlistId: wishlist.id,
                              itemId: item.id,
                            })
                          }
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:text-red-700"
                        >
                          <Trash2 size={15} />
                          Xóa
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-5 text-sm text-slate-500">
                    Chưa có phiên bản nào được lưu.
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      ) : !wishlists.isLoading ? (
        <EmptyState
          icon={<Heart size={20} />}
          title="Chưa có thiết bị nào được lưu"
          description="Mở trang chi tiết thiết bị và lưu phiên bản mặc định của nó."
          action={
            <Link
              href="/devices"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Xem thiết bị
              <ArrowRight size={16} />
            </Link>
          }
        />
      ) : null}
    </div>
  );
}

function AuthRequired({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <EmptyState
        icon={<UserRound size={20} />}
        title={title}
        description={description}
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
