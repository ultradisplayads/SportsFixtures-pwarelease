// lib/ticker-live.ts
// Section 15 — Live score + kickoff + result to ticker item bridge.
//
// All mapping from raw SportsDB/API-sports event shapes to TickerItem
// lives here. The ticker feed route calls these instead of inlining logic.

import type { TickerItem } from "@/types/ticker"
import {
  formatTickerHeadline,
  formatTickerMinute,
} from "@/lib/ticker-score-formatter"

// Raw event shape from TheSportsDB / internal livescores endpoint
export interface RawLiveEvent {
  idEvent?: string
  strHomeTeam?: string
  strAwayTeam?: string
  intHomeScore?: string | number | null
  intAwayScore?: string | number | null
  strProgress?: string | null  // "45", "HT", "90+2", "FT"
  strLeague?: string
  idLeague?: string
  strSport?: string
  strTimestamp?: string | null
  strStatus?: string
}

/**
 * Converts a raw live match event into a TickerItem with type "live_score".
 * Returns null if the event lacks the minimum required fields.
 */
export function buildLiveScoreItem(raw: RawLiveEvent): TickerItem | null {
  const id = String(raw.idEvent ?? "")
  const home = raw.strHomeTeam ?? null
  const away = raw.strAwayTeam ?? null
  if (!id || (!home && !away)) return null

  const minute = formatTickerMinute(raw.strProgress ?? null, "live_score")
  const headline = formatTickerHeadline(home, away, raw.intHomeScore, raw.intAwayScore, "live_score")

  return {
    id: `live_${id}`,
    type: "live_score",
    channel: "primary",
    priority: "high",
    freshness: "live",
    headline,
    subline: minute,
    minute: minute,
    label: raw.strLeague ?? undefined,
    href: `/match/${id}`,
    teamHome: home ?? undefined,
    teamAway: away ?? undefined,
    scoreHome: raw.intHomeScore ?? undefined,
    scoreAway: raw.intAwayScore ?? undefined,
    source: "thesportsdb",
    sport: raw.strSport?.toLowerCase() ?? "soccer",
    competitionId: raw.idLeague ? String(raw.idLeague) : undefined,
    eventId: id,
    featured: false,
  }
}

/**
 * Batch-converts an array of raw live events.
 * Filters out null results and deduplicates by eventId.
 */
export function buildLiveScoreItems(raws: RawLiveEvent[]): TickerItem[] {
  const seen = new Set<string>()
  return raws
    .map(buildLiveScoreItem)
    .filter((item): item is TickerItem => {
      if (!item) return false
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
}

/**
 * Converts a raw upcoming match to a TickerItem with type "kickoff".
 * Used for fixtures starting within the next 2 hours.
 */
export function buildKickoffItem(raw: RawLiveEvent & { startsAt?: string }): TickerItem | null {
  const id = String(raw.idEvent ?? "")
  const home = raw.strHomeTeam ?? null
  const away = raw.strAwayTeam ?? null
  if (!id || (!home && !away)) return null

  const kickoffTime = raw.startsAt ?? raw.strTimestamp ?? null
  let subline: string | undefined
  if (kickoffTime) {
    const date = new Date(kickoffTime)
    if (!isNaN(date.getTime())) {
      subline = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
    }
  }

  return {
    id: `ko_${id}`,
    type: "kickoff",
    channel: "primary",
    priority: "normal",
    freshness: "static",
    headline: `${home ?? "Home"} vs ${away ?? "Away"}`,
    subline,
    label: raw.strLeague ?? undefined,
    href: `/match/${id}`,
    teamHome: home ?? undefined,
    teamAway: away ?? undefined,
    source: "thesportsdb",
    sport: raw.strSport?.toLowerCase() ?? "soccer",
    competitionId: raw.idLeague ? String(raw.idLeague) : undefined,
    eventId: id,
    startsAt: kickoffTime ?? undefined,
    featured: false,
  }
}

/**
 * Converts a completed match to a TickerItem with type "result".
 */
export function buildResultItem(raw: RawLiveEvent): TickerItem | null {
  const id = String(raw.idEvent ?? "")
  const home = raw.strHomeTeam ?? null
  const away = raw.strAwayTeam ?? null
  if (!id || (!home && !away)) return null

  return {
    id: `res_${id}`,
    type: "result",
    channel: "primary",
    priority: "normal",
    freshness: "updated",
    headline: formatTickerHeadline(home, away, raw.intHomeScore, raw.intAwayScore, "result"),
    minute: "FT",
    label: raw.strLeague ?? undefined,
    href: `/match/${id}`,
    teamHome: home ?? undefined,
    teamAway: away ?? undefined,
    scoreHome: raw.intHomeScore ?? undefined,
    scoreAway: raw.intAwayScore ?? undefined,
    source: "thesportsdb",
    sport: raw.strSport?.toLowerCase() ?? "soccer",
    competitionId: raw.idLeague ? String(raw.idLeague) : undefined,
    eventId: id,
    featured: false,
  }
}

export function buildResultItems(raws: RawLiveEvent[]): TickerItem[] {
  const seen = new Set<string>()
  return raws
    .map(buildResultItem)
    .filter((item): item is TickerItem => {
      if (!item) return false
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
}
