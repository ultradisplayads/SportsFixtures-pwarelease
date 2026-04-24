import { FALLBACK_SEO_SETTINGS } from "@/lib/seo/config"

/**
 * Source and freshness block.
 * Makes visible published/updated dates, data source, and methodology.
 * Required for Discover eligibility on article-like pages.
 * Required for AI citation confidence on all entity pages.
 */
export default function SourceTransparency({
  publishedAt,
  updatedAt,
  sourceLabel,
  methodology,
}: {
  publishedAt?: string | null
  updatedAt?: string | null
  sourceLabel?: string | null
  methodology?: string | null
}) {
  const source = sourceLabel ?? FALLBACK_SEO_SETTINGS.defaultSourceLabel
  const method = methodology ?? FALLBACK_SEO_SETTINGS.defaultMethodologyNote

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(iso))
    } catch {
      return iso
    }
  }

  return (
    <section
      className="rounded-2xl border border-border bg-secondary/30 p-4 text-sm"
      aria-label="Source and freshness"
    >
      <h2 className="text-base font-semibold">Source and freshness</h2>
      <ul className="mt-3 space-y-1.5 text-muted-foreground">
        {publishedAt && (
          <li>
            <span className="font-medium text-foreground">Published:</span>{" "}
            <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
          </li>
        )}
        {updatedAt && (
          <li>
            <span className="font-medium text-foreground">Last updated:</span>{" "}
            <time dateTime={updatedAt}>{formatDate(updatedAt)}</time>
          </li>
        )}
        {source && (
          <li>
            <span className="font-medium text-foreground">Primary source:</span> {source}
          </li>
        )}
        {method && (
          <li>
            <span className="font-medium text-foreground">Method:</span> {method}
          </li>
        )}
      </ul>
    </section>
  )
}
