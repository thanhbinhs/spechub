export function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="app-panel p-5" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="animate-pulse space-y-4" aria-hidden="true">
        <div className="h-4 w-36 rounded-full bg-slate-100" />
        <div className="h-12 rounded-lg bg-slate-100" />
        <div className="h-12 rounded-lg bg-slate-100" />
        <div className="h-12 rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}
