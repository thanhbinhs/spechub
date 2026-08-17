"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { DeviceMediaAsset } from "@spechub/api-client";
import { ImageIcon, Images, Play } from "lucide-react";
import { DeviceArtwork } from "@/components/device-artwork";
import { renderableMediaUrl, youtubeEmbedUrl } from "@/lib/media-url";

type DeviceMediaGalleryProps = {
  media?: DeviceMediaAsset[];
  fallback: {
    brand: string;
    name: string;
    category: string;
    imageUrl?: string | null;
    accent?: string | null;
  };
};

export function DeviceMediaGallery({
  media = [],
  fallback,
}: DeviceMediaGalleryProps) {
  const availableMedia = useMemo(
    () =>
      media.flatMap((item) => {
        const url = renderableMediaUrl(item.url, item.asset_type);
        return url ? [{ ...item, url }] : [];
      }),
    [media],
  );
  const [activeId, setActiveId] = useState(
    availableMedia.find((item) => item.is_primary)?.id ??
      availableMedia[0]?.id ??
      "",
  );
  const active =
    availableMedia.find((item) => item.id === activeId) ?? availableMedia[0];
  const imageCount = availableMedia.filter(
    (item) => item.asset_type === "image",
  ).length;
  const videoCount = availableMedia.filter(
    (item) => item.asset_type === "video",
  ).length;
  const activeYoutubeUrl =
    active?.asset_type === "video" ? youtubeEmbedUrl(active.url) : null;

  if (!active) {
    return (
      <DeviceArtwork
        hero
        brand={fallback.brand}
        name={fallback.name}
        category={fallback.category}
        imageUrl={fallback.imageUrl}
        accent={fallback.accent}
        className="min-h-[340px] sm:min-h-[400px] lg:min-h-[460px]"
      />
    );
  }

  return (
    <section
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      aria-label={`Ảnh và video của ${fallback.name}`}
    >
      <div className="relative min-h-[340px] bg-gradient-to-br from-slate-50 via-white to-blue-50 sm:min-h-[400px] lg:min-h-[460px]">
        {activeYoutubeUrl ? (
          <iframe
            key={active.id}
            src={activeYoutubeUrl}
            title={
              active.alt_text || active.caption || `Video ${fallback.name}`
            }
            className="absolute inset-0 h-full w-full bg-slate-950"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : active.asset_type === "video" ? (
          <video
            key={active.id}
            src={active.url}
            controls
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full bg-slate-950 object-contain"
            aria-label={
              active.alt_text || active.caption || `Video ${fallback.name}`
            }
          />
        ) : (
          <Image
            key={active.id}
            src={active.url}
            alt={active.alt_text || `Hình ảnh ${fallback.name}`}
            fill
            priority
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-contain p-5 pb-10 sm:p-8 sm:pb-12"
          />
        )}

        <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur">
            {fallback.brand}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur">
            {active.asset_type === "video" ? (
              <Play size={12} className="text-blue-600" />
            ) : (
              <ImageIcon size={12} className="text-blue-600" />
            )}
            {active.asset_type === "video" ? "Video" : "Hình ảnh"}
          </span>
        </div>

        {active.caption ? (
          <p className="absolute inset-x-4 bottom-4 z-10 rounded-lg bg-slate-950/75 px-3 py-2 text-xs leading-5 text-white backdrop-blur">
            {active.caption}
          </p>
        ) : null}
      </div>

      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Images size={14} className="text-blue-600" />
            Thư viện media
          </span>
          <span className="text-[11px] text-slate-500">
            {imageCount} ảnh · {videoCount} video
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {availableMedia.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveId(item.id)}
              aria-pressed={item.id === active.id}
              aria-label={`${item.asset_type === "video" ? "Mở video" : "Mở ảnh"} ${index + 1}`}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 bg-slate-100 transition ${
                item.id === active.id
                  ? "border-blue-600 shadow-sm"
                  : "border-transparent hover:border-slate-300"
              }`}
            >
              {item.asset_type === "video" ? (
                <span className="grid h-full place-items-center bg-slate-900 text-white">
                  <span className="grid size-8 place-items-center rounded-full bg-white/15">
                    <Play size={15} fill="currentColor" />
                  </span>
                </span>
              ) : (
                <Image
                  src={item.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-contain p-1"
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
