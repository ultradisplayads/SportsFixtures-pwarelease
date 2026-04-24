export function EmptyStateCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="text-sm font-semibold text-white/90">{title}</div>
      <div className="mt-1 text-sm text-white/60">{body}</div>
    </div>
  );
}
