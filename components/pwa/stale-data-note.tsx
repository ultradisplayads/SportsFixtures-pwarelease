"use client"

// Section 09 — Stale Data Note
// Inline note placed next to individual data surfaces (ticker, livescores)
// when the NormalizedEnvelope signals freshness === "stale" or the network
// is offline. Not used globally — only where live freshness truly matters.

interface StaleDataNoteProps {
  visible: boolean
  message?: string
}

export function StaleDataNote({ visible, message }: StaleDataNoteProps) {
  if (!visible) return null

  return (
    <div className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
      {message ||
        "Some data may be slightly out of date. Pull to refresh or reopen the page when online."}
    </div>
  )
}
