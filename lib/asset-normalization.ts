// lib/asset-normalization.ts
// Central asset normalization layer.
//
// Problem this solves:
//   Different providers use different field names for the same concept:
//     strBadge | strTeamBadge | badge | logo | strLogo | strFanart |
//     strCountryFlag | null | "" | undefined
//   The frontend must not keep guessing which one to use.
//
// Rules:
//   - Every high-visibility entity type gets a typed normalizer here
//   - The UI consumes NormalizedAssetSet, not raw provider fields
//   - Empty strings, null, and undefined are all treated as "no value"
//   - The first non-empty candidate wins as `primary`
//   - All candidates are retained so SmartImage can retry them at runtime

import type { NormalizedAssetSet, NormalizedAssetCandidate, AssetKind } from "@/types/assets";
import type { AssetContract } from "@/types/contracts";
import { toNullableString, compactStrings, isNonEmptyString } from "@/lib/validation";

// ── URL sanitizer ─────────────────────────────────────────────────────────

function sanitizeAssetUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^data:/i.test(trimmed)) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^\//.test(trimmed)) return trimmed;
  return null;
}

// ── Core builder ──────────────────────────────────────────────────────────

/**
 * Build a fully typed NormalizedAssetSet from structured candidate entries.
 * Each candidate carries a sourceField name for runtime debug tracing.
 * The set is marked sanityChecked: true to confirm it passed through this layer.
 */
export function buildAssetSet(input: {
  kind: AssetKind;
  candidates: Array<{ value: unknown; sourceField: string }>;
  fallbackLabel?: string | null;
}): NormalizedAssetSet {
  const normalized: NormalizedAssetCandidate[] = input.candidates
    .map((c) => {
      if (!isNonEmptyString(c.value)) return null;
      const sanitized = sanitizeAssetUrl(c.value as string);
      if (!sanitized) return null;
      return { url: sanitized, sourceField: c.sourceField };
    })
    .filter(Boolean) as NormalizedAssetCandidate[];

  return {
    kind: input.kind,
    primary: normalized[0]?.url ?? null,
    secondary: normalized[1]?.url ?? null,
    tertiary: normalized[2]?.url ?? null,
    fallbackLabel: toNullableString(input.fallbackLabel),
    candidates: normalized,
    sanityChecked: true,
    sourceFields: normalized.map((c) => c.url),
  };
}

/**
 * Resolve an ordered list of raw candidate values into a NormalizedAssetSet.
 * Legacy convenience wrapper — prefer buildAssetSet() for new code where
 * sourceField names are available.
 */
export function normalizeAssetCandidates(
  candidates: unknown[],
  fallbackLabel?: string | null,
  kind: AssetKind = "generic",
): NormalizedAssetSet {
  return buildAssetSet({
    kind,
    candidates: candidates.map((v, i) => ({ value: v, sourceField: `candidate_${i}` })),
    fallbackLabel,
  });
}

// ── Entity-specific normalizers ───────────────────────────────────────────
// Each one lists all known provider field variants in priority order.
// Add new field variants here when new providers are integrated —
// no UI component should ever need updating.

/** Normalize a team badge from any provider record. */
export function normalizeTeamBadge(raw: Record<string, unknown>, teamName?: string | null): NormalizedAssetSet {
  return buildAssetSet({
    kind: "team_badge",
    fallbackLabel: teamName ?? toNullableString(raw.strTeam ?? raw.name ?? raw.teamName),
    candidates: [
      { value: raw.strTeamBadge, sourceField: "strTeamBadge" },   // TheSportsDB Event
      { value: raw.strBadge,     sourceField: "strBadge" },       // TheSportsDB Team detail
      { value: raw.badge,        sourceField: "badge" },          // SF Strapi team
      { value: raw.badgeUrl,     sourceField: "badgeUrl" },       // generic
      { value: raw.logo,         sourceField: "logo" },           // generic alt
      { value: raw.strLogo,      sourceField: "strLogo" },        // TSDB alt
      { value: raw.strFanart1,   sourceField: "strFanart1" },     // TSDB hi-res fanart fallback
    ],
  });
}

/** Normalize a competition/league logo from any provider record. */
export function normalizeCompetitionLogo(raw: Record<string, unknown>, competitionName?: string | null): NormalizedAssetSet {
  return buildAssetSet({
    kind: "competition_logo",
    fallbackLabel: competitionName ?? toNullableString(raw.strLeague ?? raw.name),
    candidates: [
      { value: raw.logoUrl,       sourceField: "logoUrl" },
      { value: raw.strBadge,      sourceField: "strBadge" },       // TheSportsDB league
      { value: raw.logo,          sourceField: "logo" },           // SF Strapi league
      { value: raw.strLogo,       sourceField: "strLogo" },        // TSDB alt
      { value: raw.strLeagueBadge,sourceField: "strLeagueBadge" }, // TSDB event-level field
      { value: raw.strBanner,     sourceField: "strBanner" },      // TSDB banner fallback
    ],
  });
}

/** Normalize a country flag from any provider record. */
export function normalizeCountryFlag(raw: Record<string, unknown>, countryName?: string | null): NormalizedAssetSet {
  return buildAssetSet({
    kind: "country_flag",
    fallbackLabel: countryName ?? toNullableString(raw.strCountry ?? raw.name),
    candidates: [
      { value: raw.flagUrl,          sourceField: "flagUrl" },
      { value: raw.strCountryFlag,   sourceField: "strCountryFlag" },
      { value: raw.strFlag,          sourceField: "strFlag" },          // TheSportsDB + SF Strapi
      { value: raw.flag,             sourceField: "flag" },             // SF Strapi alt
    ],
  });
}

/** Normalize a sport icon from any provider record. */
export function normalizeSportIcon(raw: Record<string, unknown>, sportName?: string | null): NormalizedAssetSet {
  return buildAssetSet({
    kind: "sport_icon",
    fallbackLabel: sportName ?? toNullableString(raw.strSport ?? raw.name),
    candidates: [
      { value: raw.strSportIconGreen, sourceField: "strSportIconGreen" }, // TheSportsDB sport icon
      { value: raw.strSportThumb,     sourceField: "strSportThumb" },     // TSDB sport thumbnail
      { value: raw.icon,              sourceField: "icon" },              // SF Strapi sport
      { value: raw.strThumb,          sourceField: "strThumb" },          // generic
    ],
  });
}

/** Normalize a venue image from any provider record. */
export function normalizeVenueImage(raw: Record<string, unknown>, venueName?: string | null): NormalizedAssetSet {
  return buildAssetSet({
    kind: "venue_image",
    fallbackLabel: venueName ?? toNullableString(raw.strVenue ?? raw.name),
    candidates: [
      { value: raw.imageUrl,   sourceField: "imageUrl" },   // SF Strapi venue
      { value: raw.strThumb,   sourceField: "strThumb" },   // generic thumb (before fanart)
      { value: raw.strImage,   sourceField: "strImage" },   // TSDB / Strapi alt
      { value: raw.strFanart,  sourceField: "strFanart" },  // TSDB fanart
      { value: raw.strFanart1, sourceField: "strFanart1" }, // TSDB hi-res fanart fallback
    ],
  });
}

/** Normalize an article/news image from any provider record. */
export function normalizeArticleImage(raw: Record<string, unknown>, title?: string | null): NormalizedAssetSet {
  return buildAssetSet({
    kind: "article_image",
    fallbackLabel: title ?? toNullableString(raw.title ?? raw.strTitle),
    candidates: [
      { value: raw.imageUrl,    sourceField: "imageUrl" },    // generic
      { value: raw.coverImage,  sourceField: "coverImage" },  // SF Strapi news
      { value: raw.image,       sourceField: "image" },       // SF Strapi alt
      { value: raw.thumbnail,   sourceField: "thumbnail" },   // generic
      { value: raw.strImage,    sourceField: "strImage" },    // Strapi alt
      { value: raw.strThumb,    sourceField: "strThumb" },    // TSDB event thumb
    ],
  });
}

/** Normalize a player avatar from any provider record. */
export function normalizePlayerAvatar(raw: Record<string, unknown>, playerName?: string | null): NormalizedAssetSet {
  return buildAssetSet({
    kind: "player_avatar",
    fallbackLabel: playerName ?? toNullableString(raw.strPlayer ?? raw.name),
    candidates: [
      { value: raw.avatarUrl, sourceField: "avatarUrl" },  // generic
      { value: raw.strThumb,  sourceField: "strThumb" },   // TheSportsDB player thumb
      { value: raw.strCutout, sourceField: "strCutout" },  // TSDB player cutout
      { value: raw.avatar,    sourceField: "avatar" },     // SF Strapi player
      { value: raw.strImage,  sourceField: "strImage" },   // generic
    ],
  });
}

// ── Full AssetContract builder ────────────────────────────────────────────

/** Build a full AssetContract for a team from a raw provider record. */
export function buildTeamAssetContract(raw: Record<string, unknown>): AssetContract {
  return {
    badge: normalizeTeamBadge(raw),
  };
}

/** Build a full AssetContract for a competition from a raw provider record. */
export function buildCompetitionAssetContract(raw: Record<string, unknown>): AssetContract {
  return {
    logo: normalizeCompetitionLogo(raw),
    flag: raw.strCountry
      ? normalizeCountryFlag(raw, toNullableString(raw.strCountry))
      : undefined,
  };
}

/** Build a full AssetContract for a venue from a raw provider record. */
export function buildVenueAssetContract(raw: Record<string, unknown>): AssetContract {
  return {
    image: normalizeVenueImage(raw),
  };
}

// ── Convenience: get the best URL from a NormalizedAssetSet ──────────────

/** Return the best available URL from a NormalizedAssetSet, or null. */
export function getBestAssetUrl(set: NormalizedAssetSet | undefined | null): string | null {
  if (!set) return null;
  return set.primary ?? set.candidates?.[0]?.url ?? set.secondary ?? null;
}
