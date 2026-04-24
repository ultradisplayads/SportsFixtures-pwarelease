export default function StatCard({
  title,
  value,
  subtext,
}: {
  title: string
  value: string | number
  subtext?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
      {subtext ? <div className="mt-1 text-xs text-muted-foreground">{subtext}</div> : null}
    </div>
  )
}
