// lib/venue-scoring.ts
// Section 04.C — Venue scoring extracted as a standalone module.
//
// The scoring algorithm lives here. lib/venue-discovery.ts re-exports these
// so existing importers remain unbroken.

import type { VenueDiscoveryReason } from "@/types/venues"

// ── Types ─────────────────────────────────────────────────────────────────────

export type VenueDiscoveryInput = {
  nearUser?: boolean
  showsEvent?: boolean
  showsCompetition?: boolean
  showsSport?: boolean
  followedVenue?: boolean
  hasLiveOffer?: boolean
  editorialBoost?: boolean
  sponsored?: boolean
}

// ── Score weights — keep centralised so admin tools can read them ─────────────

export const VENUE_SCORE_WEIGHTS = {
  showsEvent:       50,
  showsCompetition: 30,
  showsSport:       20,
  followedVenue:    25,
  nearUser:         15,
  hasLiveOffer:     10,
  editorialBoost:    8,
  sponsored:         5,
} as const

// ── Core scorer ───────────────────────────────────────────────────────────────

export function scoreVenueCard(input: VenueDiscoveryInput): {
  score: number
  reasons: VenueDiscoveryReason[]
} {
  let score = 0
  const reasons: VenueDiscoveryReason[] = []

  if (input.showsEvent) {
    score += VENUE_SCORE_WEIGHTS.showsEvent
    reasons.push("showing_this_match")
  }
  if (input.showsCompetition) {
    score += VENUE_SCORE_WEIGHTS.showsCompetition
    reasons.push("showing_this_competition")
  }
  if (input.showsSport) {
    score += VENUE_SCORE_WEIGHTS.showsSport
    reasons.push("showing_this_sport")
  }
  if (input.followedVenue) {
    score += VENUE_SCORE_WEIGHTS.followedVenue
    reasons.push("you_follow_this_venue")
  }
  if (input.nearUser) {
    score += VENUE_SCORE_WEIGHTS.nearUser
    reasons.push("near_you")
  }
  if (input.hasLiveOffer) {
    score += VENUE_SCORE_WEIGHTS.hasLiveOffer
    reasons.push("has_live_offer")
  }
  if (input.editorialBoost) {
    score += VENUE_SCORE_WEIGHTS.editorialBoost
    reasons.push("editorial_boost")
  }
  if (input.sponsored) {
    score += VENUE_SCORE_WEIGHTS.sponsored
    reasons.push("sponsored")
  }

  return { score, reasons }
}
