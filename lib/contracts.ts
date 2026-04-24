// lib/contracts.ts
// Central envelope builder.  All internal API routes that emit a
// NormalizedEnvelope<T> must use makeEnvelope() — never build the object
// manually in 15 different places.

import type {
  NormalizedEnvelope,
  ProviderName,
  DataFreshness,
  DataAvailability,
  DataConfidence,
  ContractWarning,
} from "@/types/contracts";
import { deriveAvailability, deriveFreshness, calcStaleAt } from "@/lib/freshness";

// ── Primary builder ───────────────────────────────────────────────────────

/**
 * Build a fully typed NormalizedEnvelope.
 * All optional fields default to null/[] so callers never have to.
 */
export function makeEnvelope<T>(input: {
  data: T | null;
  source: ProviderName;
  freshness: DataFreshness;
  availability: DataAvailability;
  confidence?: DataConfidence;
  fetchedAt?: string | null;
  staleAt?: string | null;
  unavailableReason?: string | null;
  warnings?: ContractWarning[];
}): NormalizedEnvelope<T> {
  return {
    data: input.data,
    source: input.source,
    freshness: input.freshness,
    availability: input.availability,
    confidence: input.confidence,
    fetchedAt: input.fetchedAt ?? null,
    staleAt: input.staleAt ?? null,
    unavailableReason: input.unavailableReason ?? null,
    warnings: input.warnings ?? [],
  };
}

// ── Convenience builders ──────────────────────────────────────────────────

/**
 * Build an envelope for a successful fetch, deriving freshness and availability
 * automatically from the data and a declared max-age.
 */
export function makeSuccessEnvelope<T>(input: {
  data: T;
  source: ProviderName;
  fetchedAt?: string | null;
  maxAgeSeconds?: number;
  live?: boolean;
  confidence?: DataConfidence;
  warnings?: ContractWarning[];
}): NormalizedEnvelope<T> {
  const fetchedAt = input.fetchedAt ?? new Date().toISOString();
  const freshness = deriveFreshness({
    fetchedAt,
    maxAgeSeconds: input.maxAgeSeconds,
    live: input.live,
  });
  const availability = deriveAvailability({
    data: input.data,
    warnings: input.warnings,
  });
  const staleAt = calcStaleAt(fetchedAt, input.maxAgeSeconds ?? 3600);

  return makeEnvelope({
    data: input.data,
    source: input.source,
    freshness,
    availability,
    confidence: input.confidence ?? "high",
    fetchedAt,
    staleAt,
    warnings: input.warnings ?? [],
  });
}

/**
 * Build an envelope for a fetch that returned no data (empty array or null record).
 */
export function makeEmptyEnvelope<T>(input: {
  source: ProviderName;
  unavailableReason?: string;
  warnings?: ContractWarning[];
}): NormalizedEnvelope<T> {
  return makeEnvelope<T>({
    data: null,
    source: input.source,
    freshness: "unknown",
    availability: "unavailable",
    confidence: "low",
    fetchedAt: new Date().toISOString(),
    unavailableReason: input.unavailableReason ?? null,
    warnings: input.warnings ?? [],
  });
}

/**
 * Build an envelope when a provider returned partial data with known gaps.
 */
export function makePartialEnvelope<T>(input: {
  data: T;
  source: ProviderName;
  warnings: ContractWarning[];
  fetchedAt?: string | null;
  maxAgeSeconds?: number;
}): NormalizedEnvelope<T> {
  const fetchedAt = input.fetchedAt ?? new Date().toISOString();
  const freshness = deriveFreshness({
    fetchedAt,
    maxAgeSeconds: input.maxAgeSeconds,
  });
  return makeEnvelope({
    data: input.data,
    source: input.source,
    freshness,
    availability: "partial",
    confidence: "medium",
    fetchedAt,
    staleAt: calcStaleAt(fetchedAt, input.maxAgeSeconds ?? 3600),
    warnings: input.warnings,
  });
}

// ── Envelope type guard ───────────────────────────────────────────────────

/** Returns true if the envelope has usable data (not unavailable). */
export function envelopeHasData<T>(
  env: NormalizedEnvelope<T>,
): env is NormalizedEnvelope<T> & { data: T } {
  return env.data != null && env.availability !== "unavailable";
}
