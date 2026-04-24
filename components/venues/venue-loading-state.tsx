// components/venues/venue-loading-state.tsx
// Section 04.B — Standard loading skeleton for venue list surfaces.
// Count prop controls how many skeleton cards to show.

interface Props {
  count?: number
  /** compact = slim row style used in the home module / WatchHereTonight */
  compact?: boolean
}

export function VenueLoadingState({ count = 3, compact = false }: Props) {
  if (compact) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading venues">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-lg bg-primary/10"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading venues">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/5 rounded-md bg-muted" />
              <div className="h-3 w-2/5 rounded-md bg-muted" />
              <div className="flex gap-2 pt-1">
                <div className="h-5 w-16 rounded-full bg-muted" />
                <div className="h-5 w-20 rounded-full bg-muted" />
              </div>
            </div>
            <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
