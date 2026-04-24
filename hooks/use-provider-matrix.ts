"use client"

// hooks/use-provider-matrix.ts
// Section 13 — Client-side provider routing queries.
//
// Wraps provider-routing.ts in a React hook so debug components and dev tooling
// can inspect routing decisions without importing the service-layer lib directly.
//
// Rules:
//   - Components MUST NOT use this hook to select a provider and call it.
//     Provider selection is server-side only (see lib/provider-fallback.ts).
//   - This hook is for display and debug purposes: DevTools, CoverageNote, etc.
//   - No fetching. Routing decisions are computed synchronously.

import { useMemo } from "react"
import {
  routeProvider,
  shouldUseFallback,
  fallbackConfidence,
  type ProviderFeature,
  type ProviderRoutingDecision,
} from "@/lib/provider-routing"
import { deriveSportKey } from "@/lib/coverage-resolver"

export type UseProviderMatrixResult = {
  /** Get the full routing decision for a feature */
  getRouting: (feature: ProviderFeature) => ProviderRoutingDecision
  /**
   * True when a fallback provider exists and fallback is permitted
   * for this feature (i.e. mode is not "primary_only" or "editorial").
   */
  hasFallback: (feature: ProviderFeature) => boolean
  /** Confidence level that would apply if the fallback were used */
  fallbackLevel: (feature: ProviderFeature) => "high" | "medium" | "low"
  /** The canonical sport key derived from the raw sport string */
  sportKey: string
}

/**
 * React hook for inspecting provider routing decisions.
 * Intended for debug components and dev tooling — not for executing fetches.
 *
 * @param rawSport      Raw sport string from the API
 * @param competitionId The league/competition ID, or null
 *
 * @example
 * const { getRouting } = useProviderMatrix(event.strSport, event.idLeague)
 * const decision = getRouting("lineups")
 * // decision.primary, decision.fallback, decision.mode, decision.confidence
 */
export function useProviderMatrix(
  rawSport: string | null | undefined,
  competitionId: string | number | null | undefined,
): UseProviderMatrixResult {
  const sportKey = useMemo(() => deriveSportKey(rawSport), [rawSport])
  const compId = competitionId != null ? String(competitionId) : null

  const getRouting = useMemo(
    () => (feature: ProviderFeature) => routeProvider(feature, sportKey, compId),
    [sportKey, compId],
  )

  const hasFallback = useMemo(
    () => (feature: ProviderFeature) => {
      const decision = routeProvider(feature, sportKey, compId)
      return shouldUseFallback(decision, true)
    },
    [sportKey, compId],
  )

  const fallbackLevel = useMemo(
    () => (feature: ProviderFeature) => {
      const decision = routeProvider(feature, sportKey, compId)
      return fallbackConfidence(decision)
    },
    [sportKey, compId],
  )

  return { getRouting, hasFallback, fallbackLevel, sportKey }
}
