// lib/tournament-surface.ts
// Section 14 — Tournament Surface Decision Resolver
//
// One place to decide what tournament mode changes in the UI.
// Components must only read TournamentSurfaceDecision — not scatter
// boolean checks against TournamentModeState across the codebase.
//
// Usage:
//   const decision = resolveTournamentSurfaceDecision(state)
//   if (decision.heroVisible) { render <TournamentHero /> }
//   if (decision.tickerBoost) { prioritize tournament items }

import type { TournamentModeState, TournamentSurfaceDecision } from "@/types/tournament-mode"
import { isGroupStageActive, isKnockoutStageActive } from "@/lib/tournament-mode"

/**
 * Resolves the full set of surface decisions from a TournamentModeState.
 *
 * Rules:
 * - if mode is "off" or enabled is false, all decisions are false/null
 * - "promo" mode: light boosts; "full" mode: all boosts as configured
 * - group/knockout visibility is stage-aware, not just mode-aware
 * - countdown visibility requires both countdownEnabled=true AND start time set
 *
 * Components must never re-derive these from raw state.
 */
export function resolveTournamentSurfaceDecision(
  state: TournamentModeState | null | undefined,
): TournamentSurfaceDecision {
  const active = Boolean(state?.enabled && state?.mode && state.mode !== "off")

  if (!active || !state) {
    return {
      tournamentActive: false,
      homepageBoost: false,
      navBoost: false,
      tickerBoost: false,
      venueBoost: false,
      editorialBoost: false,
      countdownVisible: false,
      groupTableVisible: false,
      knockoutVisible: false,
      heroVisible: false,
      activeMode: null,
      activeStage: null,
    }
  }

  const mode = state.mode as "promo" | "full"

  return {
    tournamentActive: true,
    homepageBoost:     Boolean(state.homepageModuleBoostEnabled),
    navBoost:          Boolean(state.navBoostEnabled),
    tickerBoost:       Boolean(state.tickerBoostEnabled),
    venueBoost:        Boolean(state.venueBoostEnabled),
    editorialBoost:    Boolean(state.editorialBoostEnabled),
    // Countdown requires both the flag AND a real start time — no fake urgency
    countdownVisible:  Boolean(state.countdownEnabled && state.tournamentStartIso),
    // Group table: stage must be group_stage; never guessed from competition name
    groupTableVisible: isGroupStageActive(state),
    // Knockout: stage must be knockout_stage or final_week
    knockoutVisible:   isKnockoutStageActive(state),
    heroVisible:       Boolean(state.heroEnabled),
    activeMode:        mode,
    activeStage:       state.stage ?? null,
  }
}

/**
 * Returns ticker priority multiplier for tournament matches.
 * Used in ticker-engine.ts to boost tournament items when tickerBoost is active.
 *
 * promo mode = mild boost (+1 priority step)
 * full mode  = stronger boost (+2 priority steps)
 * off        = no boost (0)
 */
export function getTournamentTickerPriorityBoost(
  decision: TournamentSurfaceDecision,
): 0 | 1 | 2 {
  if (!decision.tickerBoost) return 0
  return decision.activeMode === "full" ? 2 : 1
}

/**
 * Returns true if a competition ID should be prominently featured
 * on the current surface given the tournament state.
 *
 * Used by homepage modules and navigation strips to decide whether
 * to inject tournament competition shortcuts.
 */
export function isFeaturedTournamentCompetition(
  state: TournamentModeState | null | undefined,
  competitionId: string | null | undefined,
): boolean {
  if (!competitionId || !state?.enabled || !state.featuredCompetitionIds?.length) return false
  return state.featuredCompetitionIds.includes(competitionId)
}

/**
 * Returns a safe display label for the tournament in compact contexts
 * (nav pills, ticker labels, short messages).
 */
export function getTournamentShortLabel(
  state: TournamentModeState | null | undefined,
): string | null {
  if (!state?.enabled) return null
  return state.shortName ?? state.displayName ?? null
}
