// Ticker Engine — centralized merging, scoring, filtering, channel assignment
// All ticker data must pass through this module before reaching the UI.
//
// Scoring and expiry logic live in their own modules; this file re-exports them
// so existing importers of ticker-engine continue to work unchanged.

import type { TickerItem, TickerConfig, TickerItemType } from "@/types/ticker"
import { scoreTickerItem } from "@/lib/ticker-scoring"
import { isTickerItemActive } from "@/lib/ticker-expiry"

// Re-export canonical implementations from extracted modules for backward compat
export { scoreTickerItem } from "@/lib/ticker-scoring"
export { isTickerItemActive, filterActiveTickerItems, filterActiveItems } from "@/lib/ticker-expiry"

// Channel membership rules
const PRIMARY_TYPES: TickerItemType[] = ["live_score", "match_event", "kickoff", "result"]
const SECONDARY_TYPES: TickerItemType[] = ["breaking_news", "tv_now", "promo", "venue_message", "sponsor"]

export function assignChannel(item: TickerItem): TickerItem {
  if (PRIMARY_TYPES.includes(item.type)) {
    return { ...item, channel: "primary" }
  }
  if (SECONDARY_TYPES.includes(item.type)) {
    return { ...item, channel: "secondary" }
  }
  return item
}

export function normalizeAndSortTickerItems(items: TickerItem[], limit: number): TickerItem[] {
  return items
    .filter((item) => isTickerItemActive(item))
    .sort((a, b) => scoreTickerItem(b) - scoreTickerItem(a))
    .slice(0, limit)
}

export function applyConfigFilters(items: TickerItem[], config: TickerConfig): TickerItem[] {
  return items.filter((item) => {
    // Sport filter
    if (config.allowedSports && config.allowedSports.length > 0) {
      if (item.sport && !config.allowedSports.includes(item.sport.toLowerCase())) {
        return false
      }
    }

    // Type filters based on config flags
    if (item.type === "live_score" || item.type === "match_event") {
      if (!config.includeLiveScores) return false
    }
    if (item.type === "kickoff" || item.type === "result") {
      if (!config.includeLiveScores) return false
    }
    if (item.type === "breaking_news") {
      if (!config.includeBreakingNews) return false
    }
    if (item.type === "tv_now") {
      if (!config.includeTvNow) return false
    }
    if (item.type === "promo") {
      if (!config.includePromos) return false
    }
    if (item.type === "venue_message") {
      if (!config.includeVenueMessages) return false
    }
    if (item.type === "sponsor") {
      if (!config.includeSponsors) return false
    }

    return true
  })
}

/**
 * Canonical alias per Section 15.B spec.
 * Splits a mixed item list into primary and secondary channels,
 * applying config filters, scoring, and max-item limits.
 */
export const splitTickerChannels = buildChannels

export function buildChannels(
  allItems: TickerItem[],
  config: TickerConfig,
): { primary: TickerItem[]; secondary: TickerItem[] } {
  const filtered = applyConfigFilters(allItems, config)
  const assigned = filtered.map(assignChannel)

  const primaryItems = assigned.filter((i) => i.channel === "primary")
  const secondaryItems = assigned.filter((i) => i.channel === "secondary")

  return {
    primary: normalizeAndSortTickerItems(primaryItems, config.maxPrimaryItems),
    secondary: normalizeAndSortTickerItems(secondaryItems, config.maxSecondaryItems),
  }
}
