export function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-600" />
        {label}
      </div>
    </div>
  );
}
