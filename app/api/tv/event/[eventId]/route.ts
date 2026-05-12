import { NextRequest, NextResponse } from "next/server"
import { getEventDetails } from "@/app/actions/sports-api"
import { getTVEventsForEvent } from "@/lib/sf-api"

function normaliseChannel(row: any) {
  const name = row.channel || row.strChannel || row.strTVStation || row.name || ""
  if (!name) return null
  return {
    id: String(row.id || row.documentId || name),
    channel: name,
    channelLogo: row.channelLogo || row.strChannelLogo || row.logo || null,
    country: row.country || row.strCountry || null,
    countryCode: row.countryCode || null,
  }
}

function sportForTvApi(sport?: string) {
  if (!sport) return ""
  if (sport.toLowerCase() === "football") return "Soccer"
  return sport
}

function isBlockedChannel(row: any) {
  const haystack = [
    row.channel,
    row.strChannel,
    row.country,
    row.strCountry,
    row.countryCode,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return ["israel", "israeli"].some((term) => haystack.includes(term))
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params
  const base = `${req.nextUrl.protocol}//${req.nextUrl.host}`

  try {
    const exact = await getTVEventsForEvent(eventId)
    let channels = exact
      .map(normaliseChannel)
      .filter((row): row is NonNullable<ReturnType<typeof normaliseChannel>> => !!row)
      .filter((row) => !isBlockedChannel(row))

    if (channels.length > 0) {
      return NextResponse.json({ data: channels, source: "event" })
    }

    const event = await getEventDetails(eventId)
    if (!event?.dateEvent) {
      return NextResponse.json({ data: [], source: "none" })
    }

    const tvUrl = new URL(`${base}/api/tv`)
    tvUrl.searchParams.set("date", event.dateEvent)
    tvUrl.searchParams.set("sport", sportForTvApi(event.strSport || ""))

    const tvRes = await fetch(tvUrl, { cache: "no-store" })
    const tvJson = tvRes.ok ? await tvRes.json() : { data: [] }
    const rows = Array.isArray(tvJson?.data) ? tvJson.data : []
    const home = event.strHomeTeam?.toLowerCase() || ""
    const away = event.strAwayTeam?.toLowerCase() || ""

    const matched = rows.find((row: any) => {
      const rowHome = String(row.homeTeam || row.strHomeTeam || "").toLowerCase()
      const rowAway = String(row.awayTeam || row.strAwayTeam || "").toLowerCase()
      const title = String(row.event || row.strEvent || "").toLowerCase()
      return (
        (rowHome.includes(home) && rowAway.includes(away)) ||
        (title.includes(home) && title.includes(away))
      )
    })

    channels = (matched?.channels || [])
      .map((name: string) => normaliseChannel({ channel: name }))
      .filter((row: any) => !!row)
      .filter((row: any) => !isBlockedChannel(row))

    return NextResponse.json({
      data: channels,
      source: matched ? "tv-guide" : "none",
    })
  } catch (error) {
    console.error("[api/tv/event]", error)
    return NextResponse.json({ data: [], source: "error" }, { status: 200 })
  }
}
