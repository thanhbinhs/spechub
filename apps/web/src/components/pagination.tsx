import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "@spechub/api-client";

type PaginationProps = {
  meta: PaginationMeta;
  basePath: string;
  params?: Record<string, string | number | boolean | undefined | null>;
};

export function Pagination({ meta, basePath, params = {} }: PaginationProps) {
  if (meta.totalPages <= 1) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="text-slate-500">
        Page <span className="font-medium text-slate-900">{meta.page}</span> of{" "}
        <span className="font-medium text-slate-900">{meta.totalPages}</span>
      </div>
      <div className="flex items-center gap-2">
        <PageLink
          disabled={!meta.hasPrev}
          href={hrefFor(basePath, params, meta.page - 1)}
          label="Previous"
          icon={<ChevronLeft size={16} />}
        />
        <PageLink
          disabled={!meta.hasNext}
          href={hrefFor(basePath, params, meta.page + 1)}
          label="Next"
          icon={<ChevronRight size={16} />}
          iconAfter
        />
      </div>
    </div>
  );
}

function PageLink({
  href,
  label,
  icon,
  iconAfter,
  disabled,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  iconAfter?: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-slate-300">
        {!iconAfter ? icon : null}
        {label}
        {iconAfter ? icon : null}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
    >
      {!iconAfter ? icon : null}
      {label}
      {iconAfter ? icon : null}
    </Link>
  );
}

function hrefFor(
  basePath: string,
  params: Record<string, string | number | boolean | undefined | null>,
  page: number,
) {
  const search = new URLSearchParams();
  const entries: Record<string, string | number | boolean | undefined | null> =
    { ...params, page };

  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }

  return `${basePath}?${search.toString()}`;
}
