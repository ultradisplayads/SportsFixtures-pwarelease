import { NextRequest, NextResponse } from "next/server"
import { getSFEvents } from "@/lib/sf-api"
import { normalizeResultRow } from "@/lib/results"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const sport       = searchParams.get("sport")       || undefined
    const leagueId    = searchParams.get("competitionId") || undefined
    const teamId      = searchParams.get("teamId")       || undefined
    const date        = searchParams.get("date")         || undefined

    // Fetch finished events from the SF backend.
    // status=FT is the canonical Strapi value for full-time results.
    const raw = await getSFEvents({ status: "FT", date, leagueId })

    // Apply optional sport filter client-side (Strapi free-tier may not support
    // compound filters on sport+status simultaneously).
    const filtered = sport
      ? raw.filter(
          (e) =>
            (e.sport?.strSport ?? e.sport?.name ?? e.strSport ?? "")
              .toLowerCase() === sport.toLowerCase(),
        )
      : raw

    // teamId filter — matches where the team appears on either side
    const final = teamId
      ? filtered.filter(
          (e) =>
            String(e.idHomeTeam) === teamId ||
            String(e.idAwayTeam) === teamId,
        )
      : filtered

    const items = final.map((e) =>
      normalizeResultRow({
        id:              e.id,
        sport:           e.sport?.strSport ?? e.sport?.name ?? null,
        competitionId:   e.league?.idLeague ?? null,
        competitionName: e.league?.strLeague ?? e.league?.name ?? null,
        homeTeamName:    e.strHomeTeam ?? (e as any).homeTeam ?? null,
        awayTeamName:    e.strAwayTeam ?? (e as any).awayTeam ?? null,
        homeScore:       e.intHomeScore ?? null,
        awayScore:       e.intAwayScore ?? null,
        finishedAt:      e.dateEvent ? `${e.dateEvent}${e.strTime ? " " + e.strTime : ""}` : null,
        status:          "FT",
      }),
    )

    return NextResponse.json(
      { items, generatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (err) {
    console.error("[api/results]", err)
    return NextResponse.json({ error: "Failed to load results" }, { status: 500 })
  }
}
