// lib/coverage-resolver.ts
// Section 13 — Coverage Resolver.
//
// Provides two functions consumed by the match-center API route and client hooks:
//   - deriveSportKey()               — normalise a raw sport string to a canonical key
//   - buildMatchCenterCoverageHints() — produce the full CoverageHint map for a match
//
// Rules:
//   - No I/O. Both functions are pure and deterministic.
//   - deriveSportKey must be robust to null, undefined, and creative spellings.
//   - buildMatchCenterCoverageHints drives CoverageFeature visibility on the client.

import { getFeatureCoverage, type CoverageFeature } from "@/lib/coverage-matrix"
import type { MatchCenterCoverageHints, CoverageHint } from "@/types/coverage"

// ── Sport key normalisation ────────────────────────────────────────────────

/**
 * All features that the match-center coverage hint map covers.
 * Must stay in sync with CoverageFeature in lib/coverage-matrix.ts.
 */
const ALL_MATCH_CENTER_FEATURES: CoverageFeature[] = [
  "event_detail",
  "lineups",
  "timeline",
  "stats",
  "standings",
  "tv",
  "highlights",
  "live_scores",
  "match_events",
  "h2h",
  "insights",
  "odds",
  "tickets",
  "venues",
]

// Canonical sport key aliases — maps any provider variation to our internal key.
const SPORT_KEY_MAP: Record<string, string> = {
  // Soccer / Football
  soccer:            "soccer",
  football:          "soccer",
  "american soccer": "soccer",
  "association football": "soccer",
  futbol:            "soccer",

  // American Football
  "american football": "american_football",
  americanfootball:    "american_football",
  nfl:                 "american_football",

  // Basketball
  basketball:          "basketball",
  nba:                 "basketball",

  // Cricket
  cricket:             "cricket",
  ipl:                 "cricket",

  // Rugby
  rugby:               "rugby",
  "rugby union":       "rugby",
  "rugby league":      "rugby",

  // Baseball
  baseball:            "baseball",
  mlb:                 "baseball",

  // Ice Hockey
  "ice hockey":        "ice_hockey",
  icehockey:           "ice_hockey",
  hockey:              "ice_hockey",
  nhl:                 "ice_hockey",

  // Tennis
  tennis:              "tennis",
  "tennis (wta)":      "tennis",
  "tennis (atp)":      "tennis",

  // Other
  golf:                "golf",
  motorsport:          "motorsport",
  "motor sport":       "motorsport",
  formula1:            "motorsport",
  "formula 1":         "motorsport",
  mma:                 "mma",
  boxing:              "boxing",
  cycling:             "cycling",
}

/**
 * Normalise a raw sport string from any provider into a canonical sport key.
 * Returns "soccer" for null/undefined/unrecognised (safest fallback since it
 * has the most complete coverage matrix).
 */
export function deriveSportKey(rawSport: string | null | undefined): string {
  if (!rawSport) return "soccer"
  const normalised = rawSport.trim().toLowerCase()
  return SPORT_KEY_MAP[normalised] ?? normalised.replace(/\s+/g, "_")
}

// ── Coverage hint builder ──────────────────────────────────────────────────

/**
 * Build a full MatchCenterCoverageHints map for embedding in MatchCenterResponse.
 * The client uses this map to decide which tabs to show without an extra API call.
 *
 * @param sportKey      Canonical sport key from deriveSportKey()
 * @param competitionId The league/competition ID, or null
 */
export function buildMatchCenterCoverageHints(
  sportKey: string,
  competitionId: string | null | undefined,
): MatchCenterCoverageHints {
  const hints: MatchCenterCoverageHints = {}

  for (const feature of ALL_MATCH_CENTER_FEATURES) {
    const coverage = getFeatureCoverage(feature, sportKey, competitionId)
    const hint: CoverageHint = {
      feature,
      level: coverage.level,
      supported: coverage.level !== "none",
      hasLive: coverage.hasLive,
      primaryProvider: coverage.primaryProvider,
    }
    hints[feature] = hint
  }

  return hints
}
