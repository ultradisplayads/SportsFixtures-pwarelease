"use client"

// components/admin/control-plane-empty-state.tsx
// Section 12 — Empty state for admin panels with no configured items.
//
// Used by feature-flags, commercial-slots, venue-boosts, and any other
// panel that can legitimately have zero entries.

type Props = {
  message: string
  /** Optional note explaining what an empty state means operationally. */
  note?: string
}

export function ControlPlaneEmptyState({ message, note }: Props) {
  return (
    <div className="rounded-lg bg-muted/50 px-4 py-5 text-center">
      <p className="text-xs text-muted-foreground">{message}</p>
      {note && (
        <p className="mt-1.5 text-[10px] text-muted-foreground/70">{note}</p>
      )}
    </div>
  )
}
