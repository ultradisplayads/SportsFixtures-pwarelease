// lib/feature-flags.ts
// Section 12 — Feature Flag Helpers
//
// All feature flag reads go through these helpers.
// Do NOT scatter boolean checks around UI files — call isFeatureEnabled() instead.
// Flags are operator-controlled and must map to real product behavior.

import type { FeatureFlagDto, FeatureFlagKey } from "@/types/control-plane"

/**
 * Returns true if the given flag exists and is enabled.
 * Returns false if flags is null/undefined or the key is not found
 * (safe default = disabled/off, never accidentally enabled).
 */
export function isFeatureEnabled(
  flags: FeatureFlagDto[] | null | undefined,
  key: FeatureFlagKey,
): boolean {
  if (!flags) return false
  const flag = flags.find((f) => f.key === key)
  return flag ? Boolean(flag.enabled) : false
}

/**
 * Returns the internal operator note for a flag, or null if not found.
 * Notes are never shown to end users — they are for admin context only.
 */
export function getFeatureFlagNote(
  flags: FeatureFlagDto[] | null | undefined,
  key: FeatureFlagKey,
): string | null {
  return flags?.find((f) => f.key === key)?.notes ?? null
}

/**
 * Returns all enabled flag keys as a Set for O(1) lookups.
 * Use when checking multiple flags in a single render pass.
 */
export function getEnabledFlagKeys(
  flags: FeatureFlagDto[] | null | undefined,
): Set<FeatureFlagKey> {
  const result = new Set<FeatureFlagKey>()
  for (const f of flags ?? []) {
    if (f.enabled) result.add(f.key)
  }
  return result
}

/**
 * Returns a flags array with safe defaults applied for any missing keys.
 * All missing keys default to enabled=false (opt-in, not opt-out).
 */
export function withFlagDefaults(
  flags: FeatureFlagDto[] | null | undefined,
): FeatureFlagDto[] {
  const ALL_KEYS: FeatureFlagKey[] = [
    "homepage_news_enabled",
    "ticker_enabled",
    "secondary_ticker_enabled",
    "venue_discovery_enabled",
    "premium_page_enabled",
    "advanced_match_center_enabled",
    "world_cup_mode_enabled",
    "predictions_enabled",
    "odds_enabled",
    "highlights_enabled",
  ]
  const existing = new Map((flags ?? []).map((f) => [f.key, f]))
  return ALL_KEYS.map((key) => existing.get(key) ?? { key, enabled: false, notes: null })
}
