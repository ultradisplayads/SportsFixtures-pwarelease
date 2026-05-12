import { NextRequest, NextResponse } from "next/server"

type RecommendationBody = {
  teamId?: string
  teamName?: string
  eventId?: string
  matchName?: string
  sport?: string
  competitionId?: string
  lat?: number
  lng?: number
  radiusKm?: number
}

function appBase(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`
}

function distanceLabel(distanceKm?: number): string {
  if (distanceKm == null) return "near you"
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m away`
  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)}km away`
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as RecommendationBody
  const { teamName, eventId, matchName, sport = "Football", competitionId, lat, lng } = body
  const radiusKm = body.radiusKm ?? 8

  if (!teamName && !eventId) {
    return NextResponse.json({ error: "teamName or eventId required" }, { status: 400 })
  }

  const params = new URLSearchParams()
  params.set("sport", sport)
  params.set("maxDistanceKm", String(radiusKm))
  if (competitionId) params.set("competitionId", competitionId)
  if (eventId) params.set("eventId", eventId)
  if (lat != null) params.set("lat", String(lat))
  if (lng != null) params.set("lng", String(lng))

  const base = appBase(req)
  const res = await fetch(`${base}/api/venues/discovery?${params}`, { cache: "no-store" })
  const envelope = await res.json().catch(() => null)
  const venues = Array.isArray(envelope?.data?.items) ? envelope.data.items : []
  const best = venues[0]

  if (!best) {
    return NextResponse.json({
      recommendation: null,
      reason: "No matching sports bars found in radius",
      radiusKm,
    })
  }

  const venuePath = best.slug ? `/venue/${best.slug}` : `/venue/${best.id}`
  const title = teamName ? `${teamName} bar nearby` : "Sports bar nearby"
  const bodyText = `${best.name} is ${distanceLabel(best.distanceKm)}${matchName ? ` for ${matchName}` : ""}. Want to watch there?`

  return NextResponse.json({
    recommendation: {
      venue: best,
      campaignType: "venue_recommendation",
      ecosystems: ["sportsfixtures", "pattaya1", "greatfoodplaces"],
      pushPayload: {
        targetType: lat != null && lng != null ? "location" : "team",
        title,
        message: bodyText,
        url: venuePath,
        primaryUrl: venuePath,
        secondaryUrl: eventId ? `/match/${eventId}` : "/fixtures",
        imageUrl: best.photoUrl || best.coverImage || best.image,
        category: "venue_recommendation",
        campaignId: `venue-rec-${eventId || body.teamId || best.id}`,
        lat,
        lng,
        radiusKm,
        teamIds: body.teamId ? [body.teamId] : undefined,
        actions: [
          { action: "primary", title: "View bar" },
          { action: "secondary", title: "Match details" },
        ],
      },
    },
  })
}
