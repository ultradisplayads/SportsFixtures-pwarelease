// types/control-plane.ts
// Section 12 — Admin / Control-Plane Domain Types
//
// Single source of truth for all operator-controlled configuration types.
// These DTOs flow from Strapi/control-plane → service layer → frontend.
// The frontend must not hardcode anything that belongs here.

// ── Feature Flags ─────────────────────────────────────────────────────────────

export type FeatureFlagKey =
  | "homepage_news_enabled"
  | "ticker_enabled"
  | "secondary_ticker_enabled"
  | "venue_discovery_enabled"
  | "premium_page_enabled"
  | "advanced_match_center_enabled"
  | "world_cup_mode_enabled"
  | "predictions_enabled"
  | "odds_enabled"
  | "highlights_enabled"

export type FeatureFlagDto = {
  key: FeatureFlagKey
  enabled: boolean
  /** Internal operator note — why this flag is in its current state. Never shown to end users. */
  notes?: string | null
}

// ── Homepage Modules ──────────────────────────────────────────────────────────

/**
 * Operator-controlled visibility and order for homepage modules.
 * key must match the HomeModuleRenderer switch cases: "recommended", "calendar",
 * "venues", "fixtures", "news", "leaderboard".
 */
export type HomepageModuleConfig = {
  key: string
  enabled: boolean
  /** 0-based render order. Lower = rendered first. */
  position: number
  /** Optional title override. Must not break navigation meaning. */
  titleOverride?: string | null
  /** Optional item count limit passed through to the module. */
  limit?: number | null
  /** Audience restriction. Defaults to "all". */
  audience?: "all" | "free" | "premium"
}

// ── Ticker Control ────────────────────────────────────────────────────────────

/**
 * Operator-controlled ticker behavior.
 * Structurally aligned with types/ticker.ts TickerConfig so the service layer
 * can convert directly: tickerControlDtoToConfig().
 */
export type TickerControlDto = {
  mode: "off" | "single" | "dual"
  primaryEnabled: boolean
  secondaryEnabled: boolean
  includeLiveScores: boolean
  includeBreakingNews: boolean
  includeTvNow: boolean
  includePromos: boolean
  includeVenueMessages: boolean
  includeSponsors: boolean
  maxPrimaryItems: number
  maxSecondaryItems: number
  /** Empty array = all sports allowed. */
  allowedSports: string[]
  /** Clamped 10–3600 by service layer. */
  refreshSeconds: number
  emptyMode: "hide" | "show_message" | "fallback_real"
}

// ── Tournament Mode ───────────────────────────────────────────────────────────

export type TournamentModeDto = {
  enabled: boolean
  type?: "world_cup" | "euros" | "champions_league_knockout" | "custom" | null
  mode?: "off" | "promo" | "full" | null
  /** Section 14: explicit stage awareness. */
  stage?: "pre_tournament" | "group_stage" | "knockout_stage" | "final_week" | "post_tournament" | null
  heroEnabled?: boolean
  navEnabled?: boolean
  tickerBoostEnabled?: boolean
  homepageModuleEnabled?: boolean
  venueBoostEnabled?: boolean
  /** Section 14: editorial/news boost control. */
  editorialBoostEnabled?: boolean
  /** Section 14: countdown surface control. */
  countdownEnabled?: boolean
  /** Competition IDs that should receive editorial emphasis. */
  featuredCompetitionIds?: string[]
  /** Section 14: team IDs that should receive editorial emphasis. */
  featuredTeamIds?: string[]
  /** Section 14: ISO 8601 tournament kickoff time for real countdown. */
  tournamentStartIso?: string | null
  /** Section 14: ISO 8601 tournament end time for post_tournament detection. */
  tournamentEndIso?: string | null
  /** Section 14: display name e.g. "FIFA World Cup 2026". */
  displayName?: string | null
  /** Section 14: short name for compact surfaces e.g. "World Cup". */
  shortName?: string | null
  /** Section 14: host location note. */
  hostLocation?: string | null
  /** Internal operator note. */
  notes?: string | null
}

// ── Commercial Slots ──────────────────────────────────────────────────────────

/**
 * Operator-controlled commercial slot visibility and targeting.
 * Audience rules must be explicit and must not disguise paid content as organic.
 */
export type CommercialSlotConfig = {
  key: string
  enabled: boolean
  slotType: "promo" | "affiliate" | "sponsored" | "venue_boost"
  audience?: "all" | "free" | "premium"
  position?: number | null
  /** Internal operator note for why this slot is active/disabled. */
  notes?: string | null
}

// ── Venue Boosts ──────────────────────────────────────────────────────────────

/**
 * Explicit operator-controlled venue boost rules.
 * Boosts are additive to organic scoring — they must not silently corrupt
 * relevance logic. sponsorDisclosure drives disclosure pill rendering.
 */
export type VenueBoostRule = {
  venueId: string
  enabled: boolean
  scope: "global" | "sport" | "competition" | "event"
  sport?: string | null
  competitionId?: string | null
  eventId?: string | null
  /** Whether the boost is paid placement requiring sponsor disclosure. */
  sponsorDisclosure?: boolean
  /** Internal operator note. */
  notes?: string | null
}

// ── Role Expectations ─────────────────────────────────────────────────────────

/**
 * Conceptual role boundary table.
 * Not enforced in frontend code — this is documentation for Strapi RBAC setup.
 * Every role below maps to a Strapi role or permission group.
 */
export type ControlPlaneRole =
  | "super_admin"     // Full access to all control-plane fields
  | "editor"          // Homepage modules, editorial emphasis, news, feature flags
  | "commercial_manager"  // Commercial slots, venue boosts, sponsored surfaces
  | "venue_ops"       // Venue boost rules only
  | "admin_lite"      // Read-only access to control-plane snapshot for debugging

export type RoleBoundaryNote = {
  role: ControlPlaneRole
  canEdit: string[]
  cannotEdit: string[]
}

/**
 * Role boundary declarations — service layer can use these for audit logging.
 * These are not enforced by the PWA frontend — enforcement is Strapi's responsibility.
 */
export const ROLE_BOUNDARIES: RoleBoundaryNote[] = [
  {
    role: "super_admin",
    canEdit: ["all"],
    cannotEdit: [],
  },
  {
    role: "editor",
    canEdit: ["homepageModules", "featureFlags", "tournamentMode.mode", "tournamentMode.heroEnabled", "tournamentMode.navEnabled"],
    cannotEdit: ["commercialSlots", "venueBoosts", "tournamentMode.featuredCompetitionIds"],
  },
  {
    role: "commercial_manager",
    canEdit: ["commercialSlots", "venueBoosts"],
    cannotEdit: ["featureFlags", "homepageModules", "tournamentMode"],
  },
  {
    role: "venue_ops",
    canEdit: ["venueBoosts"],
    cannotEdit: ["featureFlags", "homepageModules", "commercialSlots", "tournamentMode"],
  },
  {
    role: "admin_lite",
    canEdit: [],
    cannotEdit: ["all"],
  },
]

// ── Snapshot ──────────────────────────────────────────────────────────────────

/**
 * The full normalized operator configuration snapshot.
 * This is the shape returned by GET /api/control-plane.
 * The frontend reads exactly this — no individual config documents.
 */
export type ControlPlaneSnapshot = {
  homepageModules: HomepageModuleConfig[]
  ticker: TickerControlDto
  tournamentMode?: TournamentModeDto | null
  featureFlags: FeatureFlagDto[]
  commercialSlots: CommercialSlotConfig[]
  venueBoosts: VenueBoostRule[]
  generatedAt?: string | null
}
