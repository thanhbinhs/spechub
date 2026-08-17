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
    <section className={clsx("app-panel overflow-hidden", className)}>
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
    <div className="flex flex-col gap-2 border-b border-slate-200/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h2 className="text-base font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        {meta ? <span className="text-xs text-slate-500">{meta}</span> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
