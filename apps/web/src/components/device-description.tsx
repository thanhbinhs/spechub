"use client";

import { useId, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";

type DescriptionSection = {
  title: string;
  body: string;
};

export function DeviceDescription({
  markdown,
  deviceName,
}: {
  markdown: string;
  deviceName: string;
}) {
  const sections = useMemo(() => splitDescription(markdown), [markdown]);
  const [activeIndex, setActiveIndex] = useState(0);
  const tabsId = useId();
  const activeSection = sections[activeIndex] ?? sections[0];
  const hasMultipleSections = sections.length > 1;

  if (!activeSection) return null;

  return (
    <section
      id="description"
      aria-labelledby={`${tabsId}-title`}
      className="scroll-mt-28 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
            <FileText size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-600">
              Hồ sơ thiết bị
            </p>
            <h2
              id={`${tabsId}-title`}
              className="mt-0.5 text-lg font-semibold tracking-tight text-slate-950"
            >
              Mô tả &amp; điểm nổi bật
            </h2>
          </div>
        </div>
        {hasMultipleSections ? (
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {sections.length} mục · đọc theo chủ đề
          </span>
        ) : null}
      </div>

      <div
        className={
          hasMultipleSections
            ? "grid lg:grid-cols-[220px_minmax(0,1fr)]"
            : ""
        }
      >
        {hasMultipleSections ? (
          <div className="min-w-0 border-b border-slate-200 bg-slate-50/70 p-2 lg:border-b-0 lg:border-r">
            <div
              role="tablist"
              aria-label={`Các mục mô tả ${deviceName}`}
              className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
            >
              {sections.map((section, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    key={`${section.title}-${index}`}
                    id={`${tabsId}-tab-${index}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`${tabsId}-panel-${index}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setActiveIndex(index)}
                    className={`group flex min-w-[172px] items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm outline-none transition lg:min-w-0 ${
                      isActive
                        ? "bg-white font-semibold text-slate-950 shadow-sm ring-1 ring-slate-200"
                        : "font-medium text-slate-600 hover:bg-white/80 hover:text-slate-950"
                    } focus-visible:ring-2 focus-visible:ring-blue-500`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        isActive
                          ? "bg-blue-600"
                          : "bg-slate-300 group-hover:bg-slate-400"
                      }`}
                    />
                    <span className="line-clamp-2">{section.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div
          id={`${tabsId}-panel-${activeIndex}`}
          role={hasMultipleSections ? "tabpanel" : undefined}
          aria-labelledby={
            hasMultipleSections ? `${tabsId}-tab-${activeIndex}` : undefined
          }
          tabIndex={hasMultipleSections ? 0 : undefined}
          className="min-w-0 px-5 py-5 outline-none sm:px-6 lg:px-8 lg:py-6"
        >
          {hasMultipleSections ? (
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-xs font-medium text-slate-400">
                {String(activeIndex + 1).padStart(2, "0")} /{" "}
                {String(sections.length).padStart(2, "0")}
              </p>
              <div className="h-1 w-24 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-[width]"
                  style={{
                    width: `${((activeIndex + 1) / sections.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          ) : null}

          <h3 className="text-xl font-semibold tracking-tight text-slate-950">
            {activeSection.title}
          </h3>
          <div className="mt-2 [&>:first-child]:mt-0 [&>:last-child]:mb-0">
            <MarkdownContent markdown={activeSection.body} />
          </div>

          {hasMultipleSections ? (
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={activeIndex === 0}
                onClick={() =>
                  setActiveIndex((index) => Math.max(0, index - 1))
                }
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 outline-none transition hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronLeft size={16} />
                Mục trước
              </button>
              <button
                type="button"
                disabled={activeIndex === sections.length - 1}
                onClick={() =>
                  setActiveIndex((index) =>
                    Math.min(sections.length - 1, index + 1),
                  )
                }
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 outline-none transition hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-30"
              >
                Mục sau
                <ChevronRight size={16} />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function splitDescription(markdown: string): DescriptionSection[] {
  const content = markdown.trim();
  if (!content) return [];

  const headingPattern = /^##\s+(.+?)\s*$/gm;
  const matches = [...content.matchAll(headingPattern)];

  if (!matches.length) {
    return [{ title: "Tổng quan", body: content }];
  }

  const sections: DescriptionSection[] = [];
  const introduction = content.slice(0, matches[0]?.index ?? 0).trim();

  if (introduction) {
    sections.push({
      title: "Tổng quan",
      body: introduction,
    });
  }

  matches.forEach((match, index) => {
    const headingStart = match.index ?? 0;
    const bodyStart = headingStart + match[0].length;
    const bodyEnd = matches[index + 1]?.index ?? content.length;
    const title = match[1]?.trim();
    const body = content.slice(bodyStart, bodyEnd).trim();

    if (title && body) {
      sections.push({ title, body });
    }
  });

  return sections.length
    ? sections
    : [{ title: "Tổng quan", body: content }];
}
