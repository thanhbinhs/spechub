"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { clsx } from "clsx";

type DeviceArtworkProps = {
  brand?: string;
  name?: string;
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
    match: ["iphone 16", "apple"],
    image: "https://pngimg.com/uploads/iphone16/iphone16_PNG27.png",
    label: "Apple iPhone 16 series",
    tone: "#b85b8d",
  },
  {
    match: ["galaxy s25", "samsung"],
    image:
      "https://lmt-web.mstatic.lv/eshop/28961/1-samsung-galaxy-s25-ultra-s938-titanium-black.png",
    label: "Samsung Galaxy S25 Ultra",
    tone: "#5f5548",
  },
  {
    match: ["pixel 9", "google"],
    image:
      "https://lmt-web.mstatic.lv/eshop/29283/7-google-pixel-9-pro-xl-obsidian.png",
    label: "Google Pixel 9 Pro",
    tone: "#4b5563",
  },
  {
    match: ["xiaomi 14", "xiaomi"],
    image:
      "https://mistore.se/cdn/shop/files/N1-Black-Front-R4-3wallpaper__e.png?v=1742564711",
    label: "Xiaomi 14 Ultra",
    tone: "#14532d",
  },
];

export function DeviceArtwork({
  brand,
  name,
  accent,
  compact,
  hero,
  className,
}: DeviceArtworkProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const visual = pickDeviceVisual(name, brand);
  const initial = brand?.slice(0, 1).toUpperCase() ?? "S";
  const safeAccent =
    accent && /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : visual?.tone ?? "#2563eb";
  const showImage = Boolean(visual?.image && !imageFailed);

  return (
    <div
      className={clsx(
        "device-artwork group relative isolate overflow-hidden rounded-lg border border-white/70 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]",
        hero ? "min-h-[420px]" : compact ? "h-28" : "h-56",
        className,
      )}
      style={{ "--device-accent": safeAccent } as CSSProperties}
    >
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#ffffff_0%,#eef4f7_48%,#f7efe3_100%)]" />
      <div className="absolute inset-0 opacity-[0.55] [background-image:linear-gradient(rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.055)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(180deg,transparent_0%,rgba(15,23,42,0.09)_100%)]" />

      {showImage ? (
        <img
          src={visual?.image}
          alt={visual?.label ?? `${brand ?? "Device"} product image`}
          loading={hero ? "eager" : "lazy"}
          onError={() => setImageFailed(true)}
          className={clsx(
            "relative z-10 mx-auto h-full w-full object-contain drop-shadow-[0_22px_28px_rgba(15,23,42,0.22)] transition duration-500 ease-out group-hover:scale-[1.035]",
            hero ? "p-8 sm:p-10" : compact ? "p-3" : "p-6",
          )}
        />
      ) : (
        <FallbackPhone initial={initial} compact={compact} hero={hero} />
      )}

      <div className="pointer-events-none absolute inset-x-5 top-4 z-20 flex items-center justify-between gap-3">
        <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur">
          {brand ?? visual?.label ?? "SpecHub"}
        </span>
        <span className="h-2.5 w-2.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: safeAccent }} />
      </div>
    </div>
  );
}

function FallbackPhone({
  initial,
  compact,
  hero,
}: {
  initial: string;
  compact?: boolean;
  hero?: boolean;
}) {
  return (
    <div
      className={clsx(
        "absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-[30px] border-[7px] border-slate-950 bg-slate-950 shadow-2xl",
        hero ? "h-72 w-40" : compact ? "h-20 w-12 rounded-[22px]" : "h-40 w-24",
      )}
    >
      <div className="absolute inset-1 rounded-[22px] bg-[linear-gradient(160deg,var(--device-accent),#f8fafc_70%)]" />
      <div className="absolute left-1/2 top-2 h-1.5 w-9 -translate-x-1/2 rounded-full bg-slate-950/70" />
      <div className="absolute bottom-4 left-1/2 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full bg-white/80 text-sm font-semibold text-slate-950">
        {initial}
      </div>
    </div>
  );
}

function pickDeviceVisual(name?: string, brand?: string) {
  const value = `${name ?? ""} ${brand ?? ""}`.toLowerCase();
  return (
    DEVICE_VISUALS.find((visual) =>
      visual.match.some((item) => value.includes(item)),
    ) ?? DEVICE_VISUALS[0]
  );
}
