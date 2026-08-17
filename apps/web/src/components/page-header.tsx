import { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  action?: ReactNode;
};

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <header className="fade-up flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold leading-tight tracking-[-0.025em] text-slate-950 sm:text-3xl">
          {title}
        </h1>
      </div>
      {action ? (
        <div className="shrink-0 self-start sm:self-auto">{action}</div>
      ) : null}
    </header>
  );
}
