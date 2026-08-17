"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import { clsx } from "clsx";
import { renderableImageUrl } from "@/lib/media-url";

type DeviceArtworkProps = {
  brand?: string;
  name?: string;
  category?: string;
  imageUrl?: string | null;
  accent?: string | null;
  compact?: boolean;
  hero?: boolean;
  priority?: boolean;
  className?: string;
};

export function DeviceArtwork({
  brand,
  name,
  category,
  imageUrl,
  accent,
  compact,
  hero,
  priority,
  className,
}: DeviceArtworkProps) {
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const initial = brand?.slice(0, 1).toUpperCase() ?? "S";
  const safeAccent =
    accent && /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : "#2563eb";
  const imageSrc = renderableImageUrl(imageUrl) ?? "";
  const showImage = Boolean(imageSrc && failedImageSrc !== imageSrc);
  const isLandscapeImage =
    imageAspectRatio !== null && imageAspectRatio >= 1.35;
  const imageSizes = hero
    ? "(min-width: 1024px) 520px, 100vw"
    : compact
      ? "(min-width: 1024px) 360px, 50vw"
      : "320px";

  return (
    <div
      className={clsx(
        "device-artwork group relative isolate min-w-0 overflow-hidden rounded-xl border border-slate-200/90 bg-surface-muted shadow-sm",
        hero ? "min-h-[360px]" : compact ? "h-36" : "h-60",
        className,
      )}
      style={{ "--device-accent": safeAccent } as CSSProperties}
    >
      <div
        aria-hidden="true"
        className="absolute -right-[18%] -top-[32%] h-[78%] w-[78%] rounded-full opacity-[0.09] blur-3xl"
        style={{ backgroundColor: safeAccent }}
      />
      <div
        aria-hidden="true"
        className={clsx(
          "absolute inset-2 rounded-[10px] border border-white/90 bg-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
          hero && "inset-3 rounded-xl",
        )}
      />
      <div
        aria-hidden="true"
        className={clsx(
          "absolute bottom-[12%] left-1/2 h-5 w-[52%] -translate-x-1/2 rounded-[50%] bg-slate-950/10 blur-xl transition duration-300 group-hover:w-[58%]",
          hero && "bottom-[14%] h-8 w-[58%]",
        )}
      />

      {showImage && isLandscapeImage ? (
        <div
          aria-hidden="true"
          className={clsx(
            "absolute inset-2 overflow-hidden rounded-[10px]",
            hero && "inset-3 rounded-xl",
          )}
        >
          <Image
            src={imageSrc}
            alt=""
            fill
            sizes={imageSizes}
            className="scale-110 object-cover opacity-[0.22] blur-2xl saturate-75"
          />
          <span className="absolute inset-0 bg-white/45 backdrop-saturate-75" />
          <span className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-slate-100/35" />
        </div>
      ) : null}

      {showImage ? (
        <Image
          src={imageSrc}
          alt={`Hình ảnh ${name ?? brand ?? "thiết bị"}`}
          fill
          priority={Boolean(hero || priority)}
          sizes={imageSizes}
          onLoad={({ currentTarget }) => {
            const ratio =
              currentTarget.naturalWidth / currentTarget.naturalHeight;
            setImageAspectRatio(Number.isFinite(ratio) ? ratio : null);
          }}
          onError={() => setFailedImageSrc(imageSrc)}
          className={clsx(
            "z-10 object-contain transition duration-300 ease-out",
            isLandscapeImage
              ? "drop-shadow-[0_12px_18px_rgba(15,23,42,0.1)] group-hover:scale-[1.02]"
              : "drop-shadow-[0_16px_20px_rgba(15,23,42,0.16)] group-hover:scale-[1.035]",
            hero
              ? "p-4 pb-8 sm:p-6 sm:pb-10"
              : compact
                ? "p-2.5 sm:p-3"
                : "p-3.5 pb-5 sm:p-4 sm:pb-6",
          )}
        />
      ) : (
        <FallbackDevice
          category={category}
          initial={initial}
          compact={compact}
          hero={hero}
        />
      )}

      <div
        className={clsx(
          "pointer-events-none absolute inset-x-3 top-3 z-20 flex items-center justify-between gap-3",
          hero && "inset-x-5 top-5",
        )}
      >
        <span className="rounded-full border border-white/90 bg-white/[0.88] px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-md">
          {brand ?? "SpecHub"}
        </span>
        <span className="flex items-center gap-2 rounded-full border border-white/90 bg-white/80 px-2 py-1 shadow-sm backdrop-blur-md">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: safeAccent }}
          />
        </span>
      </div>

      {hero ? (
        <div className="pointer-events-none absolute inset-x-5 bottom-5 z-20 flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/90 bg-white/[0.88] px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm backdrop-blur-md">
            {category ?? "Thiết bị"}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function FallbackDevice({
  category,
  initial,
  compact,
  hero,
}: {
  category?: string;
  initial: string;
  compact?: boolean;
  hero?: boolean;
}) {
  const categoryKey = category?.toLowerCase() ?? "";

  if (categoryKey.includes("laptop")) {
    return (
      <div
        className={clsx(
          "absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2",
          hero ? "w-72" : compact ? "w-28" : "w-52",
        )}
      >
        <div
          className={clsx(
            "rounded-xl border-[6px] border-slate-950 bg-slate-950 shadow-2xl",
            hero ? "h-44" : compact ? "h-16" : "h-32",
          )}
        >
          <div className="device-screen grid h-full place-items-center rounded-md text-lg font-semibold text-slate-950">
            {initial}
          </div>
        </div>
        <div className="mx-auto h-3 w-[112%] rounded-b-xl bg-slate-950 shadow-lg" />
      </div>
    );
  }

  if (categoryKey.includes("watch")) {
    return (
      <div
        className={clsx(
          "absolute left-1/2 top-1/2 z-10 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[7px] border-slate-950 bg-slate-950 shadow-2xl",
          hero ? "h-56 w-56" : compact ? "h-16 w-16 border-[4px]" : "h-32 w-32",
        )}
      >
        <div className="device-screen grid h-[82%] w-[82%] place-items-center rounded-full text-lg font-semibold text-slate-950">
          {initial}
        </div>
      </div>
    );
  }

  if (categoryKey.includes("earbud")) {
    return (
      <div
        className={clsx(
          "absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center",
          hero ? "gap-7" : compact ? "gap-2" : "gap-4",
        )}
      >
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className={clsx(
              "device-screen rounded-[55%] border-[6px] border-slate-950 shadow-2xl",
              hero
                ? "h-48 w-24"
                : compact
                  ? "h-16 w-8 border-[4px]"
                  : "h-32 w-16",
            )}
          />
        ))}
      </div>
    );
  }

  if (categoryKey.includes("television") || categoryKey.includes("tv")) {
    return (
      <div
        className={clsx(
          "absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2",
          hero ? "w-80" : compact ? "w-28" : "w-52",
        )}
      >
        <div
          className={clsx(
            "rounded-lg border-[6px] border-slate-950 bg-slate-950 shadow-2xl",
            hero ? "h-48" : compact ? "h-16 border-[4px]" : "h-32",
          )}
        >
          <div className="device-screen grid h-full place-items-center rounded-sm text-lg font-semibold text-slate-950">
            {initial}
          </div>
        </div>
        <div className="mx-auto h-4 w-2 rounded-b bg-slate-950" />
        <div className="mx-auto h-1.5 w-20 rounded-full bg-slate-950" />
      </div>
    );
  }

  if (categoryKey.includes("gaming")) {
    return (
      <div
        className={clsx(
          "absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-[32px] border-[7px] border-slate-950 bg-slate-950 shadow-2xl",
          hero
            ? "h-40 w-80"
            : compact
              ? "h-14 w-28 rounded-[18px] border-[4px]"
              : "h-28 w-52",
        )}
      >
        <div className="device-screen absolute inset-y-2 left-[20%] right-[20%] grid place-items-center rounded-md text-lg font-semibold text-slate-950">
          {initial}
        </div>
        <div className="absolute left-[7%] top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-4 border-white/80" />
        <div className="absolute right-[7%] top-1/2 grid -translate-y-1/2 grid-cols-2 gap-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <span
              key={index}
              className="h-2.5 w-2.5 rounded-full bg-white/80"
            />
          ))}
        </div>
      </div>
    );
  }

  if (categoryKey.includes("e-reader")) {
    return (
      <div
        className={clsx(
          "absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-[20px] border-[7px] border-slate-950 bg-slate-950 shadow-2xl",
          hero
            ? "h-72 w-52"
            : compact
              ? "h-20 w-14 rounded-[12px] border-[4px]"
              : "h-44 w-32",
        )}
      >
        <div className="absolute inset-2 rounded-lg bg-[#f3f0e7] p-3">
          <div className="mb-3 h-2 w-2/3 rounded-full bg-slate-700/80" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-1 rounded-full bg-slate-500/40"
                style={{ width: index === 4 ? "62%" : "100%" }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (categoryKey.includes("tablet")) {
    return (
      <div
        className={clsx(
          "absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-[24px] border-[7px] border-slate-950 bg-slate-950 shadow-2xl",
          hero
            ? "h-64 w-48"
            : compact
              ? "h-20 w-16 rounded-[14px] border-[4px]"
              : "h-44 w-32",
        )}
      >
        <div className="device-screen absolute inset-1 grid place-items-center rounded-[17px] text-lg font-semibold text-slate-950">
          {initial}
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-[30px] border-[7px] border-slate-950 bg-slate-950 shadow-2xl",
        hero ? "h-72 w-40" : compact ? "h-20 w-12 rounded-[22px]" : "h-40 w-24",
      )}
    >
      <div className="device-screen absolute inset-1 rounded-[22px]" />
      <div className="absolute left-1/2 top-2 h-1.5 w-9 -translate-x-1/2 rounded-full bg-slate-950/70" />
      <div className="absolute bottom-4 left-1/2 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full bg-white/80 text-sm font-semibold text-slate-950">
        {initial}
      </div>
    </div>
  );
}
