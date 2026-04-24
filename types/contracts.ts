// types/contracts.ts
// Canonical data-contract types for the SF PWA.
// Every internal API response envelope and asset set must be shaped by these types.
// No raw provider shapes (TheSportsDB, API-Sports, Strapi) should appear in
// generic UI components — they must be normalized into these first.

// ── Provider identity ──────────────────────────────────────────────────────

export type ProviderName =
  | "thesportsdb"
  | "api-sports"
  | "strapi"
  | "derived"
  | "internal";

// ── Freshness ─────────────────────────────────────────────────────────────
// live        — real-time feed, seconds old
// near-live   — up to ~2× the declared max age
// cached      — within max age, not a live feed
// stale       — beyond max age but data exists
// static      — never changes (e.g. country list)
// unknown     — no fetchedAt metadata available

export type DataFreshness =
  | "live"
  | "near_live"
  | "cached"
  | "stale"
  | "static"
  | "unknown";

// ── Availability ──────────────────────────────────────────────────────────
// full         — all expected fields present
// partial      — some fields missing but core data usable
// empty        — provider returned zero rows / empty array
// unavailable  — provider call failed or returned null
// unsupported  — the feature or entity type is not supported by the provider

export type DataAvailability = "full" | "partial" | "empty" | "unavailable" | "unsupported";

// ── Confidence ────────────────────────────────────────────────────────────

export type DataConfidence = "high" | "medium" | "low";

// ── Warning ───────────────────────────────────────────────────────────────

export type ContractWarning = {
  code: string;
  message: string;
  field?: string;
};

// ── Normalized envelope ───────────────────────────────────────────────────
// Every important internal API route should return this shape (or embed it).
// The `data` field is null when availability is "unavailable".

export type NormalizedEnvelope<T> = {
  data: T | null;
  source: ProviderName;
  freshness: DataFreshness;
  availability: DataAvailability;
  confidence?: DataConfidence;
  fetchedAt?: string | null;
  staleAt?: string | null;
  unavailableReason?: string | null;
  warnings?: ContractWarning[];
};

// ── Asset types ───────────────────────────────────────────────────────────
// NormalizedAssetSet and AssetKind are defined in types/assets.ts.
// Re-exported here so all contract-adjacent code can import from one place.

export type {
  NormalizedAssetSet,
  NormalizedAssetCandidate,
  AssetKind,
  AssetResolutionResult,
} from "@/types/assets";

// AssetContract groups all asset sets an entity may carry.
export type AssetContract = {
  badge?: import("@/types/assets").NormalizedAssetSet;
  logo?: import("@/types/assets").NormalizedAssetSet;
  flag?: import("@/types/assets").NormalizedAssetSet;
  image?: import("@/types/assets").NormalizedAssetSet;
  icon?: import("@/types/assets").NormalizedAssetSet;
};

// ── Module gate ───────────────────────────────────────────────────────────
// Used by entitlements and locked-feature surfaces.
// Re-exported here so the contracts module is the single import point.

export type ModuleGateState = "open" | "locked" | "hidden";

export type ModuleGateContract = {
  key: string;
  state: ModuleGateState;
  requiredTier?: string;
  reason?: string;
};

// ── Strapi override fields ────────────────────────────────────────────────
// Fields that Strapi may inject on top of a provider record.
// Internal DTOs should accommodate these without becoming provider-shaped.

export type StrapiOverrideFields = {
  editorialTitle?: string | null;
  editorialImage?: string | null;
  isFeatured?: boolean;
  isSponsored?: boolean;
  boostScore?: number | null;
  moduleVisibility?: boolean;
};
