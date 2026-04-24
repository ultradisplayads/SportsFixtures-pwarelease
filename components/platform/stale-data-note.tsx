"use client"

// components/platform/stale-data-note.tsx
// Section 09 — Inline note shown when content is served from the SW cache
// (i.e. when the network request failed and stale data was returned).
// Render this below a data list when isStale is true; never render it
// when data is fresh or when the user is known to be online.

import { Clock } from "lucide-react"

interface StaleDataNoteProps {
  /** ISO timestamp of when the data was originally cached */
  cachedAt?: string | null
  /** Custom message override */
  message?: string
  className?: string
}

function formatCachedAt(iso: string): string {
  try {
    const date = new Date(iso)
    const now = Date.now()
    const diffMs = now - date.getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    if (diffMin < 1) return "just now"
    if (diffMin < 60) return `${diffMin}m ago`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH}h ago`
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  } catch {
    return "recently"
  }
}

export function StaleDataNote({ cachedAt, message, className = "" }: StaleDataNoteProps) {
  const label = message
    ?? (cachedAt
      ? `Showing cached data from ${formatCachedAt(cachedAt)}`
      : "Showing cached data — connect to refresh")

  return (
    <p
      role="note"
      className={[
        "flex items-center gap-1.5 text-xs text-muted-foreground",
        className,
      ].join(" ")}
    >
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {label}
    </p>
  )
}
