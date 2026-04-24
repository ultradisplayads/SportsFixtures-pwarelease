export function LoadingSkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2 rounded-3xl border border-white/10 bg-white/5 p-5">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded bg-white/10"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}
