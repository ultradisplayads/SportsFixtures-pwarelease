// lib/coverage-matrix.ts
// Section 13 — Feature Coverage Matrix.
//
// Defines which features are supported at which level for each sport.
// The match-tabs component gates tab visibility using isFeatureSupported().
// The match-center API embeds coverage hints in the response envelope.
//
// Coverage levels:
//   full    — complete data, real-time when live
//   partial — some data available; may be incomplete or delayed
//   none    — feature is structurally unsupported for this sport
//
// Rules:
//   - No feature defaults to "full" across all sports without an explicit entry.
//   - "none" means the tab must be hidden — never show an empty shell.
//   - competition-level overrides take precedence over sport-level defaults.

// ── Types ──────────────────────────────────────────────────────────────────

export type CoverageLevel = "full" | "partial" | "limited" | "unavailable" | "none" | "unknown"

export type CoverageFeature =
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
  | "event_detail"

export type FeatureCoverage = {
  feature: CoverageFeature
  level: CoverageLevel
  /** Which provider is the primary source. */
  primaryProvider: string
  /** Whether this feature supports live/near-live data for this sport. */
  hasLive: boolean
  /** Human-readable disclosure note shown in debug tooling. */
  disclosure?: string
}

// ── Sport-level defaults ───────────────────────────────────────────────────
// Keyed by lowercase sport key. "soccer" is the most complete.

type SportMatrix = Partial<Record<CoverageFeature, Pick<FeatureCoverage, "level" | "primaryProvider" | "hasLive">>>

const SPORT_MATRIX: Record<string, SportMatrix> = {
  soccer: {
    event_detail:       { level: "full",    primaryProvider: "thesportsdb", hasLive: true  },
    lineups:            { level: "full",    primaryProvider: "thesportsdb", hasLive: true  },
    timeline:           { level: "full",    primaryProvider: "thesportsdb", hasLive: true  },
    stats:              { level: "full",    primaryProvider: "thesportsdb", hasLive: true  },
    standings:          { level: "full",    primaryProvider: "thesportsdb", hasLive: false },
    tv:                 { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    highlights:         { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    live_scores:        { level: "full",    primaryProvider: "thesportsdb", hasLive: true  },
    ticker_feed:        { level: "full",    primaryProvider: "thesportsdb", hasLive: true  },
    h2h:                { level: "full",    primaryProvider: "thesportsdb", hasLive: false },
    insights:           { level: "partial", primaryProvider: "derived",     hasLive: false },
    odds:               { level: "partial", primaryProvider: "external",    hasLive: true  },
    tickets:            { level: "partial", primaryProvider: "external",    hasLive: false },
    venues:             { level: "partial", primaryProvider: "internal",    hasLive: false },
    match_events:       { level: "full",    primaryProvider: "thesportsdb", hasLive: true  },
    push_notifications: { level: "partial", primaryProvider: "internal",    hasLive: true  },
    venue_discovery:    { level: "partial", primaryProvider: "internal",    hasLive: false },
  },
  american_football: {
    event_detail:  { level: "full",    primaryProvider: "thesportsdb", hasLive: true  },
    lineups:       { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    timeline:      { level: "partial", primaryProvider: "thesportsdb", hasLive: true  },
    stats:         { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    standings:     { level: "full",    primaryProvider: "thesportsdb", hasLive: false },
    highlights:    { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    live_scores:   { level: "full",    primaryProvider: "thesportsdb", hasLive: true  },
    h2h:           { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    insights:      { level: "none",    primaryProvider: "derived",     hasLive: false },
    tv:            { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    odds:          { level: "partial", primaryProvider: "external",    hasLive: true  },
    tickets:       { level: "partial", primaryProvider: "external",    hasLive: false },
    venues:        { level: "partial", primaryProvider: "internal",    hasLive: false },
  },
  basketball: {
    event_detail:  { level: "full",    primaryProvider: "thesportsdb", hasLive: true  },
    lineups:       { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    timeline:      { level: "partial", primaryProvider: "thesportsdb", hasLive: true  },
    stats:         { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    standings:     { level: "full",    primaryProvider: "thesportsdb", hasLive: false },
    highlights:    { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    live_scores:   { level: "full",    primaryProvider: "thesportsdb", hasLive: true  },
    h2h:           { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    insights:      { level: "none",    primaryProvider: "derived",     hasLive: false },
    tv:            { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    odds:          { level: "partial", primaryProvider: "external",    hasLive: true  },
    tickets:       { level: "partial", primaryProvider: "external",    hasLive: false },
    venues:        { level: "partial", primaryProvider: "internal",    hasLive: false },
  },
  cricket: {
    event_detail:  { level: "full",    primaryProvider: "thesportsdb", hasLive: true  },
    lineups:       { level: "full",    primaryProvider: "thesportsdb", hasLive: false },
    timeline:      { level: "none",    primaryProvider: "thesportsdb", hasLive: false },
    stats:         { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    standings:     { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    highlights:    { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    live_scores:   { level: "partial", primaryProvider: "thesportsdb", hasLive: true  },
    h2h:           { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    insights:      { level: "none",    primaryProvider: "derived",     hasLive: false },
    tv:            { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    odds:          { level: "partial", primaryProvider: "external",    hasLive: true  },
    tickets:       { level: "partial", primaryProvider: "external",    hasLive: false },
    venues:        { level: "partial", primaryProvider: "internal",    hasLive: false },
  },
  rugby: {
    event_detail:  { level: "full",    primaryProvider: "thesportsdb", hasLive: true  },
    lineups:       { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    timeline:      { level: "partial", primaryProvider: "thesportsdb", hasLive: true  },
    stats:         { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    standings:     { level: "full",    primaryProvider: "thesportsdb", hasLive: false },
    highlights:    { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    live_scores:   { level: "full",    primaryProvider: "thesportsdb", hasLive: true  },
    h2h:           { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    insights:      { level: "none",    primaryProvider: "derived",     hasLive: false },
    tv:            { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    odds:          { level: "partial", primaryProvider: "external",    hasLive: true  },
    tickets:       { level: "partial", primaryProvider: "external",    hasLive: false },
    venues:        { level: "partial", primaryProvider: "internal",    hasLive: false },
  },
  baseball: {
    event_detail:  { level: "full",    primaryProvider: "thesportsdb", hasLive: true  },
    lineups:       { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    timeline:      { level: "none",    primaryProvider: "thesportsdb", hasLive: false },
    stats:         { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    standings:     { level: "full",    primaryProvider: "thesportsdb", hasLive: false },
    highlights:    { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    live_scores:   { level: "partial", primaryProvider: "thesportsdb", hasLive: true  },
    h2h:           { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    insights:      { level: "none",    primaryProvider: "derived",     hasLive: false },
    tv:            { level: "partial", primaryProvider: "thesportsdb", hasLive: false },
    odds:          { level: "partial", primaryProvider: "external",    hasLive: true  },
    tickets:       { level: "partial", primaryProvider: "external",    hasLive: false },
    venues:        { level: "partial", primaryProvider: "internal",    hasLive: false },
  },
}

// ── Fallback defaults ──────────────────────────────────────────────────────
// Applied when a sport has no explicit matrix entry.

const FALLBACK_COVERAGE: Pick<FeatureCoverage, "level" | "primaryProvider" | "hasLive"> = {
  level: "partial",
  primaryProvider: "thesportsdb",
  hasLive: false,
}

const FEATURES_ALWAYS_NONE_FOR_UNKNOWN: CoverageFeature[] = [
  "insights",
]

// ── Competition-level overrides ────────────────────────────────────────────
// Specific league IDs that override the sport-level defaults.
// Format: competitionId → { feature: overrideLevel }

const COMPETITION_OVERRIDES: Record<string, Partial<Record<CoverageFeature, CoverageLevel>>> = {
  // Premier League — full live timeline + stats
  "4328": { timeline: "full", stats: "full", insights: "partial" },
  // La Liga
  "4335": { timeline: "full", stats: "full", insights: "partial" },
  // Champions League
  "4346": { timeline: "full", stats: "full", insights: "partial" },
  // Bundesliga
  "4331": { timeline: "full", stats: "partial", insights: "partial" },
  // Serie A
  "4332": { timeline: "full", stats: "partial", insights: "partial" },
  // Ligue 1
  "4334": { timeline: "partial", stats: "partial" },
  // MLS
  "4480": { insights: "partial" },
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Get the full coverage record for a feature, given sport + optional competition.
 * Competition-level overrides take precedence over sport-level defaults.
 */
export function getFeatureCoverage(
  feature: CoverageFeature,
  sportKey: string,
  competitionId?: string | null,
): FeatureCoverage {
  const sportMatrix = SPORT_MATRIX[sportKey] ?? {}
  const base = sportMatrix[feature] ?? (
    FEATURES_ALWAYS_NONE_FOR_UNKNOWN.includes(feature)
      ? { level: "none" as CoverageLevel, primaryProvider: "derived", hasLive: false }
      : FALLBACK_COVERAGE
  )

  // Apply competition-level override if present
  let level = base.level
  if (competitionId && COMPETITION_OVERRIDES[competitionId]) {
    const override = COMPETITION_OVERRIDES[competitionId][feature]
    if (override !== undefined) level = override
  }

  return {
    feature,
    level,
    primaryProvider: base.primaryProvider,
    hasLive: base.hasLive,
    disclosure: level === "none"
      ? `${feature} is not supported for ${sportKey}`
      : undefined,
  }
}

/**
 * Returns true when the feature has any coverage (level is not "none").
 * Use this to gate tab visibility in match-tabs.tsx.
 */
export function isFeatureSupported(
  feature: CoverageFeature,
  sportKey: string,
  competitionId?: string | null,
): boolean {
  return getFeatureCoverage(feature, sportKey, competitionId).level !== "none"
}

/**
 * Returns true only when the feature has full (non-partial) coverage.
 * Used to conditionally show "live" badges or enhanced UI states.
 */
export function isFeatureFullyCovered(
  feature: CoverageFeature,
  sportKey: string,
  competitionId?: string | null,
): boolean {
  return getFeatureCoverage(feature, sportKey, competitionId).level === "full"
}

/**
 * Returns a human-readable disclosure string for the feature coverage level.
 * Suitable for debug tooling and coverage notes shown to developers.
 */
export function getCoverageDisclosure(
  feature: CoverageFeature,
  sportKey: string,
  competitionId?: string | null,
): string {
  const coverage = getFeatureCoverage(feature, sportKey, competitionId)
  if (coverage.disclosure) return coverage.disclosure
  return `${feature}: ${coverage.level} (${coverage.primaryProvider})`
}
