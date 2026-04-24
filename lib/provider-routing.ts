// lib/provider-routing.ts
// Section 13 — Provider & Coverage Matrix (centralized service-layer truth)
//
// This is the single place the service layer decides:
//   - which provider to call for a given feature
//   - what the fallback is
//   - whether fallback is allowed (some features must not fallback — doing so
//     would inflate confidence or corrupt meaning)
//   - freshness expectations
//   - confidence level
//
// Rules:
//   - Frontend components MUST NOT choose providers directly.
//   - Service-layer functions import routeProvider() and follow its decision.
//   - Fallback is only allowed when the fallback does NOT mislead the user.
//   - Competition-level overrides win over sport-level defaults.
//   - Editorial/internal-primary features are always routed to the sf (internal) provider.
//   - This module has no I/O — it returns routing decisions only.

import type { ProviderSource } from "@/types/match-intelligence"

// ── Feature Classes ────────────────────────────────────────────────────────────

export type ProviderFeature =
  | "event_detail"
  | "lineups"
  | "timeline"
  | "stats"
  | "standings"
  | "tv"
  | "highlights"
  | "live_scores"
  | "ticker_feed"
  | "breaking_news"
  | "tv_now"
  | "match_events"
  | "h2h"
  | "insights"
  | "odds"
  | "tickets"
  | "venues"
  | "push_notifications"
  | "venue_discovery"

// ── Priority Modes ─────────────────────────────────────────────────────────────

/**
 * primary_only   — never fall back; if primary fails, return unavailable.
 *                  Use when fallback would inflate confidence or change meaning.
 * primary_first  — try primary; fall back to secondary if primary is unavailable.
 * editorial      — always routed to SF internal; no external provider override.
 * merged         — combine results from multiple providers (deduplication required).
 */
export type ProviderPriorityMode =
  | "primary_only"
  | "primary_first"
  | "editorial"
  | "merged"

// ── Routing Decision ──────────────────────────────────────────────────────────

export type ProviderRoutingDecision = {
  primary: ProviderSource
  fallback: ProviderSource | null
  mode: ProviderPriorityMode
  /**
   * Maximum age (seconds) before the cached response is considered stale.
   * Service-layer code should propagate this into the envelope.
   */
  maxAgeSeconds: number
  /**
   * Baseline confidence level for data from the primary provider.
   * Fallback results should reduce this by one level.
   */
  confidence: "high" | "medium" | "low"
  /**
   * Note shown in internal audit logs and /api/health responses.
   * Not shown to end users.
   */
  note?: string
}

// ── Sport-Level Provider Defaults ─────────────────────────────────────────────

type SportFeatureMap = Record<ProviderFeature, ProviderRoutingDecision>

const SOCCER_ROUTING: SportFeatureMap = {
  event_detail:       { primary: "thesportsdb", fallback: null,           mode: "primary_only",  maxAgeSeconds: 30,   confidence: "high",   note: "SF API proxies TSDB" },
  lineups:            { primary: "thesportsdb", fallback: "api-sports",   mode: "primary_first", maxAgeSeconds: 300,  confidence: "high" },
  timeline:           { primary: "thesportsdb", fallback: null,           mode: "primary_only",  maxAgeSeconds: 30,   confidence: "high" },
  stats:              { primary: "thesportsdb", fallback: "api-sports",   mode: "primary_first", maxAgeSeconds: 60,   confidence: "high" },
  standings:          { primary: "thesportsdb", fallback: null,           mode: "primary_only",  maxAgeSeconds: 900,  confidence: "high" },
  tv:                 { primary: "editorial",   fallback: null,           mode: "editorial",     maxAgeSeconds: 3600, confidence: "medium", note: "TV schedules are SF-internal editorial data" },
  highlights:         { primary: "thesportsdb", fallback: "editorial",    mode: "primary_first", maxAgeSeconds: 3600, confidence: "medium" },
  live_scores:        { primary: "thesportsdb", fallback: null,           mode: "primary_only",  maxAgeSeconds: 30,   confidence: "high" },
  ticker_feed:        { primary: "editorial",   fallback: null,           mode: "editorial",     maxAgeSeconds: 30,   confidence: "high",   note: "Ticker is SF-internal assembled feed — never a direct provider call" },
  breaking_news:      { primary: "editorial",   fallback: null,           mode: "editorial",     maxAgeSeconds: 60,   confidence: "high",   note: "Breaking news is SF-editorial only" },
  tv_now:             { primary: "editorial",   fallback: null,           mode: "editorial",     maxAgeSeconds: 60,   confidence: "medium", note: "TV-now listings are SF-editorial" },
  match_events:       { primary: "thesportsdb", fallback: null,           mode: "primary_only",  maxAgeSeconds: 30,   confidence: "high" },
  h2h:                { primary: "thesportsdb", fallback: null,           mode: "primary_first", maxAgeSeconds: 3600, confidence: "medium" },
  insights:           { primary: "derived",     fallback: "editorial",    mode: "editorial",     maxAgeSeconds: 900,  confidence: "medium", note: "Insights are derived from standings or curated editorially" },
  odds:               { primary: "external",    fallback: null,           mode: "primary_only",  maxAgeSeconds: 60,   confidence: "low",    note: "Odds from external partner" },
  tickets:            { primary: "external",    fallback: null,           mode: "primary_only",  maxAgeSeconds: 3600, confidence: "low",    note: "Tickets from external partner" },
  venues:             { primary: "editorial",   fallback: null,           mode: "editorial",     maxAgeSeconds: 86400, confidence: "medium", note: "Venue discovery is SF-internal" },
  push_notifications: { primary: "editorial",   fallback: null,           mode: "editorial",     maxAgeSeconds: 0,    confidence: "high",   note: "Push payloads are SF-internal" },
  venue_discovery:    { primary: "editorial",   fallback: null,           mode: "editorial",     maxAgeSeconds: 3600, confidence: "medium", note: "Venue data is SF-internal" },
}

const AMERICAN_FOOTBALL_ROUTING: SportFeatureMap = {
  ...SOCCER_ROUTING,
  lineups:       { primary: "thesportsdb", fallback: null, mode: "primary_first", maxAgeSeconds: 86400, confidence: "medium", note: "Only roster-level lineups — no match-day lineups" },
  timeline:      { primary: "thesportsdb", fallback: null, mode: "primary_first", maxAgeSeconds: 60,   confidence: "medium" },
  stats:         { primary: "thesportsdb", fallback: null, mode: "primary_first", maxAgeSeconds: 60,   confidence: "medium" },
  live_scores:   { primary: "thesportsdb", fallback: null, mode: "primary_first", maxAgeSeconds: 60,   confidence: "medium" },
}

const BASKETBALL_ROUTING: SportFeatureMap = {
  ...SOCCER_ROUTING,
  lineups:       { primary: "thesportsdb", fallback: null,           mode: "primary_first", maxAgeSeconds: 3600, confidence: "medium" },
  timeline:      { primary: "thesportsdb", fallback: null,           mode: "primary_first", maxAgeSeconds: 60,   confidence: "medium" },
  stats:         { primary: "thesportsdb", fallback: null,           mode: "primary_first", maxAgeSeconds: 60,   confidence: "medium" },
  live_scores:   { primary: "thesportsdb", fallback: null,           mode: "primary_first", maxAgeSeconds: 30,   confidence: "medium" },
}

const CRICKET_ROUTING: SportFeatureMap = {
  ...SOCCER_ROUTING,
  lineups:       { primary: "thesportsdb", fallback: null,           mode: "primary_first", maxAgeSeconds: 3600, confidence: "medium", note: "Playing XI for international/IPL only" },
  timeline:      { primary: "thesportsdb", fallback: null,           mode: "primary_first", maxAgeSeconds: 60,   confidence: "medium" },
  stats:         { primary: "thesportsdb", fallback: null,           mode: "primary_first", maxAgeSeconds: 60,   confidence: "medium" },
  live_scores:   { primary: "thesportsdb", fallback: null,           mode: "primary_first", maxAgeSeconds: 60,   confidence: "medium" },
}

// Generic fallback for unsupported sports
const GENERIC_ROUTING: SportFeatureMap = {
  ...SOCCER_ROUTING,
  lineups:       { primary: "thesportsdb", fallback: null,           mode: "primary_first", maxAgeSeconds: 3600, confidence: "low",    note: "Limited sport coverage" },
  timeline:      { primary: "thesportsdb", fallback: null,           mode: "primary_first", maxAgeSeconds: 60,   confidence: "low" },
  stats:         { primary: "thesportsdb", fallback: null,           mode: "primary_first", maxAgeSeconds: 60,   confidence: "low" },
  live_scores:   { primary: "thesportsdb", fallback: null,           mode: "primary_first", maxAgeSeconds: 60,   confidence: "low" },
  highlights:    { primary: "thesportsdb", fallback: null,           mode: "primary_first", maxAgeSeconds: 3600, confidence: "low" },
  match_events:  { primary: "thesportsdb", fallback: null,           mode: "primary_only",  maxAgeSeconds: 60,   confidence: "low" },
}

const SPORT_ROUTING: Record<string, SportFeatureMap> = {
  soccer:            SOCCER_ROUTING,
  american_football: AMERICAN_FOOTBALL_ROUTING,
  basketball:        BASKETBALL_ROUTING,
  cricket:           CRICKET_ROUTING,
}

// ── Competition-Level Overrides ────────────────────────────────────────────────
//
// Add competition IDs where the routing materially differs from the sport default.
// Only override fields that actually differ.

type CompetitionRoutingOverride = Partial<SportFeatureMap>

const COMPETITION_ROUTING_OVERRIDES: Record<string, CompetitionRoutingOverride> = {
  // Premier League — both providers confirmed
  "4328": {
    lineups: { primary: "thesportsdb", fallback: "api-sports", mode: "primary_first", maxAgeSeconds: 300,  confidence: "high" },
    stats:   { primary: "thesportsdb", fallback: "api-sports", mode: "primary_first", maxAgeSeconds: 60,   confidence: "high" },
  },
  // Champions League — both providers confirmed
  "4480": {
    lineups: { primary: "thesportsdb", fallback: "api-sports", mode: "primary_first", maxAgeSeconds: 300,  confidence: "high" },
    stats:   { primary: "thesportsdb", fallback: "api-sports", mode: "primary_first", maxAgeSeconds: 60,   confidence: "high" },
  },
  // World Cup — full tournament coverage
  "4429": {
    lineups: { primary: "thesportsdb", fallback: "api-sports", mode: "primary_first", maxAgeSeconds: 300,  confidence: "high" },
    stats:   { primary: "thesportsdb", fallback: "api-sports", mode: "primary_first", maxAgeSeconds: 60,   confidence: "high" },
  },
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the routing decision for a feature given the sport and optional
 * competition context.
 *
 * Service-layer code must call this before constructing any provider request.
 * Never let a component or hook choose a provider directly.
 *
 * @param feature       The feature being requested
 * @param sportKey      Canonical sport key (from deriveSportKey)
 * @param competitionId The league/competition ID, or null
 */
export function routeProvider(
  feature: ProviderFeature,
  sportKey: string | null | undefined,
  competitionId?: string | null,
): ProviderRoutingDecision {
  // Competition override wins
  if (competitionId) {
    const override = COMPETITION_ROUTING_OVERRIDES[competitionId]
    if (override?.[feature]) {
      return override[feature] as ProviderRoutingDecision
    }
  }

  // Sport-level defaults
  const sportMap = SPORT_ROUTING[(sportKey ?? "unknown")] ?? GENERIC_ROUTING
  return sportMap[feature]
}

/**
 * Returns true if the fallback provider should be used for this feature.
 * Only returns true when:
 *   - a fallback exists
 *   - the mode is "primary_first" or "merged" (never for "primary_only" or "editorial")
 *   - the primaryFailed flag is true (primary returned nothing useful)
 */
export function shouldUseFallback(
  decision: ProviderRoutingDecision,
  primaryFailed: boolean,
): boolean {
  if (!decision.fallback) return false
  if (decision.mode === "primary_only" || decision.mode === "editorial") return false
  return primaryFailed
}

/**
 * Reduces confidence by one level for fallback results.
 * Service-layer code must call this when returning fallback data.
 */
export function fallbackConfidence(
  decision: ProviderRoutingDecision,
): "high" | "medium" | "low" {
  const levels: Array<"high" | "medium" | "low"> = ["high", "medium", "low"]
  const idx = levels.indexOf(decision.confidence)
  return levels[Math.min(idx + 1, 2)]
}
