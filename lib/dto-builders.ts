// lib/dto-builders.ts
// Section 08.D — Typed DTO builders.
//
// DTO (Data Transfer Object) builders combine a NormalizedEnvelope with an
// AssetContract into a single typed shape that API routes return and UI
// components consume.
//
// Rules:
//   - API routes must use makeEntityDto() or a typed variant — never construct
//     the DTO object inline.
//   - DTOs are read-only output shapes; do not mutate them after construction.
//   - The `assets` field is always present (never undefined) so UI code
//     doesn't need null-guard chains to access asset URLs.

import type { NormalizedEnvelope, AssetContract, ContractWarning } from "@/types/contracts"
import { makeSuccessEnvelope, makeEmptyEnvelope, makePartialEnvelope } from "@/lib/contracts"
import { buildWarning } from "@/lib/validation"

// ── Base DTO shape ────────────────────────────────────────────────────────

/**
 * The base DTO returned by entity API routes.
 * `T` is the normalized entity data (team, competition, venue, etc.)
 * Every DTO embeds a NormalizedEnvelope for freshness/availability metadata
 * and an AssetContract for all imagery.
 */
export type EntityDto<T> = {
  entity: T | null
  envelope: NormalizedEnvelope<T>
  assets: AssetContract
}

// ── Core builder ──────────────────────────────────────────────────────────

/**
 * Build a fully typed EntityDto from a raw data object.
 *
 * @param data        The normalized entity (or null if unavailable)
 * @param assets      The resolved AssetContract for the entity
 * @param source      The provider that sourced the data
 * @param options     Envelope metadata (fetchedAt, maxAgeSeconds, etc.)
 */
export function makeEntityDto<T>(
  data: T | null,
  assets: AssetContract,
  source: NormalizedEnvelope<T>["source"],
  options: {
    fetchedAt?: string | null
    maxAgeSeconds?: number
    live?: boolean
    confidence?: NormalizedEnvelope<T>["confidence"]
    warnings?: ContractWarning[]
    unavailableReason?: string
  } = {},
): EntityDto<T> {
  if (data == null) {
    return {
      entity: null,
      envelope: makeEmptyEnvelope<T>({
        source,
        unavailableReason: options.unavailableReason,
        warnings: options.warnings,
      }),
      assets,
    }
  }

  const hasWarnings = (options.warnings?.length ?? 0) > 0
  const envelope = hasWarnings
    ? makePartialEnvelope<T>({
        data,
        source,
        warnings: options.warnings!,
        fetchedAt: options.fetchedAt,
        maxAgeSeconds: options.maxAgeSeconds,
      })
    : makeSuccessEnvelope<T>({
        data,
        source,
        fetchedAt: options.fetchedAt,
        maxAgeSeconds: options.maxAgeSeconds,
        live: options.live,
        confidence: options.confidence,
      })

  return { entity: data, envelope, assets }
}

// ── Entity-specific convenience builders ─────────────────────────────────

export type TeamDto = EntityDto<{
  id: string
  name: string
  shortName?: string | null
  sport?: string | null
  country?: string | null
  competitionId?: string | null
}>

export type CompetitionDto = EntityDto<{
  id: string
  name: string
  sport?: string | null
  country?: string | null
  season?: string | null
}>

export type VenueDto = EntityDto<{
  id: string
  name: string
  city?: string | null
  country?: string | null
  capacity?: number | null
  screenCount?: number | null
}>

// ── Warning helpers ───────────────────────────────────────────────────────

/** Build a ContractWarning for a missing required field. */
export function missingFieldWarning(field: string): ContractWarning {
  return buildWarning(
    "MISSING_REQUIRED_FIELD",
    `Required field "${field}" is missing or empty.`,
    field,
  )
}

/** Build a ContractWarning for a missing asset URL with a text fallback. */
export function assetFallbackWarning(assetKind: string, entityLabel: string): ContractWarning {
  return buildWarning(
    "ASSET_FALLBACK_USED",
    `No URL for "${assetKind}" on "${entityLabel}" — rendering text initials.`,
    assetKind,
  )
}
