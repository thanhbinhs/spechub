"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { clsx } from "clsx";

type BannerSlide = {
  id: string;
  image: string;
  href: string;
  label: string;
  title: string;
  description: string;
};

const slides: BannerSlide[] = [
  {
    id: "discover",
    image: "/images/banners/spechub-discover.jpg",
    href: "/devices",
    label: "Khám phá thiết bị",
    title: "Chọn thiết bị dễ hơn",
    description: "Khám phá những thiết bị phù hợp với nhu cầu của bạn.",
  },
  {
    id: "ai",
    image: "/images/banners/spechub-ai.jpg",
    href: "/recommend",
    label: "Nhận gợi ý chọn thiết bị",
    title: "Gợi ý dành cho bạn",
    description: "Chia sẻ ngân sách và nhu cầu để nhận ba lựa chọn rõ ràng.",
  },
  {
    id: "compare",
    image: "/images/banners/spechub-compare.jpg",
    href: "/compare",
    label: "So sánh thiết bị",
    title: "So sánh trước khi chọn",
    description: "Xem nhanh khác biệt quan trọng giữa hai thiết bị.",
  },
];

export function HomeBannerCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const activeSlide = slides[activeIndex];
  const isPaused = isManuallyPaused || isInteracting;

  useEffect(() => {
    if (
      isPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  function selectSlide(index: number) {
    setActiveIndex((index + slides.length) % slides.length);
  }

  function moveSlide(direction: -1 | 1) {
    selectSlide(activeIndex + direction);
  }

  return (
    <section
      aria-label="Gợi ý nổi bật"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      onFocusCapture={() => setIsInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setIsInteracting(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          moveSlide(-1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          moveSlide(1);
        }
      }}
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const touchEndX = event.changedTouches[0]?.clientX;
        if (touchStartX.current === null || touchEndX === undefined) return;
        const distance = touchEndX - touchStartX.current;
        if (Math.abs(distance) > 50) moveSlide(distance > 0 ? -1 : 1);
        touchStartX.current = null;
      }}
      className="w-full"
    >
      <h1 className="sr-only">SpecHub — tìm và so sánh thiết bị</h1>

      <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 shadow-[0_24px_70px_rgba(24,24,27,0.16)] sm:aspect-video lg:aspect-[1915/821]">
        {slides.map((slide, index) => (
          <Link
            key={slide.id}
            href={slide.href}
            aria-label={slide.label}
            aria-hidden={index !== activeIndex}
            tabIndex={index === activeIndex ? 0 : -1}
            className={clsx(
              "absolute inset-0 transition-opacity duration-700 ease-out",
              index === activeIndex
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0",
            )}
          >
            <Image
              src={slide.image}
              alt=""
              fill
              priority={index === 0}
              quality={90}
              sizes="(min-width: 1280px) 1216px, (min-width: 768px) calc(100vw - 48px), calc(100vw - 32px)"
              className="object-cover object-[68%_center] md:object-center"
            />
          </Link>
        ))}

        <div
          key={activeSlide.id}
          className="fade-up pointer-events-none absolute left-5 right-20 top-5 z-10 rounded-2xl border border-white/20 bg-slate-950/55 p-3.5 text-white shadow-lg backdrop-blur-md sm:left-8 sm:right-auto sm:top-8 sm:max-w-md sm:p-4"
        >
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl lg:text-2xl">
            {activeSlide.title}
          </h2>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/75 sm:text-sm">
            {activeSlide.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => moveSlide(-1)}
          aria-label="Ảnh trước"
          className="absolute left-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/85 text-slate-950 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white sm:left-5"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          onClick={() => moveSlide(1)}
          aria-label="Ảnh tiếp theo"
          className="absolute right-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/85 text-slate-950 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white sm:right-5"
        >
          <ChevronRight size={22} />
        </button>

        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/20 bg-slate-950/45 px-3 py-2 shadow-lg backdrop-blur-md">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => selectSlide(index)}
              aria-label={slide.label}
              aria-current={index === activeIndex ? "true" : undefined}
              className={clsx(
                "h-2 rounded-full transition-all",
                index === activeIndex
                  ? "w-6 bg-white"
                  : "w-2 bg-white/45 hover:bg-white/75",
              )}
            />
          ))}
        </div>

        <div className="absolute bottom-4 right-4 z-20 rounded-full border border-white/20 bg-slate-950/45 p-2 text-white shadow-lg backdrop-blur-md sm:right-6">
          <button
            type="button"
            onClick={() => setIsManuallyPaused((current) => !current)}
            aria-label={
              isManuallyPaused ? "Tiếp tục trình chiếu" : "Tạm dừng trình chiếu"
            }
            className="grid size-7 place-items-center rounded-full transition hover:bg-white/20"
          >
            {isManuallyPaused ? <Play size={12} /> : <Pause size={12} />}
          </button>
        </div>
      </div>
    </section>
  );
}
