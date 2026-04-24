// types/home-modules.ts
// Section 07 — Normalized home module runtime state types.
//
// These types are the single source of truth for module visibility decisions.
// Module visibility MUST come from resolveHomeModuleRuntimeState — never from
// fetch empty/error states alone.

export type HomeModuleKey =
  | "hero"
  | "live_now"
  | "upcoming_fixtures"
  | "latest_results"
  | "calendar"
  | "watch_here_tonight"
  | "homepage_news"
  | "recommended_matches"
  | "featured_competitions"
  | "sports_shortcuts"
  | "premium_cta"
  // Legacy keys used by existing HomeModuleRenderer/control-plane:
  | "recommended"
  | "fixtures"
  | "venues"
  | "news"
  | "leaderboard"
  | "live";

export type HomeModuleRuntimeState = {
  key: HomeModuleKey;
  enabledByControlPlane: boolean;
  enabledByUser: boolean;
  visible: boolean;
  hiddenReason?: "control_plane" | "user_pref" | null;
  titleOverride?: string | null;
  position?: number | null;
  limit?: number | null;
};

/**
 * User-level preference record for a single module.
 * Stored as an array in localStorage under sf_home_modules.
 * Unknown keys are silently ignored on load.
 */
export type HomeModuleUserPref = {
  id: string;
  enabled: boolean;
};

/** All valid module keys understood by the renderer. */
export const ALL_HOME_MODULE_KEYS: HomeModuleKey[] = [
  "recommended",
  "live",
  "fixtures",
  "news",
  "calendar",
  "venues",
  "leaderboard",
];
