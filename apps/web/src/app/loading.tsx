export default function Loading() {
  return (
    <div
      className="app-page mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Đang tải nội dung</span>
      <div className="animate-pulse" aria-hidden="true">
        <div className="h-3 w-24 rounded-full bg-slate-200" />
        <div className="mt-3 h-8 w-64 max-w-full rounded-lg bg-slate-200" />
        <div className="mt-3 h-4 w-[32rem] max-w-full rounded-full bg-slate-100" />
      </div>
      <div
        className="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-hidden="true"
      >
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <div className="h-36 bg-slate-100" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-2/3 rounded-full bg-slate-200" />
              <div className="h-3 rounded-full bg-slate-100" />
              <div className="h-16 rounded-lg bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
