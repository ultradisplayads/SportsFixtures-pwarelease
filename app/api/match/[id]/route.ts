import { NextRequest, NextResponse } from "next/server"
import { getSFEventById } from "@/lib/sf-api"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const event = await getSFEventById(id)
    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const homeTeamName =
      typeof event.homeTeam === "object"
        ? event.homeTeam?.name ?? event.strHomeTeam ?? null
        : event.strHomeTeam ?? null

    const awayTeamName =
      typeof event.awayTeam === "object"
        ? event.awayTeam?.name ?? event.strAwayTeam ?? null
        : event.strAwayTeam ?? null

    const tvChannels: string[] =
      Array.isArray(event.tvChannels)
        ? event.tvChannels.map((ch: unknown) =>
            typeof ch === "object" && ch !== null
              ? (ch as Record<string, unknown>).name ?? String(ch)
              : String(ch),
          )
        : []

    const payload = {
      idEvent: event.id ?? event.idEvent ?? id,
      homeTeamName,
      awayTeamName,
      home_team_id: typeof event.homeTeam === "object" ? event.homeTeam?.id ?? null : null,
      away_team_id: typeof event.awayTeam === "object" ? event.awayTeam?.id ?? null : null,
      competitionName:
        typeof event.league === "object"
          ? event.league?.name ?? event.strLeague ?? null
          : event.strLeague ?? null,
      competition_slug:
        typeof event.league === "object" ? event.league?.id ?? null : null,
      sport:
        typeof event.sport === "object"
          ? event.sport?.strSport ?? event.sport?.name ?? null
          : event.sport ?? null,
      kickoffAt: event.dateEvent
        ? `${event.dateEvent}${event.strTime ? "T" + event.strTime : ""}`
        : null,
      endsAt: null,
      venueName:
        typeof event.venue === "object"
          ? event.venue?.name ?? event.strVenue ?? null
          : event.strVenue ?? null,
      venue_id:
        typeof event.venue === "object" ? event.venue?.id ?? null : null,
      venueAddress: null,
      tvChannels,
      image: event.strThumb ?? event.strBanner ?? null,
      summary: null,
      published_at: null,
      updated_at: null,
      author_name: null,
      reviewed_by: null,
      seo: null,
    }

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    })
  } catch (err) {
    console.error("[api/match]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
