// lib/asset-runtime.ts
// Section 08 — Runtime asset resolution helpers for NormalizedAssetSet.
//
// These utilities operate on the full NormalizedAssetSet shape produced by
// buildAssetSet() / normalizeX() in lib/asset-normalization.ts.
//
// SmartImage handles candidate retry at the UI layer.
// resolveAssetFromSet() is available for server-side / OG-image / test usage.

import type { NormalizedAssetSet, AssetResolutionResult } from "@/types/assets";

// ── Primary resolver ──────────────────────────────────────────────────────

/**
 * Synchronously resolve the best URL from a NormalizedAssetSet.
 * Returns the primary candidate and a full trace of all candidates tried.
 *
 * Note: this cannot validate that the URL loads successfully — that is handled
 * by SmartImage's onError retry loop at render time.
 */
export function resolveAssetFromSet(set: NormalizedAssetSet): AssetResolutionResult {
  const candidates = set.candidates ?? [];
  const primary = set.primary ?? candidates[0]?.url ?? null;

  return {
    src: primary,
    kind: set.kind ?? "generic",
    fallbackUsed: !primary,
    fallbackLabel: set.fallbackLabel ?? null,
    candidatesTried: candidates.map((c) => c.url),
    sourceField: candidates[0]?.sourceField ?? undefined,
  };
}

// ── Candidate accessor ────────────────────────────────────────────────────

/**
 * Return the URL at a specific candidate index.
 * Returns null if the index is out of range.
 */
export function getCandidateUrlAt(
  asset: NormalizedAssetSet,
  index: number,
): string | null {
  return asset.candidates?.[index]?.url ?? null;
}

// ── Convenience: best URL from set ───────────────────────────────────────

/**
 * Return the best available URL from a NormalizedAssetSet, or null.
 * Equivalent to resolveAssetFromSet(set).src but cheaper for simple callers.
 */
export function getBestAssetUrl(set: NormalizedAssetSet | null | undefined): string | null {
  if (!set) return null;
  return set.primary ?? set.candidates?.[0]?.url ?? null;
}
