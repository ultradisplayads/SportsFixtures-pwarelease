import type { AssetKind, AssetResolutionResult } from "@/types/assets";

/**
 * resolveAsset — single authoritative function for image/logo/flag resolution.
 *
 * Accepts an ordered list of candidates (first non-empty string wins).
 * Always returns a typed result so callers can render a fallback
 * instead of an empty or broken shell.
 */
export function resolveAsset(input: {
  kind: AssetKind;
  candidates: Array<string | null | undefined>;
  fallbackLabel?: string | null;
}): AssetResolutionResult {
  const valid = input.candidates.filter(
    (x): x is string => typeof x === "string" && x.trim().length > 0
  );
  const src = valid[0] ?? null;

  return {
    src,
    kind: input.kind,
    sourceField: src ?? undefined,
    fallbackUsed: !src,
    fallbackLabel: input.fallbackLabel ?? null,
    candidatesTried: valid,
  };
}

// ── Convenience resolvers per asset kind ───────────────────────────────────────

export function resolveTeamBadge(
  candidates: Array<string | null | undefined>,
  teamName?: string | null
): AssetResolutionResult {
  return resolveAsset({ kind: "team_badge", candidates, fallbackLabel: teamName ?? null });
}

export function resolveCompetitionLogo(
  candidates: Array<string | null | undefined>,
  competitionName?: string | null
): AssetResolutionResult {
  return resolveAsset({
    kind: "competition_logo",
    candidates,
    fallbackLabel: competitionName ?? null,
  });
}

export function resolveCountryFlag(
  candidates: Array<string | null | undefined>,
  countryName?: string | null
): AssetResolutionResult {
  return resolveAsset({ kind: "country_flag", candidates, fallbackLabel: countryName ?? null });
}

export function resolveSportIcon(
  candidates: Array<string | null | undefined>,
  sportName?: string | null
): AssetResolutionResult {
  return resolveAsset({ kind: "sport_icon", candidates, fallbackLabel: sportName ?? null });
}

export function resolveVenueImage(
  candidates: Array<string | null | undefined>,
  venueName?: string | null
): AssetResolutionResult {
  return resolveAsset({ kind: "venue_image", candidates, fallbackLabel: venueName ?? null });
}

export function resolveArticleImage(
  candidates: Array<string | null | undefined>,
  title?: string | null
): AssetResolutionResult {
  return resolveAsset({ kind: "article_image", candidates, fallbackLabel: title ?? null });
}
