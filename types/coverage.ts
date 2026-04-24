// types/coverage.ts
// Section 13 — Coverage hint types.
//
// These types describe per-feature availability hints that are embedded in the
// MatchCenterResponse so the client can make tab-visibility decisions without
// an extra round-trip to /api/coverage.

import type { CoverageFeature, CoverageLevel } from "@/lib/coverage-matrix"

// Re-export so consumers can import CoverageLevel from @/types/coverage directly
export type { CoverageLevel, CoverageFeature } from "@/lib/coverage-matrix"

// ── Coverage hint ─────────────────────────────────────────────────────────────

/**
 * A single feature-level availability hint for a given sport/competition.
 * Embedded in MatchCenterResponse.coverageHints.
 */
export type CoverageHint = {
  feature: CoverageFeature
  level: CoverageLevel
  /** True when the feature is fully or partially supported (not "none"). */
  supported: boolean
  /** True when the feature has live/near-live data for this sport. */
  hasLive: boolean
  /** Which provider is the primary source for this feature. */
  primaryProvider: string
}

// ── Match-center coverage hints ───────────────────────────────────────────────

/**
 * A map of all coverage hints for a match-center response.
 * Keyed by CoverageFeature for O(1) client lookup.
 */
export type MatchCenterCoverageHints = Partial<Record<CoverageFeature, CoverageHint>>
