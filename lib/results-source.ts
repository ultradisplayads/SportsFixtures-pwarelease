// lib/results-source.ts
// Section 08 — Source controller for the /api/results route.
// Centralises which backend provides result data and how it is normalised.
// When a second provider is added, extend ResultSource and update resolve().

import { getSFEvents, type SFEvent } from "@/lib/sf-api"

export type ResultSource = "sf_api"

export interface NormalisedResult {
  id: string
  homeTeam: string
  awayTeam: string
  homeLogo: string | null
  awayLogo: string | null
  homeScore: number | null
  awayScore: number | null
  league: string | null
  leagueLogo: string | null
  sport: string | null
  dateEvent: string | null
  strTime: string | null
  status: "FT"
}

function normaliseSFResult(e: SFEvent): NormalisedResult {
  return {
    id:        String(e.id),
    homeTeam:  String((e as any).homeTeam ?? ""),
    awayTeam:  String((e as any).awayTeam ?? ""),
    homeLogo:  (e as any).homeBadge ?? null,
    awayLogo:  (e as any).awayBadge ?? null,
    homeScore: e.intHomeScore != null ? Number(e.intHomeScore) : null,
    awayScore: e.intAwayScore != null ? Number(e.intAwayScore) : null,
    league:    e.strLeague ?? (e.league as any)?.name ?? null,
    leagueLogo:(e.league as any)?.leagueLogo ?? null,
    sport:     e.sport?.strSport ?? e.sport?.name ?? null,
    dateEvent: e.dateEvent ?? null,
    strTime:   e.strTime ?? null,
    status:    "FT",
  }
}

export async function resolveResults(params?: {
  sport?: string
  leagueId?: string
  teamId?: string
  date?: string
  source?: ResultSource
}): Promise<NormalisedResult[]> {
  const raw = await getSFEvents({
    status: "FT",
    date:     params?.date,
    leagueId: params?.leagueId,
  })

  let filtered = raw

  if (params?.sport) {
    const s = params.sport.toLowerCase()
    filtered = filtered.filter(
      (e) => (e.sport?.strSport ?? e.sport?.name ?? e.strSport ?? "").toLowerCase() === s,
    )
  }

  if (params?.teamId) {
    filtered = filtered.filter(
      (e) =>
        String(e.idHomeTeam) === params.teamId ||
        String(e.idAwayTeam) === params.teamId,
    )
  }

  return filtered.map(normaliseSFResult)
}
