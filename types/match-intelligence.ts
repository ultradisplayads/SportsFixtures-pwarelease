// ── Section 03 Domain Types — Match Intelligence ─────────────────────────────
//
// These types are the single source of truth for all match-center data shapes.
// Every tab, panel, and hook must consume these types — never raw provider shapes.

export type MatchFreshness = "live" | "near-live" | "cached" | "stale" | "unknown"

export type DataConfidence = "high" | "medium" | "low"

export type ProviderSource =
  | "thesportsdb"
  | "api-sports"
  | "derived"
  | "editorial"
  | "external"
  | "internal"
  | "sf_api"

/** Envelope that wraps every piece of match-center data with provenance metadata. */
export type MatchIntelligenceEnvelope<T> = {
  data: T | null
  source: ProviderSource
  freshness: MatchFreshness
  confidence: DataConfidence
  fetchedAt?: string
  staleAt?: string
  partial?: boolean
  unavailableReason?: string
}

/** All tabs available in the match center. UI only shows tabs that pass shouldShowTab(). */
export type MatchCenterTab =
  | "overview"
  | "lineups"
  | "timeline"
  | "stats"
  | "standings"
  | "tv"
  | "highlights"
  | "insights"
  | "h2h"
  | "predict"
  | "odds"
  | "tickets"
  | "venues"

/** Granular phase of a match, derived from provider status strings. */
export type MatchStatusPhase =
  | "scheduled"
  | "lineups_expected"
  | "lineups_confirmed"
  | "live_first_half"
  | "half_time"
  | "live_second_half"
  | "extra_time"
  | "penalties"
  | "full_time"
  | "postponed"
  | "cancelled"

// ── Lineups ───────────────────────────────────────────────────────────────────

export type MatchLineups = {
  home: MatchLineupsTeam
  away: MatchLineupsTeam
  confirmed: boolean
  source: ProviderSource
}

export type MatchLineupsTeam = {
  name: string
  badge: string
  formation: string
  goalkeeper: MatchPlayer | null
  defenders: MatchPlayer[]
  midfielders: MatchPlayer[]
  forwards: MatchPlayer[]
  substitutes: MatchPlayer[]
}

export type MatchPlayer = {
  name: string
  position: string
  image?: string
  country?: string
}

// ── Timeline ──────────────────────────────────────────────────────────────────

export type MatchTimelineEvent = {
  id: string
  minute?: number
  extraMinute?: number
  side?: "home" | "away" | "neutral"
  type:
    | "goal"
    | "own_goal"
    | "penalty_goal"
    | "missed_penalty"
    | "yellow_card"
    | "red_card"
    | "second_yellow"
    | "substitution"
    | "var"
    | "kickoff"
    | "half_time"
    | "full_time"
    | "extra_time_start"
    | "penalties_start"
    | "other"
  title: string
  description?: string
  playerName?: string
  assistName?: string
  source: ProviderSource
}

// ── Statistics ────────────────────────────────────────────────────────────────

export type MatchStatItem = {
  label: string
  home: number | string
  away: number | string
  homePercent?: number   // pre-calculated 0–100 for bar rendering
  type?: "percentage" | "count" | "text"
}

// ── Standings ─────────────────────────────────────────────────────────────────

export type MatchStandingsRow = {
  rank: number
  teamId: string
  teamName: string
  teamBadge?: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  form?: string
  isHomeTeam?: boolean
  isAwayTeam?: boolean
}

// ── TV / Where-to-watch ───────────────────────────────────────────────────────

export type MatchTvInfo = {
  channels: MatchTvChannel[]
  source: ProviderSource
}

export type MatchTvChannel = {
  id?: string
  name: string
  country?: string
  logo?: string
}

// ── Highlights ────────────────────────────────────────────────────────────────

export type MatchHighlightItem = {
  id: string
  title: string
  url: string
  thumbnail?: string
  provider: ProviderSource
  publishedAt?: string
}

// ── Insights ─────────────────────────────────────────────────────────────────

export type MatchInsightItem = {
  id: string
  type: "injury" | "prediction" | "form" | "context" | "editorial"
  title: string
  description: string
  source: ProviderSource
  confidence: DataConfidence
}
