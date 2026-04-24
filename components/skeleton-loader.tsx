export function FixtureCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        {/* Home Team Skeleton */}
        <div className="flex flex-1 items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-muted" />
          <div className="h-4 flex-1 rounded bg-muted" />
        </div>

        {/* Score Skeleton */}
        <div className="px-2">
          <div className="h-6 w-12 rounded bg-muted" />
        </div>

        {/* Away Team Skeleton */}
        <div className="flex flex-1 items-center gap-2.5">
          <div className="h-4 flex-1 rounded bg-muted" />
          <div className="h-8 w-8 rounded-full bg-muted" />
        </div>
      </div>

      {/* Match Details Skeleton */}
      <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2.5">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-5 w-20 rounded bg-muted" />
      </div>
    </div>
  )
}

export function LeagueHeaderSkeleton() {
  return (
    <div className="mb-4 animate-pulse">
      <div className="mb-2.5 flex items-center gap-2 px-1">
        <div className="h-5 w-5 rounded bg-muted" />
        <div className="h-4 w-40 rounded bg-muted" />
      </div>
      <div className="mb-2.5 flex items-center justify-between px-1">
        <div className="h-3 w-48 rounded bg-muted" />
        <div className="h-4 w-4 rounded bg-muted" />
      </div>
    </div>
  )
}

export function MatchDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="h-6 w-20 rounded bg-muted" />
      </div>

      {/* Teams */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-muted" />
          <div className="h-6 w-40 rounded bg-muted" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-muted" />
          <div className="h-6 w-40 rounded bg-muted" />
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-2 w-full rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 p-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <LeagueHeaderSkeleton />
          <div className="space-y-2.5">
            <FixtureCardSkeleton />
            <FixtureCardSkeleton />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonLoader({ count = 3 }: { count?: number }) {
  return <ListSkeleton count={count} />
}
