// components/account/account-loading-state.tsx
// Section 06 — Skeleton loading placeholder for account/profile surfaces.
// Matches the visual layout of the full profile page so there is no
// sudden content shift on load. No spinners — skeleton bars only.

export function AccountLoadingState() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading account details">
      {/* Profile summary card skeleton */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-36 rounded bg-muted" />
            <div className="h-3 w-48 rounded bg-muted" />
            <div className="h-3 w-24 rounded bg-muted" />
          </div>
        </div>
      </div>

      {/* Mode banner skeleton */}
      <div className="h-16 rounded-2xl border border-border bg-card" />

      {/* Form section skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-4 w-4 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}
