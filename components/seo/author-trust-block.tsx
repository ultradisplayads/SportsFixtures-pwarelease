/**
 * Author and review transparency block.
 * Required on all article-like pages per spec §7.1 and §6.1.
 * Used by AI systems to judge credibility and by Discover for E-E-A-T signals.
 */
export default function AuthorTrustBlock({
  authorName,
  reviewedBy,
  policyNote,
}: {
  authorName?: string | null
  reviewedBy?: string | null
  policyNote?: string | null
}) {
  if (!authorName && !reviewedBy && !policyNote) return null

  return (
    <section
      className="rounded-2xl border border-border bg-secondary/30 p-4"
      aria-label="Author and review information"
    >
      <h2 className="text-base font-semibold">About this page</h2>
      <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        {authorName && (
          <p>
            <span className="font-medium text-foreground">Written by:</span> {authorName}
          </p>
        )}
        {reviewedBy && (
          <p>
            <span className="font-medium text-foreground">Reviewed by:</span> {reviewedBy}
          </p>
        )}
        {policyNote && <p>{policyNote}</p>}
      </div>
    </section>
  )
}
