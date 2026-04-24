/**
 * AI-citation-ready summary block.
 * Rendered server-side so extractability is guaranteed without JS.
 * Place near the top of every indexable entity page.
 */
export default function AiSummaryBlock({
  title = "Quick summary",
  summary,
}: {
  title?: string
  summary: string
}) {
  if (!summary) return null

  return (
    <section
      className="rounded-2xl border border-border bg-secondary/30 p-4"
      aria-label="Quick summary"
    >
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{summary}</p>
    </section>
  )
}
