// lib/crowd-score.ts
// Section 08 — Derives a "crowd interest" score for an event or venue based
// on anonymous check-in counts and watcher counts supplied by the backend.
// Used by venue cards and the watch-here-tonight module.

export interface CrowdInput {
  /** Number of distinct users who checked in at this venue for this event. */
  checkins: number
  /** Number of users who marked themselves as watching this event here. */
  watchers: number
  /** Venue capacity — used to derive a percentage fill level. */
  capacity?: number | null
}

export interface CrowdScore {
  /** Raw composite score (0–100). */
  score: number
  /** Human-readable label derived from the score. */
  label: "Quiet" | "Getting busy" | "Busy" | "Packed"
  /** Percentage of capacity filled, if capacity is known. */
  fillPercent: number | null
}

/**
 * Returns a composite crowd score for a venue event combination.
 * Checkins are weighted higher than passive watchers.
 */
export function computeCrowdScore(input: CrowdInput): CrowdScore {
  const weighted = input.checkins * 3 + input.watchers
  // Normalise to 0-100 using a soft ceiling of 30 (beyond that everything is "Packed")
  const score = Math.min(100, Math.round((weighted / 30) * 100))

  const label: CrowdScore["label"] =
    score >= 75 ? "Packed" :
    score >= 45 ? "Busy" :
    score >= 20 ? "Getting busy" :
    "Quiet"

  const fillPercent =
    input.capacity != null && input.capacity > 0
      ? Math.min(100, Math.round(((input.checkins + input.watchers) / input.capacity) * 100))
      : null

  return { score, label, fillPercent }
}

/** Returns true when the crowd score warrants a "popular" badge. */
export function isCrowdPopular(score: CrowdScore): boolean {
  return score.score >= 45
}

/** Formats a watcher count for display, e.g. "12 watching here". */
export function formatWatcherCount(count: number): string {
  if (count === 0) return "No one checked in yet"
  if (count === 1) return "1 person watching here"
  return `${count} people watching here`
}

export type CrowdLevel = "quiet" | "getting-busy" | "busy" | "packed" | null

/**
 * Derives a CrowdLevel label from NearbyVenueCard signal fields.
 * Returns null when there are no reliable signals to derive from.
 * Used by CrowdLevelChip and WatchHereTonight.
 */
export function deriveCrowdLevel(input: {
  checkedInCount?: number | null
  watchingHereCount?: number | null
  showingNow?: boolean
  operatorMarkedBusy?: boolean
}): CrowdLevel {
  if (input.operatorMarkedBusy) return "packed"

  const checkins = input.checkedInCount ?? 0
  const watchers = input.watchingHereCount ?? 0
  const total = checkins * 3 + watchers

  if (!input.showingNow && total === 0) return null

  if (total >= 22) return "packed"
  if (total >= 12) return "busy"
  if (total >= 4 || input.showingNow) return "getting-busy"
  return "quiet"
}
