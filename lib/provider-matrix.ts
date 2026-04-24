// lib/provider-matrix.ts
// Section 13 — Provider Matrix barrel.
//
// Single import surface combining coverage-matrix.ts and provider-routing.ts.
// Service-layer code that needs both coverage and routing decisions should
// import from here rather than importing both source files individually.
//
// Rule: this file is a barrel only — no logic here.

// ── Coverage matrix ───────────────────────────────────────────────────────────
export {
  getFeatureCoverage,
  isFeatureSupported,
  isFeatureFullyCovered,
  getCoverageDisclosure,
  type CoverageLevel,
  type CoverageFeature,
  type FeatureCoverage,
} from "@/lib/coverage-matrix"

// ── Provider routing ──────────────────────────────────────────────────────────
export {
  routeProvider,
  shouldUseFallback,
  fallbackConfidence,
  type ProviderFeature,
  type ProviderPriorityMode,
  type ProviderRoutingDecision,
} from "@/lib/provider-routing"

// ── Coverage resolver ─────────────────────────────────────────────────────────
export {
  deriveSportKey,
  buildMatchCenterCoverageHints,
} from "@/lib/coverage-resolver"
