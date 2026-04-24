// types/tournament-mode.ts
// Section 14 — World Cup / Tournament Mode Domain Types
//
// These are the canonical frontend types for the tournament mode system.
// They are consumed by lib/tournament-mode.ts, lib/tournament-surface.ts,
// hooks/use-tournament-mode.ts, and all tournament/ components.
//
// The control plane (types/control-plane.ts TournamentModeDto) is the
// operator-facing contract. These types are the normalized frontend shape.

// ── Core Mode Types ───────────────────────────────────────────────────────────

export type TournamentModeType =
  | "world_cup"
  | "euros"
  | "champions_league_knockout"
  | "custom"

export type TournamentModeStage =
  | "pre_tournament"
  | "group_stage"
  | "knockout_stage"
  | "final_week"
  | "post_tournament"

// ── Normalized State ──────────────────────────────────────────────────────────

/**
 * The normalized, validated tournament mode state consumed by all frontend surfaces.
 * Never read TournamentModeDto directly in a component — always go through this type
 * via useTournamentMode() or resolveTournamentSurfaceDecision().
 */
export type TournamentModeState = {
  enabled: boolean
  type?: TournamentModeType | null
  mode?: "off" | "promo" | "full" | null
  stage?: TournamentModeStage | null
  /** Competition IDs that should receive editorial emphasis. */
  featuredCompetitionIds?: string[]
  /** Team IDs that should receive editorial emphasis. */
  featuredTeamIds?: string[]
  heroEnabled?: boolean
  homepageModuleBoostEnabled?: boolean
  navBoostEnabled?: boolean
  tickerBoostEnabled?: boolean
  venueBoostEnabled?: boolean
  editorialBoostEnabled?: boolean
  countdownEnabled?: boolean
  /**
   * ISO 8601 — when the tournament kicks off.
   * Used by TournamentCountdown to render real time remaining.
   * Must not be faked: if null, countdown must not render.
   */
  tournamentStartIso?: string | null
  /**
   * ISO 8601 — when the tournament ends / when mode should auto-degrade.
   * The frontend respects this for post_tournament detection.
   */
  tournamentEndIso?: string | null
  /** Display name for the tournament, e.g. "FIFA World Cup 2026". */
  displayName?: string | null
  /** Short name for compact surfaces, e.g. "World Cup". */
  shortName?: string | null
  /** Host city or venue location note. */
  hostLocation?: string | null
}

// ── Surface Decision ──────────────────────────────────────────────────────────

/**
 * The resolved set of boolean surface decisions derived from TournamentModeState.
 * Components must only read these booleans — not re-derive from TournamentModeState.
 * Use resolveTournamentSurfaceDecision() in lib/tournament-surface.ts.
 */
export type TournamentSurfaceDecision = {
  tournamentActive: boolean
  homepageBoost: boolean
  navBoost: boolean
  tickerBoost: boolean
  venueBoost: boolean
  editorialBoost: boolean
  countdownVisible: boolean
  /** Whether group table surfaces should be shown. */
  groupTableVisible: boolean
  /** Whether knockout bracket surfaces should be shown. */
  knockoutVisible: boolean
  /** Whether the tournament hero banner should render. */
  heroVisible: boolean
  /** "promo" = buildup mode, "full" = live event mode, null = off */
  activeMode: "promo" | "full" | null
  /** Resolved stage — may be null if mode is off or stage not set. */
  activeStage: TournamentModeStage | null
}

// ── Group & Knockout Data Types ───────────────────────────────────────────────

export type TournamentGroupTeam = {
  teamId: string
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  /** Optional team badge URL. */
  badgeUrl?: string | null
  /** Qualification status driven by real data, not guessing. */
  qualificationStatus?: "qualified" | "eliminated" | "tbc" | null
}

export type TournamentGroupTable = {
  groupKey: string
  /** Display label, e.g. "Group A". */
  groupLabel?: string | null
  teams: TournamentGroupTeam[]
}

export type TournamentKnockoutNode = {
  round: string
  /** Display label, e.g. "Quarter Final". */
  roundLabel?: string | null
  eventId: string
  homeTeamName?: string | null
  awayTeamName?: string | null
  homeScore?: number | null
  awayScore?: number | null
  startsAt?: string | null
  status?: string | null
  /** Venue name for this match. */
  venueName?: string | null
  /** Host city for this match. */
  hostCity?: string | null
}

// ── API Contract ──────────────────────────────────────────────────────────────

/**
 * Shape returned by GET /api/tournament-mode.
 * Consumers must not infer tournament state from competition name alone.
 */
export type TournamentModeApiResponse = {
  state: TournamentModeState
  generatedAt: string
}

// ── Preset Type ───────────────────────────────────────────────────────────────

/**
 * A reusable tournament preset that operators can select via type.
 * Presets provide safe default behavior without requiring every field
 * to be individually configured in Strapi.
 */
export type TournamentModePreset = {
  type: TournamentModeType
  displayName: string
  shortName: string
  defaultStageFromDates: boolean
  /**
   * Default surface behavior for promo mode.
   * Full mode always enables all boosts.
   */
  promoDefaults: Partial<TournamentModeState>
  fullDefaults: Partial<TournamentModeState>
}
