// types/provider-matrix.ts
// Section 13 — Provider Matrix canonical type surface.
//
// Re-exports all provider routing and coverage types so consumers import
// from a single location. Never define new types here — add them to
// lib/provider-routing.ts or types/coverage.ts first, then re-export.

export type {
  ProviderFeature,
  ProviderPriorityMode,
  ProviderRoutingDecision,
} from "@/lib/provider-routing"

/**
 * ProviderRoute — the resolved routing shape used by ProviderNote debug component.
 * Derived from ProviderRoutingDecision but with UI-friendly field names.
 */
export type ProviderRoute = {
  primary: string
  fallback?: string | null
  strategy: string
  reason?: string | null
}

export type {
  CoverageLevel,
  CoverageFeature,
  FeatureCoverage,
} from "@/lib/coverage-matrix"

export type {
  CoverageHint,
  MatchCenterCoverageHints,
} from "@/types/coverage"
