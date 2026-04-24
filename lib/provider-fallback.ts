// lib/provider-fallback.ts
// Section 13 — Provider Fallback Executor
//
// Implements the runtime fallback logic described by ProviderRoutingDecision.
// This is the ONLY place in the codebase that executes a provider call with
// automatic fallback. All service-layer fetch functions should delegate here
// rather than implementing their own try/fallback patterns.
//
// Rules:
//   - "primary_only" mode: no fallback is ever attempted.
//   - "editorial" mode: no external provider is called at all.
//   - "primary_first": primary is tried first; fallback is used only when primary
//     returns null/empty and a fallback provider is defined.
//   - "merged": both providers are called in parallel; results are combined.
//   - Confidence is reduced by one level when fallback is used (see fallbackConfidence).
//   - The returned envelope always records which provider was actually used.

import {
  type ProviderRoutingDecision,
  shouldUseFallback,
  fallbackConfidence,
} from "@/lib/provider-routing"
import type { NormalizedEnvelope } from "@/types/contracts"

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProviderFetcher<T> = () => Promise<T | null>

export type FallbackResult<T> = {
  data: T | null
  usedFallback: boolean
  provider: string
  confidence: "high" | "medium" | "low"
}

// ── Core executor ─────────────────────────────────────────────────────────────

/**
 * Executes provider calls according to the routing decision.
 *
 * @param decision  Routing decision from routeProvider()
 * @param primary   Async fetcher for the primary provider
 * @param fallback  Async fetcher for the fallback provider (ignored when not needed)
 * @returns FallbackResult with the data, which provider was used, and final confidence
 *
 * Usage:
 *   const decision = routeProvider("lineups", sportKey, competitionId)
 *   const result = await executeWithFallback(decision, fetchTSDBLineups, fetchApiSportsLineups)
 */
export async function executeWithFallback<T>(
  decision: ProviderRoutingDecision,
  primary: ProviderFetcher<T>,
  fallback?: ProviderFetcher<T>,
): Promise<FallbackResult<T>> {
  // Editorial mode — primary is the SF internal store; no external calls
  if (decision.mode === "editorial") {
    const data = await primary()
    return {
      data,
      usedFallback: false,
      provider: decision.primary,
      confidence: decision.confidence,
    }
  }

  // Merged mode — call both in parallel and combine via provided merger
  if (decision.mode === "merged" && fallback) {
    const [primaryData, fallbackData] = await Promise.allSettled([primary(), fallback()])
    const pd = primaryData.status === "fulfilled" ? primaryData.value : null
    const fd = fallbackData.status === "fulfilled" ? fallbackData.value : null
    // Return primary data (merge logic belongs in the caller — this executor
    // only provides raw results from both sources)
    const data = pd ?? fd
    return {
      data,
      usedFallback: pd === null && fd !== null,
      provider: pd !== null ? decision.primary : (decision.fallback ?? decision.primary),
      confidence: pd !== null ? decision.confidence : fallbackConfidence(decision),
    }
  }

  // Primary-only or primary-first — try primary
  let data: T | null = null
  let primaryFailed = false

  try {
    data = await primary()
    primaryFailed = data === null || (Array.isArray(data) && data.length === 0)
  } catch {
    primaryFailed = true
  }

  if (!primaryFailed) {
    return {
      data,
      usedFallback: false,
      provider: decision.primary,
      confidence: decision.confidence,
    }
  }

  // primary_only — never attempt fallback
  if (decision.mode === "primary_only" || !shouldUseFallback(decision, true) || !fallback) {
    return {
      data: null,
      usedFallback: false,
      provider: decision.primary,
      confidence: decision.confidence,
    }
  }

  // primary_first — attempt fallback
  let fallbackData: T | null = null
  try {
    fallbackData = await fallback()
  } catch {
    fallbackData = null
  }

  return {
    data: fallbackData,
    usedFallback: true,
    provider: decision.fallback ?? decision.primary,
    confidence: fallbackConfidence(decision),
  }
}

// ── Envelope builder ──────────────────────────────────────────────────────────

/**
 * Wraps a FallbackResult into a NormalizedEnvelope.
 * Service-layer functions should call this after executeWithFallback() to
 * produce the envelope shape that the API route and match-center tabs expect.
 */
export function wrapFallbackResult<T>(
  result: FallbackResult<T>,
  decision: ProviderRoutingDecision,
): Pick<NormalizedEnvelope<T>, "data" | "availability" | "fetchedAt"> & {
  source: string
  confidence: "high" | "medium" | "low"
  usedFallback: boolean
  maxAgeSeconds: number
} {
  const now = new Date().toISOString()
  return {
    data: result.data,
    availability: result.data === null
      ? "unavailable"
      : Array.isArray(result.data) && result.data.length === 0
        ? "empty"
        : "full",
    fetchedAt: now,
    source: result.provider,
    confidence: result.confidence,
    usedFallback: result.usedFallback,
    maxAgeSeconds: decision.maxAgeSeconds,
  }
}
