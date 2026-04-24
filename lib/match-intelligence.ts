// ── lib/match-intelligence.ts ─────────────────────────────────────────────────
//
// Shared pure logic for the match-center layer.
// No provider calls here — this is app-derived logic only.
// All functions are pure and synchronous.

import type {
  MatchStatusPhase,
  MatchFreshness,
  ProviderSource,
  MatchIntelligenceEnvelope,
  MatchTimelineEvent,
  MatchStatItem,
  MatchStandingsRow,
  MatchHighlightItem,
} from "@/types/match-intelligence"

// ── Phase derivation ──────────────────────────────────────────────────────────

export function deriveMatchStatusPhase(input: {
  status?: string
  hasConfirmedLineups?: boolean
  isHalfTime?: boolean
  isExtraTime?: boolean
  isPenalties?: boolean
}): MatchStatusPhase {
  const status = (input.status || "").toLowerCase()

  if (status.includes("postpon")) return "postponed"
  if (status.includes("cancel") || status.includes("aband")) return "cancelled"
  if (
    status === "ft" ||
    status.includes("full") ||
    status.includes("finish") ||
    status.includes("aet")
  )
    return "full_time"
  if (input.isPenalties || status.includes("pen")) return "penalties"
  if (input.isExtraTime || status.includes("extra") || status.includes("et"))
    return "extra_time"
  if (input.isHalfTime || status === "ht" || status.includes("half"))
    return "half_time"
  if (
    status.includes("live") ||
    status === "1h" ||
    status.includes("first")
  )
    return "live_first_half"
  if (status === "2h" || status.includes("second")) return "live_second_half"
  // "In Progress" or generic integer minute strings
  if (/^\d+/.test(status) || status.includes("progress")) return "live_first_half"
  if (input.hasConfirmedLineups) return "lineups_confirmed"
  return "scheduled"
}

export function isLivePhase(phase: MatchStatusPhase): boolean {
  return (
    phase === "live_first_half" ||
    phase === "live_second_half" ||
    phase === "half_time" ||
    phase === "extra_time" ||
    phase === "penalties"
  )
}

export function isFinishedPhase(phase: MatchStatusPhase): boolean {
  return phase === "full_time"
}

export function isPreMatchPhase(phase: MatchStatusPhase): boolean {
  return phase === "scheduled" || phase === "lineups_expected" || phase === "lineups_confirmed"
}

// ── Freshness derivation ──────────────────────────────────────────────────────

export function deriveFreshness(input: {
  source: ProviderSource
  fetchedAt?: string
  maxAgeSeconds?: number
  isLive?: boolean
}): MatchFreshness {
  if (!input.fetchedAt) return "unknown"
  const age = (Date.now() - new Date(input.fetchedAt).getTime()) / 1000
  const limit = input.maxAgeSeconds ?? (input.isLive ? 30 : 3600)

  if (age <= limit) return input.isLive ? "live" : "cached"
  if (age <= limit * 2) return input.isLive ? "near-live" : "stale"
  return "stale"
}

// ── Tab visibility gate ───────────────────────────────────────────────────────

/**
 * Returns true if a tab should be shown to the user.
 * A tab is visible if it has data, is partial, or has a meaningful unavailable reason.
 * Tabs with null data AND no partial/unavailable reason are hidden — no dead shells.
 */
export function shouldShowTab(
  envelope: MatchIntelligenceEnvelope<unknown> | null | undefined
): boolean {
  if (!envelope) return false
  return Boolean(
    envelope.data ||
      envelope.partial ||
      envelope.unavailableReason
  )
}

// ── Envelope builder helpers ──────────────────────────────────────────────────

export function makeUnavailable<T>(
  feature: string,
  source: ProviderSource
): MatchIntelligenceEnvelope<T> {
  return {
    data: null,
    source,
    freshness: "unknown",
    confidence: "low",
    unavailableReason: `${feature} is not currently available from ${source}`,
  }
}

export function makeEnvelope<T>(
  data: T | null,
  source: ProviderSource,
  opts?: {
    partial?: boolean
    fetchedAt?: string
    staleAt?: string
    confidence?: "high" | "medium" | "low"
    isLive?: boolean
    maxAgeSeconds?: number
  }
): MatchIntelligenceEnvelope<T> {
  const fetchedAt = opts?.fetchedAt ?? new Date().toISOString()
  return {
    data,
    source,
    freshness: deriveFreshness({
      source,
      fetchedAt,
      isLive: opts?.isLive,
      maxAgeSeconds: opts?.maxAgeSeconds,
    }),
    confidence: opts?.confidence ?? (data ? "medium" : "low"),
    fetchedAt,
    staleAt: opts?.staleAt,
    partial: opts?.partial,
  }
}

// ── Timeline normalisation helpers ────────────────────────────────────────────

/**
 * Normalises a raw TSDB/SF-API event object into MatchTimelineEvent[].
 * The raw shape from TSDB lookupevent includes:
 *   strGoalDetails, strGoalHomeTeam, strGoalAwayTeam,
 *   strRedCards, strYellowCards, strBallPossession, etc.
 */
export function normaliseTimelineFromTSDB(raw: Record<string, any>): MatchTimelineEvent[] {
  const events: MatchTimelineEvent[] = []

  // Goals: "45:PlayerName;78:OtherPlayer" etc.
  function parseGoals(str: string | undefined, side: "home" | "away"): void {
    if (!str) return
    str.split(";").forEach((entry, i) => {
      const parts = entry.trim().split(":")
      if (parts.length < 2) return
      const minute = parseInt(parts[0], 10)
      const playerName = parts.slice(1).join(":").trim()
      if (!playerName) return
      events.push({
        id: `goal-${side}-${minute}-${i}`,
        minute: isNaN(minute) ? undefined : minute,
        side,
        type: "goal",
        title: "Goal",
        playerName,
        source: "thesportsdb",
      })
    })
  }

  function parseCards(str: string | undefined, side: "home" | "away", cardType: "yellow_card" | "red_card"): void {
    if (!str) return
    str.split(";").forEach((entry, i) => {
      const parts = entry.trim().split(":")
      const minute = parseInt(parts[0], 10)
      const playerName = parts.slice(1).join(":").trim()
      if (!playerName) return
      events.push({
        id: `${cardType}-${side}-${minute}-${i}`,
        minute: isNaN(minute) ? undefined : minute,
        side,
        type: cardType,
        title: cardType === "yellow_card" ? "Yellow Card" : "Red Card",
        playerName,
        source: "thesportsdb",
      })
    })
  }

  parseGoals(raw.strGoalHomeTeam, "home")
  parseGoals(raw.strGoalAwayTeam, "away")
  parseCards(raw.strYellowCardsHome, "home", "yellow_card")
  parseCards(raw.strYellowCardsAway, "away", "yellow_card")
  parseCards(raw.strRedCardsHome, "home", "red_card")
  parseCards(raw.strRedCardsAway, "away", "red_card")

  // Sort by minute, unknowns last
  events.sort((a, b) => {
    if (a.minute == null) return 1
    if (b.minute == null) return -1
    return a.minute - b.minute
  })

  return events
}

/**
 * Normalises a raw SF-API timeline array (structured match events) into MatchTimelineEvent[].
 * SF API events have: { minute, type, team, player, assist, description } shapes.
 */
export function normaliseTimelineFromSFAPI(raw: any[]): MatchTimelineEvent[] {
  if (!Array.isArray(raw)) return []

  const typeMap: Record<string, MatchTimelineEvent["type"]> = {
    goal:            "goal",
    own_goal:        "own_goal",
    penalty:         "penalty_goal",
    missed_penalty:  "missed_penalty",
    yellowcard:      "yellow_card",
    yellow_card:     "yellow_card",
    redcard:         "red_card",
    red_card:        "red_card",
    second_yellow:   "second_yellow",
    subst:           "substitution",
    substitution:    "substitution",
    var:             "var",
  }

  return raw
    .map((e: any, i: number) => ({
      id: e.id ? String(e.id) : `sf-event-${i}`,
      minute: e.minute != null ? Number(e.minute) : undefined,
      extraMinute: e.extra_minute != null ? Number(e.extra_minute) : undefined,
      side: (e.team === "home" ? "home" : e.team === "away" ? "away" : "neutral") as "home" | "away" | "neutral",
      type: typeMap[String(e.type || "").toLowerCase()] ?? "other",
      title: e.title || e.type || "Event",
      description: e.description || undefined,
      playerName: e.player || e.player_name || undefined,
      assistName: e.assist || e.assist_name || undefined,
      source: "thesportsdb" as ProviderSource,
    }))
    .sort((a, b) => {
      if (a.minute == null) return 1
      if (b.minute == null) return -1
      return a.minute - b.minute
    })
}

// ── Stats normalisation helpers ───────────────────────────────────────────────

/**
 * Normalises raw TSDB stat pairs into MatchStatItem[].
 * TSDB lookupevent has: strBallPossession, intShots, intShotsOnTarget,
 * intCorners, intFouls, intOffsides etc. as separate fields.
 */
export function normaliseStatsFromTSDB(raw: Record<string, any>): MatchStatItem[] {
  const stats: MatchStatItem[] = []

  function addPercent(label: string, raw_: string | undefined) {
    if (!raw_) return
    const parts = raw_.split("-")
    if (parts.length !== 2) return
    const h = parseInt(parts[0], 10)
    const a = parseInt(parts[1], 10)
    if (isNaN(h) || isNaN(a)) return
    stats.push({ label, home: h, away: a, homePercent: h, type: "percentage" })
  }

  function addCount(label: string, home: string | number | undefined, away: string | number | undefined) {
    if (home == null && away == null) return
    const h = Number(home ?? 0)
    const a = Number(away ?? 0)
    const total = h + a
    stats.push({
      label,
      home: h,
      away: a,
      homePercent: total > 0 ? Math.round((h / total) * 100) : 50,
      type: "count",
    })
  }

  addPercent("Possession", raw.strBallPossession)
  addCount("Shots", raw.intHomeShots, raw.intAwayShots)
  addCount("Shots on Target", raw.intHomeShotsOnTarget, raw.intAwayShotsOnTarget)
  addCount("Corners", raw.intHomeCorners, raw.intAwayCorners)
  addCount("Fouls", raw.intHomeFouls, raw.intAwayFouls)
  addCount("Offsides", raw.intHomeOffsides, raw.intAwayOffsides)
  addCount("Yellow Cards", raw.intHomeYellowCards, raw.intAwayYellowCards)
  addCount("Red Cards", raw.intHomeRedCards, raw.intAwayRedCards)
  addCount("Passes", raw.intHomePasses, raw.intAwayPasses)

  return stats.filter((s) => {
    const h = Number(s.home)
    const a = Number(s.away)
    return !isNaN(h) && !isNaN(a) && (h > 0 || a > 0)
  })
}

/**
 * Normalises SF-API stats array into MatchStatItem[].
 * SF API returns: [{ type: "Ball Possession", home: "52%", away: "48%" }]
 */
export function normaliseStatsFromSFAPI(raw: any[]): MatchStatItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((s: any) => {
      const label = s.type || s.label || s.name || "Stat"
      const rawHome = String(s.home ?? s.value?.home ?? "0").replace("%", "")
      const rawAway = String(s.away ?? s.value?.away ?? "0").replace("%", "")
      const h = parseFloat(rawHome)
      const a = parseFloat(rawAway)
      const isPercent = String(s.home).includes("%")
      const total = h + a
      return {
        label,
        home: isPercent ? `${h}%` : h,
        away: isPercent ? `${a}%` : a,
        homePercent: isPercent ? h : total > 0 ? Math.round((h / total) * 100) : 50,
        type: (isPercent ? "percentage" : "count") as "percentage" | "count",
      }
    })
    .filter((s) => {
      const h = parseFloat(String(s.home))
      const a = parseFloat(String(s.away))
      return !isNaN(h) && !isNaN(a)
    })
}

// ── Standings normalisation ────────────────────────────────────────────────────

export function normaliseStandingsFromTSDB(
  raw: any[],
  homeTeamId?: string,
  awayTeamId?: string
): MatchStandingsRow[] {
  if (!Array.isArray(raw)) return []
  return raw.map((row: any) => ({
    rank: parseInt(row.intRank, 10) || 0,
    teamId: String(row.idTeam || ""),
    teamName: row.strTeam || "",
    teamBadge: row.strTeamBadge || undefined,
    played: parseInt(row.intPlayed, 10) || 0,
    won: parseInt(row.intWin, 10) || 0,
    drawn: parseInt(row.intDraw, 10) || 0,
    lost: parseInt(row.intLoss, 10) || 0,
    goalsFor: parseInt(row.intGoalsFor, 10) || 0,
    goalsAgainst: parseInt(row.intGoalsAgainst, 10) || 0,
    goalDiff: parseInt(row.intGoalDifference, 10) || 0,
    points: parseInt(row.intPoints, 10) || 0,
    form: row.strForm || undefined,
    isHomeTeam: homeTeamId ? row.idTeam === homeTeamId : undefined,
    isAwayTeam: awayTeamId ? row.idTeam === awayTeamId : undefined,
  }))
}

// ── Highlights normalisation ──────────────────────────────────────────────────

export function normaliseHighlightsFromTSDB(
  strVideo: string | undefined | null,
  eventTitle: string
): MatchHighlightItem[] {
  if (!strVideo) return []
  return [
    {
      id: "tsdb-video",
      title: `${eventTitle} — Official clip`,
      url: strVideo,
      provider: "thesportsdb",
    },
  ]
}

// ── Insights derivation (app-derived only) ─────────────────────────────────────
// Rules: only derive what the data actually supports.
// No fake probabilities, xG, or pressure graphs.

import type { MatchInsightItem } from "@/types/match-intelligence"

export function deriveInsightsFromContext(input: {
  standings?: MatchStandingsRow[]
  homeTeamId?: string
  awayTeamId?: string
  homeTeamName?: string
  awayTeamName?: string
}): MatchInsightItem[] {
  const insights: MatchInsightItem[] = []
  const { standings, homeTeamId, awayTeamId, homeTeamName, awayTeamName } = input

  if (standings && standings.length > 0) {
    const homeRow = standings.find((r) => r.teamId === homeTeamId)
    const awayRow = standings.find((r) => r.teamId === awayTeamId)

    if (homeRow && awayRow) {
      const homeRank = homeRow.rank
      const awayRank = awayRow.rank

      // Top-of-table context
      if (homeRank === 1) {
        insights.push({
          id: "home-top",
          type: "context",
          title: `${homeTeamName || "Home"} leads the table`,
          description: `${homeTeamName || "Home"} currently sit top of the league with ${homeRow.points} points from ${homeRow.played} games.`,
          source: "derived",
          confidence: "high",
        })
      } else if (awayRank === 1) {
        insights.push({
          id: "away-top",
          type: "context",
          title: `${awayTeamName || "Away"} leads the table`,
          description: `${awayTeamName || "Away"} travel here as league leaders with ${awayRow.points} points.`,
          source: "derived",
          confidence: "high",
        })
      }

      // Relegation zone context (bottom 3 of a 20-team table, scaled)
      const total = standings.length
      const relegationZone = total > 10 ? total - 2 : total
      if (homeRank >= relegationZone) {
        insights.push({
          id: "home-relegation",
          type: "context",
          title: `${homeTeamName || "Home"} in the drop zone`,
          description: `${homeTeamName || "Home"} are in the bottom three with ${homeRow.points} points — a result here is crucial.`,
          source: "derived",
          confidence: "medium",
        })
      }
      if (awayRank >= relegationZone) {
        insights.push({
          id: "away-relegation",
          type: "context",
          title: `${awayTeamName || "Away"} fighting relegation`,
          description: `${awayTeamName || "Away"} are in the bottom three and need points to escape the drop.`,
          source: "derived",
          confidence: "medium",
        })
      }

      // Title race proximity
      if (Math.abs(homeRank - awayRank) <= 3 && homeRank <= 3 && awayRank <= 3) {
        insights.push({
          id: "title-race",
          type: "context",
          title: "Title race clash",
          description: `Both sides are in the top three — this could have significant implications for the title race.`,
          source: "derived",
          confidence: "medium",
        })
      }

      // Form context (if available)
      if (homeRow.form) {
        const recent = homeRow.form.split("").slice(0, 5)
        const wins = recent.filter((r) => r.toLowerCase() === "w").length
        if (wins >= 4) {
          insights.push({
            id: "home-form",
            type: "form",
            title: `${homeTeamName || "Home"} in strong form`,
            description: `${homeTeamName || "Home"} have won ${wins} of their last ${recent.length} matches.`,
            source: "derived",
            confidence: "high",
          })
        }
      }
      if (awayRow.form) {
        const recent = awayRow.form.split("").slice(0, 5)
        const wins = recent.filter((r) => r.toLowerCase() === "w").length
        if (wins >= 4) {
          insights.push({
            id: "away-form",
            type: "form",
            title: `${awayTeamName || "Away"} in fine away form`,
            description: `${awayTeamName || "Away"} have won ${wins} of their last ${recent.length} matches.`,
            source: "derived",
            confidence: "high",
          })
        }
      }
    }
  }

  return insights
}


