// GET /api/live
// Returns live match events from the SF (Strapi) backend.
// Server-only — the SF token stays out of the browser.
// Called by LiveMatchesList via SWR.

import { NextResponse } from "next/server"
import {
  getApiFootballFixtureLiveDetails,
} from "@/lib/api-football"
import { getApiSportsLiveDetailBudget, getApiSportsLiveEvents, hasApiSportsKey } from "@/lib/api-sports"

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net")
  .replace(/\/api-docs\/?$/, "")
  .replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""

export interface LiveMatchEvent {
  id: string
  type: "goal" | "booking"
  minute: number | null
  team: "home" | "away" | null
  player: string | null
  detail: string | null
}

export interface LiveMatchDetails {
  events: LiveMatchEvent[]
  possession: {
    home: number | null
    away: number | null
  }
}

export interface LiveMatchRow {
  id: string
  league: string
  leagueLogo: string | null
  sport?: string | null
  providerProduct?: string | null
  homeTeam: string
  homeLogo: string | null
  awayTeam: string
  awayLogo: string | null
  homeScore: number | null
  awayScore: number | null
  /** Raw progress string e.g. "45'", "HT", "FT", "NS" */
  progress: string | null
  /** UTC date string YYYY-MM-DD */
  dateEvent: string | null
  /** UTC time string HH:MM:SS */
  strTime: string | null
  status: "live" | "ft" | "ns"
  liveDetails?: LiveMatchDetails
}

function parsePercent(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value !== "string") return null
  const match = value.match(/\d+/)
  return match ? Number(match[0]) : null
}

function inferSide(teamName: string | null | undefined, homeTeam: string, awayTeam: string): "home" | "away" | null {
  const team = String(teamName || "").toLowerCase().trim()
  if (!team) return null
  if (team === homeTeam.toLowerCase().trim()) return "home"
  if (team === awayTeam.toLowerCase().trim()) return "away"
  if (team.includes(homeTeam.toLowerCase().trim()) || homeTeam.toLowerCase().includes(team)) return "home"
  if (team.includes(awayTeam.toLowerCase().trim()) || awayTeam.toLowerCase().includes(team)) return "away"
  return null
}

function normaliseApiFootballLiveDetails(
  rawEvents: any[],
  rawStatistics: any[],
  homeTeam: string,
  awayTeam: string,
): LiveMatchDetails {
  const events = rawEvents
    .map((event: any, index: number): LiveMatchEvent | null => {
      const type = String(event?.type || "").toLowerCase()
      const detail = String(event?.detail || event?.comments || "").trim()
      const isGoal = type === "goal" || detail.toLowerCase().includes("goal")
      const isBooking = type === "card" || /yellow|red/.test(detail.toLowerCase())
      if (!isGoal && !isBooking) return null

      return {
        id: String(event?.id ?? `${event?.time?.elapsed ?? "event"}-${index}`),
        type: isGoal ? "goal" : "booking",
        minute: typeof event?.time?.elapsed === "number" ? event.time.elapsed : parsePercent(event?.time?.elapsed),
        team: inferSide(event?.team?.name, homeTeam, awayTeam),
        player: event?.player?.name || null,
        detail: detail || (isGoal ? "Goal" : "Card"),
      }
    })
    .filter(Boolean) as LiveMatchEvent[]

  let homePossession: number | null = null
  let awayPossession: number | null = null

  rawStatistics.forEach((teamStats: any) => {
    const side = inferSide(teamStats?.team?.name, homeTeam, awayTeam)
    const possessionRow = Array.isArray(teamStats?.statistics)
      ? teamStats.statistics.find((stat: any) => String(stat?.type || "").toLowerCase() === "ball possession")
      : null
    const value = parsePercent(possessionRow?.value)
    if (side === "home") homePossession = value
    if (side === "away") awayPossession = value
  })

  return {
    events: events.slice(-5),
    possession: {
      home: homePossession,
      away: awayPossession,
    },
  }
}

function normaliseStrapiLiveDetails(row: any, homeTeam: string, awayTeam: string): LiveMatchDetails | undefined {
  const rawEvents =
    Array.isArray(row.liveEvents) ? row.liveEvents :
    Array.isArray(row.timeline) ? row.timeline :
    Array.isArray(row.events) ? row.events :
    []

  const events = rawEvents
    .map((event: any, index: number): LiveMatchEvent | null => {
      const typeText = String(event.type || event.strEventType || event.kind || event.detail || "").toLowerCase()
      const isGoal = typeText.includes("goal")
      const isBooking = typeText.includes("card") || typeText.includes("yellow") || typeText.includes("red")
      if (!isGoal && !isBooking) return null

      return {
        id: String(event.id ?? event.idEventTimeline ?? `${event.minute ?? index}-${index}`),
        type: isGoal ? "goal" : "booking",
        minute: parsePercent(event.minute ?? event.intMinute ?? event.elapsed ?? event.time),
        team: event.side === "home" || event.team === "home"
          ? "home"
          : event.side === "away" || event.team === "away"
          ? "away"
          : inferSide(event.teamName ?? event.strTeam ?? event.team?.name, homeTeam, awayTeam),
        player: event.playerName ?? event.strPlayer ?? event.player?.name ?? null,
        detail: event.detail ?? event.strDetail ?? event.card ?? (isGoal ? "Goal" : "Card"),
      }
    })
    .filter(Boolean) as LiveMatchEvent[]

  const home = parsePercent(row.homePossession ?? row.intHomePossession ?? row.stats?.homePossession)
  const away = parsePercent(row.awayPossession ?? row.intAwayPossession ?? row.stats?.awayPossession)

  if (events.length === 0 && home == null && away == null) return undefined

  return {
    events: events.slice(-5),
    possession: { home, away },
  }
}

export async function GET() {
  try {
    if (hasApiSportsKey()) {
      const apiSportsEvents = await getApiSportsLiveEvents()
      if (apiSportsEvents.length > 0) {
        const detailBudget = getApiSportsLiveDetailBudget()
        const detailRows = await Promise.all(
          apiSportsEvents.map((event, index) => (
            event.product === "football" && index < detailBudget
              ? getApiFootballFixtureLiveDetails(event.id)
              : Promise.resolve({ events: [], statistics: [] })
          )),
        )

        const matches: LiveMatchRow[] = apiSportsEvents.map((event, index): LiveMatchRow => {
          const liveDetails = detailRows[index]
            ? normaliseApiFootballLiveDetails(
                detailRows[index].events,
                detailRows[index].statistics,
                event.homeTeam || "",
                event.awayTeam || "",
              )
            : undefined

          return {
            id: event.id,
            league: event.league || "Unknown",
            leagueLogo: event.leagueLogo || null,
            sport: event.sport,
            providerProduct: event.product,
            homeTeam: event.homeTeam || "",
            homeLogo: event.homeLogo || null,
            awayTeam: event.awayTeam || "",
            awayLogo: event.awayLogo || null,
            homeScore: event.homeScore,
            awayScore: event.awayScore,
            progress: event.progress,
            dateEvent: event.dateEvent,
            strTime: event.strTime,
            status: event.status,
            liveDetails,
          }
        })

        return NextResponse.json(
          { matches, source: "api-sports" },
          { headers: { "Cache-Control": "no-store" } },
        )
      }
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)

    const res = await fetch(
      `${SF_API_URL}/api/events?filters[strStatus][$eq]=live&pagination[pageSize]=50`,
      {
        cache: "no-store",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
        },
      },
    )
    clearTimeout(timeout)

    if (!res.ok) {
      return NextResponse.json({ matches: [] }, { status: 200 })
    }

    const json = await res.json()
    const rows: any[] = Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.events)
      ? json.events
      : Array.isArray(json)
      ? json
      : []

    const RESULT_STATUSES = new Set(["FT", "AET", "PEN"])

    const matches: LiveMatchRow[] = rows
      .filter((row: any) => {
        const progress = (row.strProgress ?? row.strStatus ?? "").toUpperCase().trim()
        return !RESULT_STATUSES.has(progress)
      })
      .map((row: any): LiveMatchRow => {
        const homeTeamName =
          typeof row.homeTeam === "string"
            ? row.homeTeam
            : row.homeTeam?.strTeam ?? row.homeTeam?.name ?? row.strHomeTeam ?? ""
        const awayTeamName =
          typeof row.awayTeam === "string"
            ? row.awayTeam
            : row.awayTeam?.strTeam ?? row.awayTeam?.name ?? row.strAwayTeam ?? ""

        return {
          id: String(row.id ?? row.idEvent ?? ""),
          league: row.strLeague ?? row.league?.strLeague ?? row.league?.name ?? "Unknown",
          leagueLogo: row.league?.strBadge ?? row.strLeagueBadge ?? null,
          sport: row.strSport ?? row.sport?.strSport ?? row.sport?.name ?? null,
          providerProduct: null,
          homeTeam: homeTeamName,
          homeLogo: row.strHomeTeamBadge ?? row.homeTeam?.strTeamBadge ?? null,
          awayTeam: awayTeamName,
          awayLogo: row.strAwayTeamBadge ?? row.awayTeam?.strTeamBadge ?? null,
          homeScore: row.intHomeScore != null ? Number(row.intHomeScore) : null,
          awayScore: row.intAwayScore != null ? Number(row.intAwayScore) : null,
          progress: row.strProgress ?? row.strStatus ?? null,
          dateEvent: row.dateEvent ?? row.strDate ?? null,
          strTime: row.strTime ?? null,
          status: "live",
          liveDetails: normaliseStrapiLiveDetails(row, homeTeamName, awayTeamName),
        }
      })

    return NextResponse.json(
      { matches },
      {
        headers: { "Cache-Control": "no-store" },
      },
    )
  } catch {
    return NextResponse.json({ matches: [] }, { status: 200 })
  }
}
