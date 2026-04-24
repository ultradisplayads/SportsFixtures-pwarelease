"use client"

import { Eye } from "lucide-react"

interface WatchingHereChipProps {
  /** Whether the current user is watching here */
  active: boolean
  /** Total count of people watching here — only shown when > 0 */
  count?: number | null
}

/**
 * Displays a "watching here" chip with a real watcher count.
 * Returns null when count is 0/null AND the user is not actively watching —
 * there is nothing honest to show.
 */
export function WatchingHereChip({ active, count }: WatchingHereChipProps) {
  const displayCount = typeof count === "number" && count > 0 ? count : null

  if (!active && displayCount === null) return null

  return (
    <span
      className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active
          ? "bg-primary/15 text-primary"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <Eye className="h-3 w-3 shrink-0" aria-hidden="true" />
      {displayCount !== null
        ? `${displayCount} watching`
        : "Watching here"}
    </span>
  )
}
