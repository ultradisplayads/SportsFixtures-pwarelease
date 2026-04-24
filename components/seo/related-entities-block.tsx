import Link from "next/link"

/**
 * Related entity links block.
 * Every indexable entity page must link to at least one parent/sibling
 * and one related entity of another type (per spec §6.3).
 * Rendered server-side for full crawl discoverability.
 */
export default function RelatedEntitiesBlock({
  title = "Related pages",
  items,
}: {
  title?: string
  items: Array<{ href: string; label: string; description?: string }>
}) {
  if (!items.length) return null

  return (
    <section
      className="rounded-2xl border border-border bg-secondary/30 p-4"
      aria-label="Related pages"
    >
      <h2 className="text-base font-semibold">{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={`${item.href}-${item.label}`} className="flex flex-col gap-0.5">
            <Link
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              href={item.href}
            >
              {item.label}
            </Link>
            {item.description && (
              <span className="text-xs text-muted-foreground">{item.description}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
