// GET /api/live
// Returns live match events from the SF (Strapi) backend.
// Server-only — the SF token stays out of the browser.
// Called by LiveMatchesList via SWR.

import { NextResponse } from "next/server"

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net")
  .replace(/\/api-docs\/?$/, "")
  .replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""

export interface LiveMatchRow {
  id: string
  league: string
  leagueLogo: string | null
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
}

export async function GET() {
  try {
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
