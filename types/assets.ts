// types/assets.ts
// Section 08 — Canonical asset type definitions.
// All asset-related UI and lib code must import from here.
// types/navigation.ts re-exports AssetKind for backward compatibility.

// ── Asset kind ────────────────────────────────────────────────────────────
// Canonical set of visual asset roles. Add new kinds here only — never
// add ad-hoc string literals in components.

export type AssetKind =
  | "team_badge"
  | "competition_logo"
  | "country_flag"
  | "sport_icon"
  | "venue_image"
  | "article_image"
  | "player_avatar"
  | "avatar"
  | "generic_image"
  | "generic"

// ── Normalized asset candidate ────────────────────────────────────────────
// A single validated URL candidate with its originating provider field name.

export type NormalizedAssetCandidate = {
  url: string
  sourceField: string
}

// ── Normalized asset set ──────────────────────────────────────────────────
// Section 08 canonical shape for all image-bearing DTOs.
// `candidates` is the full ordered list tried at runtime.
// `primary` / `secondary` / `tertiary` are convenience views of candidates[0..2].
// `sanityChecked` confirms the set was built by buildAssetSet(), not ad-hoc.

export type NormalizedAssetSet = {
  kind?: AssetKind
  primary?: string | null
  secondary?: string | null
  tertiary?: string | null
  fallbackLabel?: string | null
  /** Full ordered list of validated URL candidates — SmartImage retries these. */
  candidates: NormalizedAssetCandidate[]
  /** True when the set was produced by buildAssetSet() in lib/asset-normalization.ts. */
  sanityChecked: boolean
  /** Legacy compat: raw source URLs before sanitization — kept for debug traces. */
  sourceFields?: string[]
}

// ── Resolution result ─────────────────────────────────────────────────────
// Returned by resolveAsset() so callers always get a typed shape
// instead of a nullable string.

export type AssetResolutionResult = {
  src: string | null
  kind: AssetKind
  /** True when no candidate resolved and a text fallback is being used. */
  fallbackUsed: boolean
  fallbackLabel?: string | null
  /** All candidate URLs that were tried, for debug tracing. */
  candidatesTried: string[]
  /** @deprecated use candidatesTried — kept for backward compat with lib/assets.ts */
  sourceField?: string
}

// ── Display size ──────────────────────────────────────────────────────────
// Standard pixel sizes used across all Smart* components and FallbackBadge.
// Components accept the string token and map it to tailwind classes.

export type AssetSize = "xs" | "sm" | "md" | "lg" | "xl"

export const ASSET_SIZE_CLASS: Record<AssetSize, string> = {
  xs: "h-5 w-5",
  sm: "h-7 w-7",
  md: "h-10 w-10",
  lg: "h-14 w-14",
  xl: "h-20 w-20",
}
