// ── Match Center Response Contract ────────────────────────────────────────────
//
// This is the stable contract that all UI components consume.
// The internal /api/match-center/[eventId] route must return this shape.
// Individual sub-routes may still exist for performance/caching.

import type {
  MatchIntelligenceEnvelope,
  MatchLineups,
  MatchTimelineEvent,
  MatchStatItem,
  MatchStandingsRow,
  MatchTvInfo,
  MatchHighlightItem,
  MatchInsightItem,
} from "./match-intelligence"
import type { MatchCenterCoverageHints } from "./coverage"

export type MatchCenterEvent = {
  idEvent: string
  strEvent: string
  strSport: string
  strLeague: string
  idLeague: string
  strSeason?: string
  strHomeTeam: string
  strAwayTeam: string
  strHomeTeamBadge?: string
  strAwayTeamBadge?: string
  idHomeTeam?: string
  idAwayTeam?: string
  intHomeScore?: number | null
  intAwayScore?: number | null
  strStatus?: string
  strProgress?: string
  strVenue?: string
  dateEvent?: string
  strTime?: string
  strVideo?: string
  hasConfirmedLineups?: boolean
  isHalfTime?: boolean
  isExtraTime?: boolean
  isPenalties?: boolean
}

export type MatchCenterResponse = {
  event: MatchIntelligenceEnvelope<MatchCenterEvent>
  lineups: MatchIntelligenceEnvelope<MatchLineups>
  timeline: MatchIntelligenceEnvelope<MatchTimelineEvent[]>
  stats: MatchIntelligenceEnvelope<MatchStatItem[]>
  standings: MatchIntelligenceEnvelope<MatchStandingsRow[]>
  tv: MatchIntelligenceEnvelope<MatchTvInfo>
  highlights: MatchIntelligenceEnvelope<MatchHighlightItem[]>
  insights: MatchIntelligenceEnvelope<MatchInsightItem[]>
  /**
   * Section 11: Coverage hints for this event's sport/competition.
   * Tabs must consult this before deciding whether to render or show
   * UnsupportedFeatureState. Avoids a separate /api/coverage round-trip.
   */
  coverageHints: MatchCenterCoverageHints
}
