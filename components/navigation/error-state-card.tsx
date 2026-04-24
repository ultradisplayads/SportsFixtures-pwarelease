export function ErrorStateCard({
  title,
  body,
  onRetry,
}: {
  title: string;
  body: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-5">
      <div className="text-sm font-semibold text-red-200">{title}</div>
      <div className="mt-1 text-sm text-red-100/80">{body}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-full bg-red-400/10 px-4 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-400/20"
        >
          Retry
        </button>
      )}
    </div>
  );
}
