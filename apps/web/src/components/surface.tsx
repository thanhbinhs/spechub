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
        "rounded-xl border border-slate-200/80 bg-surface shadow-sm",
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
    <div className="flex flex-col gap-3 border-b border-slate-200/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        {meta ? (
          <p className="mt-1 text-sm leading-5 text-slate-500">{meta}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
