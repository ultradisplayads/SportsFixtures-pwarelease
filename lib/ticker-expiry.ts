// lib/ticker-expiry.ts
// Section 15.B — Ticker item expiry / activity checks.
//
// Canonical implementation lives here. lib/ticker-engine.ts re-exports
// isTickerItemActive from this module so existing importers do not break.
//
// Rules:
//   - Items with no expiresAt are always considered active.
//   - Items with a past expiresAt are inactive and must be filtered out
//     before the feed reaches the UI.
//   - Items with freshness="stale" are never promoted above normal priority
//     by the engine, but are still displayed until they explicitly expire.

import type { TickerItem } from "@/types/ticker"

/**
 * Returns true when the item is currently active (not yet expired).
 * @param item   The ticker item to test.
 * @param now    Optional override for the current timestamp (ms since epoch).
 *               Defaults to Date.now(). Inject for testability.
 */
export function isTickerItemActive(item: TickerItem, now = Date.now()): boolean {
  if (!item.expiresAt) return true
  const expires = new Date(item.expiresAt).getTime()
  // Use Number.isFinite to catch both NaN and Infinity from malformed dates
  if (!Number.isFinite(expires)) return true
  return expires > now
}

/**
 * Filter an item array to only active (non-expired) items.
 * Returns a new array — does not mutate the input.
 */
export function filterActiveItems(items: TickerItem[], now = Date.now()): TickerItem[] {
  return items.filter((item) => isTickerItemActive(item, now))
}

/**
 * Canonical alias for filterActiveItems per Section 15.B spec.
 */
export const filterActiveTickerItems = filterActiveItems

/**
 * Returns the number of milliseconds until the earliest item in the list
 * expires. Returns null if no items have an expiresAt.
 * Useful for scheduling the next feed refresh more tightly.
 */
export function msUntilNextExpiry(items: TickerItem[], now = Date.now()): number | null {
  let earliest: number | null = null
  for (const item of items) {
    if (!item.expiresAt) continue
    const t = new Date(item.expiresAt).getTime()
    if (isNaN(t) || t <= now) continue
    if (earliest === null || t < earliest) earliest = t
  }
  return earliest === null ? null : earliest - now
}
