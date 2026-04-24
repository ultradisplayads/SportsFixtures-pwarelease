/**
 * FAQ block — rendered server-side for schema alignment.
 * Only use where a visible FAQ section exists on the page;
 * the faqSchema() in schema.ts must match these exact items.
 */
export default function FaqBlock({
  items,
}: {
  items: Array<{ question: string; answer: string }>
}) {
  if (!items.length) return null

  return (
    <section
      className="rounded-2xl border border-border bg-secondary/30 p-4"
      aria-label="Frequently asked questions"
    >
      <h2 className="text-base font-semibold">FAQ</h2>
      <div className="mt-4 space-y-4">
        {items.map((item) => (
          <div key={item.question}>
            <h3 className="text-sm font-medium">{item.question}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
