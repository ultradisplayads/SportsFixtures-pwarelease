const SEVERITY_CLASSES: Record<"low" | "medium" | "high", string> = {
  low:    "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  high:   "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400",
}

export default function StalePageBadge({
  severity,
}: {
  severity: "low" | "medium" | "high"
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${SEVERITY_CLASSES[severity]}`}
    >
      {severity.toUpperCase()}
    </span>
  )
}
