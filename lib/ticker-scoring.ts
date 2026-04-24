// lib/ticker-scoring.ts
// Section 15.B — Ticker item scoring algorithm.
//
// Canonical scoring lives here. lib/ticker-engine.ts re-exports scoreTickerItem
// from this module so existing importers do not break.
//
// Scoring rules:
//   priority:  critical=100  high=60  normal=30  low=10
//   freshness: live=+40  updated=+15
//   featured:  +15
//
// Higher score = displayed earlier in each rail.

import type { TickerItem, TickerPriority, TickerFreshness, TickerItemType } from "@/types/ticker"

const PRIORITY_SCORES: Record<TickerPriority, number> = {
  critical: 100,
  high:     60,
  normal:   30,
  low:      10,
}

const FRESHNESS_SCORES: Record<TickerFreshness, number> = {
  live:    40,
  updated: 15,
  stale:   0,
  static:  0,
  unknown: 0,
}

// Section 15.B — Type bonuses: live match items surface above same-priority news.
const TYPE_BONUS: Partial<Record<TickerItemType, number>> = {
  live_score:    20,
  match_event:   15,
  kickoff:       10,
  result:        10,
}

export function scoreTickerItem(item: TickerItem): number {
  let score = PRIORITY_SCORES[item.priority] ?? 30
  if (item.freshness) score += FRESHNESS_SCORES[item.freshness] ?? 0
  if (item.type) score += TYPE_BONUS[item.type] ?? 0
  if (item.featured) score += 15
  return score
}

/**
 * Sort a list of items by descending score.
 * Returns a new array — does not mutate the input.
 */
export function sortTickerItems(items: TickerItem[]): TickerItem[] {
  return [...items].sort((a, b) => scoreTickerItem(b) - scoreTickerItem(a))
}
