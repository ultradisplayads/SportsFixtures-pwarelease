// Ticker System — normalized domain types
// All ticker data flows through these types regardless of source.

export type TickerMode = "off" | "single" | "dual"

export type TickerItemType =
  | "live_score"
  | "match_event"
  | "kickoff"
  | "result"
  | "breaking_news"
  | "tv_now"
  | "promo"
  | "venue_message"
  | "sponsor"

export type TickerChannel = "primary" | "secondary"

// Canonical aliases — prefer TickerPriority / TickerFreshness / TickerSource in new code.
// The *Item* aliases remain for backward compatibility.
export type TickerPriority     = "critical" | "high" | "normal" | "low"
export type TickerFreshness    = "live" | "updated" | "stale" | "static" | "unknown"
export type TickerSource       = "thesportsdb" | "api-sports" | "sf" | "news" | "tv" | "editorial" | "promo" | "strapi" | "sf_api" | "system" | "derived"

/** @deprecated Use TickerPriority */
export type TickerItemPriority = TickerPriority
/** @deprecated Use TickerFreshness */
export type TickerItemFreshness = TickerFreshness
/** @deprecated Use TickerSource */
export type TickerItemSource = TickerSource

export interface TickerItem {
  id: string
  type: TickerItemType
  channel: TickerChannel
  priority: TickerPriority
  label?: string
  headline: string
  subline?: string
  href?: string
  imageUrl?: string
  // Legacy field names — kept for backward compat with ticker-live.ts builders
  teamHome?: string
  teamAway?: string
  scoreHome?: string | number
  scoreAway?: string | number
  // Canonical field names per Section 15.A spec — use these in new code
  homeTeam?: string | null
  awayTeam?: string | null
  homeScore?: number | null
  awayScore?: number | null
  minute?: number | string | null
  source: TickerSource
  freshness?: TickerFreshness
  startsAt?: string
  expiresAt?: string
  sport?: string
  competitionId?: string
  eventId?: string
  featured?: boolean
  // Disclosure — required for sponsored/promo items per Section 15.B
  disclosure?: "sponsored" | "promo" | null
}

/** Alias for TickerConfig — used in control-plane data contracts */
export type TickerControlDto = TickerConfig

export interface TickerConfig {
  mode: TickerMode
  primaryEnabled: boolean
  secondaryEnabled: boolean
  includeLiveScores: boolean
  includeBreakingNews: boolean
  includeTvNow: boolean
  includePromos: boolean
  includeVenueMessages: boolean
  includeSponsors: boolean
  maxPrimaryItems: number
  maxSecondaryItems: number
  allowedSports?: string[]
  refreshSeconds?: number
  emptyMode?: "hide" | "show_message" | "fallback_real"
}

export interface TickerFeedResponse {
  config: TickerConfig
  primary: TickerItem[]
  secondary: TickerItem[]
  generatedAt: string
}

// Default config — can be overridden by Strapi or env
export const DEFAULT_TICKER_CONFIG: TickerConfig = {
  mode: "dual",
  primaryEnabled: true,
  secondaryEnabled: true,
  includeLiveScores: true,
  includeBreakingNews: true,
  includeTvNow: true,
  includePromos: false,
  includeVenueMessages: false,
  includeSponsors: false,
  maxPrimaryItems: 20,
  maxSecondaryItems: 10,
  allowedSports: [],
  refreshSeconds: 30,
  emptyMode: "fallback_real",
}
