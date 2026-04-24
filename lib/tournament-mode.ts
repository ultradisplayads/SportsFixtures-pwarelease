// lib/tournament-mode.ts
// Section 14 — Tournament Mode Service Layer
//
// All helpers here:
//   - validate operator input and resolve safe defaults
//   - never throw on bad config
//   - never guess or fake tournament data
//   - align with lib/control-plane.ts resolveTournamentMode()
//
// The World Cup is the first preset. Others can be added without code changes
// to product surfaces — only this file and the control-plane config need updating.

import type { TournamentModeDto } from "@/types/control-plane"
import type {
  TournamentModeState,
  TournamentModeStage,
  TournamentModeType,
  TournamentModePreset,
} from "@/types/tournament-mode"

// ── Safe Default ──────────────────────────────────────────────────────────────

export const TOURNAMENT_MODE_OFF: TournamentModeState = {
  enabled: false,
  type: null,
  mode: "off",
  stage: null,
  featuredCompetitionIds: [],
  featuredTeamIds: [],
  heroEnabled: false,
  homepageModuleBoostEnabled: false,
  navBoostEnabled: false,
  tickerBoostEnabled: false,
  venueBoostEnabled: false,
  editorialBoostEnabled: false,
  countdownEnabled: false,
  tournamentStartIso: null,
  tournamentEndIso: null,
  displayName: null,
  shortName: null,
  hostLocation: null,
}

// ── World Cup Preset ──────────────────────────────────────────────────────────

/**
 * The World Cup is the first-class tournament preset.
 * Promo mode = buildup emphasis without full product takeover.
 * Full mode = all boosts enabled, maximum homepage/nav/ticker emphasis.
 *
 * Operators select the preset via type="world_cup" in the control plane.
 * Specific dates, display names, and competition IDs are still set in Strapi —
 * the preset only supplies the safe behavioral defaults.
 */
export const WORLD_CUP_PRESET: TournamentModePreset = {
  type: "world_cup",
  displayName: "FIFA World Cup",
  shortName: "World Cup",
  defaultStageFromDates: true,
  promoDefaults: {
    heroEnabled: true,
    homepageModuleBoostEnabled: false,
    navBoostEnabled: true,
    tickerBoostEnabled: false,
    venueBoostEnabled: false,
    editorialBoostEnabled: true,
    countdownEnabled: true,
  },
  fullDefaults: {
    heroEnabled: true,
    homepageModuleBoostEnabled: true,
    navBoostEnabled: true,
    tickerBoostEnabled: true,
    venueBoostEnabled: true,
    editorialBoostEnabled: true,
    countdownEnabled: false, // Countdown ends when the tournament starts
  },
}

/**
 * All registered tournament presets.
 * Adding a new preset here is the only code change required to support a new tournament type.
 */
export const TOURNAMENT_PRESETS: Record<TournamentModeType, TournamentModePreset> = {
  world_cup: WORLD_CUP_PRESET,
  euros: {
    type: "euros",
    displayName: "UEFA European Championship",
    shortName: "Euros",
    defaultStageFromDates: true,
    promoDefaults: WORLD_CUP_PRESET.promoDefaults,
    fullDefaults: WORLD_CUP_PRESET.fullDefaults,
  },
  champions_league_knockout: {
    type: "champions_league_knockout",
    displayName: "UEFA Champions League Knockout",
    shortName: "UCL Knockout",
    defaultStageFromDates: false,
    promoDefaults: {
      heroEnabled: false,
      homepageModuleBoostEnabled: false,
      navBoostEnabled: true,
      tickerBoostEnabled: true,
      venueBoostEnabled: false,
      editorialBoostEnabled: true,
      countdownEnabled: false,
    },
    fullDefaults: {
      heroEnabled: true,
      homepageModuleBoostEnabled: true,
      navBoostEnabled: true,
      tickerBoostEnabled: true,
      venueBoostEnabled: true,
      editorialBoostEnabled: true,
      countdownEnabled: false,
    },
  },
  custom: {
    type: "custom",
    displayName: "Tournament",
    shortName: "Tournament",
    defaultStageFromDates: false,
    promoDefaults: {},
    fullDefaults: {},
  },
}

// ── Stage Resolution ──────────────────────────────────────────────────────────

const VALID_STAGES: TournamentModeStage[] = [
  "pre_tournament",
  "group_stage",
  "knockout_stage",
  "final_week",
  "post_tournament",
]

/**
 * Infers a tournament stage from the current date and start/end ISOs.
 * Only used when the operator has not explicitly set a stage in the control plane.
 *
 * Timeline assumptions (configurable in Strapi, not hardcoded):
 *   - pre_tournament  : before tournamentStartIso
 *   - group_stage     : first ~25% of tournament duration
 *   - knockout_stage  : 25%–85% of duration
 *   - final_week      : last 15% of duration
 *   - post_tournament : after tournamentEndIso
 *
 * If either ISO is null, returns null — caller must handle missing data honestly.
 */
export function resolveTournamentModeStageFromDate(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
  nowMs?: number,
): TournamentModeStage | null {
  if (!startIso || !endIso) return null

  try {
    const start = new Date(startIso).getTime()
    const end = new Date(endIso).getTime()
    const now = nowMs ?? Date.now()

    if (!isFinite(start) || !isFinite(end) || end <= start) return null
    if (now < start) return "pre_tournament"
    if (now > end) return "post_tournament"

    const total = end - start
    const elapsed = now - start
    const fraction = elapsed / total

    if (fraction < 0.25) return "group_stage"
    if (fraction < 0.85) return "knockout_stage"
    return "final_week"
  } catch {
    return null
  }
}

// ── DTO → State Conversion ────────────────────────────────────────────────────

/**
 * Converts a TournamentModeDto (control-plane shape) into a normalized
 * TournamentModeState (frontend shape). Merges preset defaults with
 * operator overrides, so operators don't need to configure every field.
 *
 * Rules:
 * - operator explicit values always win over preset defaults
 * - if mode is "off" or enabled is false, returns TOURNAMENT_MODE_OFF
 * - stage is resolved from dates when not explicitly set and preset supports it
 */
export function tournamentDtoToState(
  dto: TournamentModeDto | null | undefined,
): TournamentModeState {
  if (!dto || !dto.enabled || !dto.mode || dto.mode === "off") {
    return TOURNAMENT_MODE_OFF
  }

  const type = dto.type ?? null
  const preset = type ? TOURNAMENT_PRESETS[type] ?? null : null
  const modeDefaults =
    dto.mode === "full"
      ? (preset?.fullDefaults ?? {})
      : (preset?.promoDefaults ?? {})

  // Stage: explicit operator value wins; fall back to date-derived if preset supports it
  let stage: TournamentModeStage | null = null
  if (dto.stage && VALID_STAGES.includes(dto.stage)) {
    stage = dto.stage
  } else if (preset?.defaultStageFromDates) {
    stage = resolveTournamentModeStageFromDate(
      dto.tournamentStartIso ?? null,
      dto.tournamentEndIso ?? null,
    )
  }

  return {
    enabled: true,
    type: type as TournamentModeState["type"],
    mode: dto.mode,
    stage,
    featuredCompetitionIds: Array.isArray(dto.featuredCompetitionIds)
      ? dto.featuredCompetitionIds.filter((id) => typeof id === "string" && id.length > 0)
      : [],
    featuredTeamIds: Array.isArray(dto.featuredTeamIds)
      ? dto.featuredTeamIds.filter((id) => typeof id === "string" && id.length > 0)
      : [],
    // Operator field wins over preset default — use ?? not ||
    heroEnabled:                 dto.heroEnabled               ?? modeDefaults.heroEnabled               ?? false,
    homepageModuleBoostEnabled:  dto.homepageModuleEnabled     ?? modeDefaults.homepageModuleBoostEnabled ?? false,
    navBoostEnabled:             dto.navEnabled                ?? modeDefaults.navBoostEnabled            ?? false,
    tickerBoostEnabled:          dto.tickerBoostEnabled        ?? modeDefaults.tickerBoostEnabled         ?? false,
    venueBoostEnabled:           dto.venueBoostEnabled         ?? modeDefaults.venueBoostEnabled          ?? false,
    editorialBoostEnabled:       dto.editorialBoostEnabled     ?? modeDefaults.editorialBoostEnabled      ?? false,
    countdownEnabled:            dto.countdownEnabled          ?? modeDefaults.countdownEnabled           ?? false,
    tournamentStartIso:          dto.tournamentStartIso        ?? null,
    tournamentEndIso:            dto.tournamentEndIso          ?? null,
    displayName:                 dto.displayName               ?? preset?.displayName                     ?? null,
    shortName:                   dto.shortName                 ?? preset?.shortName                       ?? null,
    hostLocation:                dto.hostLocation              ?? null,
  }
}

// ── Utility Helpers ───────────────────────────────────────────────────────────

/**
 * Returns true if the tournament mode is meaningfully active (promo or full).
 */
export function isTournamentActive(state: TournamentModeState | null | undefined): boolean {
  return Boolean(
    state?.enabled && state.mode && state.mode !== "off",
  )
}

/**
 * Returns the ms remaining until the tournament starts.
 * Returns null if start is not set or is in the past.
 */
export function getTournamentMsRemaining(
  state: TournamentModeState | null | undefined,
  nowMs?: number,
): number | null {
  if (!state?.tournamentStartIso) return null
  try {
    const start = new Date(state.tournamentStartIso).getTime()
    const now = nowMs ?? Date.now()
    if (!isFinite(start)) return null
    const remaining = start - now
    return remaining > 0 ? remaining : null
  } catch {
    return null
  }
}

/**
 * Returns true if the current stage is group-table-relevant.
 */
export function isGroupStageActive(state: TournamentModeState | null | undefined): boolean {
  return state?.stage === "group_stage"
}

/**
 * Returns true if the current stage is knockout-relevant.
 */
export function isKnockoutStageActive(state: TournamentModeState | null | undefined): boolean {
  return state?.stage === "knockout_stage" || state?.stage === "final_week"
}

/**
 * Returns true if the given competition ID is a featured tournament competition.
 */
export function isFeaturedCompetition(
  state: TournamentModeState | null | undefined,
  competitionId: string | null | undefined,
): boolean {
  if (!competitionId || !state?.featuredCompetitionIds?.length) return false
  return state.featuredCompetitionIds.includes(competitionId)
}
