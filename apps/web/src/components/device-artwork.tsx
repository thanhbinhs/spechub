"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import { clsx } from "clsx";

type DeviceArtworkProps = {
  brand?: string;
  name?: string;
  category?: string;
  accent?: string | null;
  compact?: boolean;
  hero?: boolean;
  className?: string;
};

type DeviceVisual = {
  match: string[];
  image: string;
  label: string;
  tone: string;
};

const DEVICE_VISUALS: DeviceVisual[] = [
  {
    match: ["iphone 16"],
    image: "https://pngimg.com/uploads/iphone16/iphone16_PNG27.png",
    label: "Apple iPhone 16 series",
    tone: "#b85b8d",
  },
  {
    match: ["galaxy s25"],
    image:
      "https://lmt-web.mstatic.lv/eshop/28961/1-samsung-galaxy-s25-ultra-s938-titanium-black.png",
    label: "Samsung Galaxy S25 Ultra",
    tone: "#5f5548",
  },
  {
    match: ["pixel 9"],
    image:
      "https://lmt-web.mstatic.lv/eshop/29283/7-google-pixel-9-pro-xl-obsidian.png",
    label: "Google Pixel 9 Pro",
    tone: "#4b5563",
  },
  {
    match: ["xiaomi 14"],
    image:
      "https://mistore.se/cdn/shop/files/N1-Black-Front-R4-3wallpaper__e.png?v=1742564711",
    label: "Xiaomi 14 Ultra",
    tone: "#14532d",
  },
];

export function DeviceArtwork({
  brand,
  name,
  category,
  accent,
  compact,
  hero,
  className,
}: DeviceArtworkProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const visual = pickDeviceVisual(name, brand);
  const initial = brand?.slice(0, 1).toUpperCase() ?? "S";
  const safeAccent =
    accent && /^#[0-9a-fA-F]{6}$/.test(accent)
      ? accent
      : (visual?.tone ?? "#f43f5e");
  const imageSrc = visual?.image ?? "";
  const showImage = Boolean(imageSrc && !imageFailed);

  return (
    <div
      className={clsx(
        "device-artwork group relative isolate overflow-hidden rounded-lg border border-slate-200/80 bg-surface-muted shadow-md",
        hero ? "min-h-[420px]" : compact ? "h-28" : "h-56",
        className,
      )}
      style={{ "--device-accent": safeAccent } as CSSProperties}
    >
      {showImage ? (
        <Image
          src={imageSrc}
          alt={visual?.label ?? `Hình ảnh sản phẩm ${brand ?? "thiết bị"}`}
          fill
          priority={hero}
          sizes={
            hero
              ? "(min-width: 1024px) 520px, 100vw"
              : compact
                ? "112px"
                : "320px"
          }
          onError={() => setImageFailed(true)}
          className={clsx(
            "z-10 object-contain drop-shadow-lg transition duration-200 ease-out group-hover:scale-[1.025]",
            hero ? "p-8 sm:p-10" : compact ? "p-3" : "p-6",
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

      <div className="pointer-events-none absolute inset-x-5 top-4 z-20 flex items-center justify-between gap-3">
        <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur">
          {brand ?? visual?.label ?? "SpecHub"}
        </span>
        <span
          className="h-2.5 w-2.5 rounded-full border border-white shadow-sm"
          style={{ backgroundColor: safeAccent }}
        />
      </div>
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

function pickDeviceVisual(name?: string, brand?: string) {
  const value = `${name ?? ""} ${brand ?? ""}`.toLowerCase();
  return DEVICE_VISUALS.find((visual) =>
    visual.match.some((item) => value.includes(item)),
  );
}
