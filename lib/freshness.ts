// lib/freshness.ts
// Derives DataFreshness and DataAvailability from runtime metadata.
// Used by service layer and API routes to annotate outgoing envelopes.
// The frontend must not re-derive these — it should consume the envelope value.

import type { DataFreshness, DataAvailability, ContractWarning } from "@/types/contracts";

// ── Freshness derivation ──────────────────────────────────────────────────

/**
 * Derive freshness from when data was fetched and a declared max-age.
 *
 * - live feeds: max age 30s by default
 * - non-live feeds: max age 3600s (1h) by default
 * - age 0–limit    → "live" | "cached"
 * - age limit–2×limit → "near-live" | "stale"
 * - age > 2×limit  → "stale"
 * - no fetchedAt   → "unknown"
 */
export function deriveFreshness(input: {
  fetchedAt?: string | null;
  maxAgeSeconds?: number;
  live?: boolean;
}): DataFreshness {
  if (!input.fetchedAt) return "unknown";

  let ageSeconds: number;
  try {
    ageSeconds = (Date.now() - new Date(input.fetchedAt).getTime()) / 1000;
  } catch {
    return "unknown";
  }

  if (!Number.isFinite(ageSeconds) || ageSeconds < 0) return "unknown";

  const isLive = Boolean(input.live);
  const limit = input.maxAgeSeconds ?? (isLive ? 30 : 3600);

  if (ageSeconds <= limit) return isLive ? "live" : "cached";
  if (ageSeconds <= limit * 2) return isLive ? "near_live" : "stale";
  return "stale";
}

/**
 * Mark data as "static" — for reference data that never changes
 * (e.g. country list, sport list, enum values).
 */
export function staticFreshness(): DataFreshness {
  return "static";
}

// ── Availability derivation ───────────────────────────────────────────────

/**
 * Derive availability from the shape of the data and any warnings.
 *
 * - null/undefined  → "unavailable"
 * - unsupported     → "unsupported"  (pass unsupported: true in input)
 * - empty array     → "empty"
 * - has warnings    → "partial"
 * - otherwise       → "full"
 */
export function deriveAvailability(input: {
  data: unknown;
  warnings?: ContractWarning[];
  unsupported?: boolean;
}): DataAvailability {
  if (input.unsupported) return "unsupported";
  if (input.data == null) return "unavailable";
  if (Array.isArray(input.data) && input.data.length === 0) return "empty";
  if (input.warnings && input.warnings.length > 0) return "partial";
  return "full";
}

/**
 * Convenience: derive availability for a single nullable item.
 * Treats null as "unavailable", non-null with warnings as "partial".
 */
export function deriveItemAvailability(
  item: unknown,
  warnings?: ContractWarning[],
): DataAvailability {
  if (item == null) return "unavailable";
  if (warnings && warnings.length > 0) return "partial";
  return "full";
}

// ── Stale-at calculation ──────────────────────────────────────────────────

/**
 * Calculate when data with the given fetchedAt time will become stale.
 * Returns an ISO string or null if fetchedAt is absent.
 */
export function calcStaleAt(
  fetchedAt: string | null | undefined,
  maxAgeSeconds: number,
): string | null {
  if (!fetchedAt) return null;
  try {
    const fetched = new Date(fetchedAt).getTime();
    return new Date(fetched + maxAgeSeconds * 1000).toISOString();
  } catch {
    return null;
  }
}
