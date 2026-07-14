import { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-slate-300 bg-surface-muted/60 p-8 text-center">
      <div className="max-w-sm">
        {icon ? (
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-white text-blue-700 shadow-sm ring-1 ring-slate-200">
            {icon}
          </div>
        ) : null}
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}
