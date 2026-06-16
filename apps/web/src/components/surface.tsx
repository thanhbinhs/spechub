import type { ReactNode } from "react";
import { clsx } from "clsx";

export function Surface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "rounded-lg border border-slate-200/80 bg-white shadow-sm",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SurfaceHeader({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold text-slate-950">
          {title}
        </h2>
        {meta ? <p className="mt-1 text-xs text-slate-500">{meta}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
