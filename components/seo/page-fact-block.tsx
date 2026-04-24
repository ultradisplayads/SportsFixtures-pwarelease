/**
 * Structured key-facts grid.
 * Each item has a label and a value — rendered as a <dl> for semantic clarity
 * and AI extractability. Null/empty values are filtered.
 */
export default function PageFactBlock({
  title = "Key facts",
  items,
}: {
  title?: string
  items: Array<{ label: string; value: string | null | undefined }>
}) {
  const visible = items.filter((i) => i.value)
  if (!visible.length) return null

  return (
    <section
      className="rounded-2xl border border-border bg-secondary/30 p-4"
      aria-label="Key facts"
    >
      <h2 className="text-base font-semibold">{title}</h2>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        {visible.map((item) => (
          <div key={item.label}>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</dt>
            <dd className="mt-0.5 text-sm font-medium">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
