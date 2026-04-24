import type { BrowseFilterState, BrowseViewMode, HomeModuleKey } from "@/types/navigation";

// ── Module ordering ────────────────────────────────────────────────────────────

/** Canonical priority order for homepage modules.
 *  The user's saved order overrides this, but this drives the default. */
export const DEFAULT_MODULE_ORDER: HomeModuleKey[] = [
  "hero",
  "live_now",
  "upcoming_fixtures",
  "recommended_matches",
  "latest_results",
  "homepage_news",
  "nearby_venues",
  "followed_venues",
  "featured_competitions",
  "sports_shortcuts",
  "leaderboard",
  "premium_cta",
];

// ── Browse filter helpers ──────────────────────────────────────────────────────

export function makeEmptyBrowseFilter(
  overrides?: Partial<BrowseFilterState>
): BrowseFilterState {
  return {
    view: "all",
    sport: null,
    country: null,
    competitionId: null,
    date: null,
    teamId: null,
    followedOnly: false,
    liveOnly: false,
    hasTvOnly: false,
    ...overrides,
  };
}

/** Returns true when at least one non-view filter is active. */
export function hasActiveFilters(state: BrowseFilterState): boolean {
  return !!(
    state.sport ||
    state.country ||
    state.competitionId ||
    state.date ||
    state.teamId ||
    state.followedOnly ||
    state.liveOnly ||
    state.hasTvOnly
  );
}

/** Returns a human-readable summary of active filters for display. */
export function activeFilterSummary(state: BrowseFilterState): string[] {
  const parts: string[] = [];
  if (state.sport) parts.push(state.sport);
  if (state.country) parts.push(state.country);
  if (state.competitionId) parts.push(`Competition: ${state.competitionId}`);
  if (state.date) parts.push(state.date);
  if (state.teamId) parts.push(`Team: ${state.teamId}`);
  if (state.followedOnly) parts.push("Followed only");
  if (state.liveOnly) parts.push("Live only");
  if (state.hasTvOnly) parts.push("TV only");
  return parts;
}

// ── View mode helpers ──────────────────────────────────────────────────────────

export const BROWSE_VIEW_LABELS: Record<BrowseViewMode, string> = {
  all: "All",
  live: "Live",
  fixtures: "Fixtures",
  results: "Results",
};

/** Maps a view mode to a canonical URL search param string. */
export function viewToParam(view: BrowseViewMode): string {
  return view;
}

/** Parses a URL param back to a BrowseViewMode, defaults to "all". */
export function paramToView(param: string | null | undefined): BrowseViewMode {
  if (param === "live" || param === "fixtures" || param === "results") {
    return param;
  }
  return "all";
}

// ── Deep-link builders ─────────────────────────────────────────────────────────

export function browseHref(filter: Partial<BrowseFilterState>): string {
  const params = new URLSearchParams();
  if (filter.view && filter.view !== "all") params.set("view", filter.view);
  if (filter.sport) params.set("sport", filter.sport);
  if (filter.country) params.set("country", filter.country);
  if (filter.competitionId) params.set("competition", filter.competitionId);
  if (filter.date) params.set("date", filter.date);
  if (filter.teamId) params.set("team", filter.teamId);
  if (filter.followedOnly) params.set("followedOnly", "1");
  if (filter.liveOnly) params.set("liveOnly", "1");
  if (filter.hasTvOnly) params.set("hasTvOnly", "1");
  const qs = params.toString();
  return `/browse${qs ? `?${qs}` : ""}`;
}

export function matchHref(eventId: string): string {
  return `/match/${eventId}`;
}

export function teamHref(teamId: string): string {
  return `/team/${teamId}`;
}

export function competitionHref(leagueId: string): string {
  return `/competition/${leagueId}`;
}

export function newsHref(slugOrId: string): string {
  return `/news/${slugOrId}`;
}
