import { NextRequest, NextResponse } from "next/server"
import { getSFVenues } from "@/lib/sf-api"
import { filterNearbyEventVenues, buildNearbyReasons } from "@/lib/nearby-event"
import { getPattayaVenues } from "@/lib/venues-pattaya"
import type { NearbyVenueCard } from "@/types/nearby-event"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const latRaw       = searchParams.get("lat")
    const lngRaw       = searchParams.get("lng")
    const sport        = searchParams.get("sport") || undefined
    const competitionId = searchParams.get("competitionId") || undefined
    const eventId      = searchParams.get("eventId") || undefined
    const radiusKm     = parseFloat(searchParams.get("radiusKm") ?? searchParams.get("radius") ?? "15")

    const lat = latRaw !== null ? parseFloat(latRaw) : NaN
    const lng = lngRaw !== null ? parseFloat(lngRaw) : NaN
    const locationUsed = isFinite(lat) && isFinite(lng)
    const radius = isFinite(radiusKm) ? radiusKm : 15

    // Fetch raw venues from SF API (returns [] when no credentials or no results)
    const rawVenues = await getSFVenues(
      locationUsed ? { lat, lng, radius } : undefined,
    )

    // No live API data — serve the Pattaya venue dataset.
    if (!rawVenues || rawVenues.length === 0) {
      return NextResponse.json(
        {
          items:[],
          locationUsed: false,
          filters: { radiusKm: radius, sport, competitionId, eventId },
          generatedAt: new Date().toISOString(),
        },
        { headers: { "Cache-Control": "no-store" } },
      )
    }

    // Normalise to NearbyVenueCard shape and annotate reasons
    const normalized: NearbyVenueCard[] = (rawVenues ?? []).map((v) => {
      const vAny = v as unknown as Record<string, unknown>
      const distKm = typeof vAny.distanceKm === "number" ? vAny.distanceKm : null
      const vSport = typeof vAny.sport === "string" ? vAny.sport : null
      const vCompId = typeof vAny.competitionId === "string" ? vAny.competitionId : null
      const vEventIds: string[] = Array.isArray(vAny.eventIds) ? (vAny.eventIds as string[]) : []

      return {
        id: String(vAny.id ?? ""),
        name: String(vAny.name ?? "Unknown Venue"),
        area: typeof vAny.area === "string" ? vAny.area : null,
        city: typeof vAny.city === "string" ? vAny.city : null,
        distanceKm: distKm,
        sport: vSport,
        competitionId: vCompId,
        eventIds: vEventIds,
        showingNow: Boolean(vAny.showingNow),
        checkedInCount: typeof vAny.checkedInCount === "number" ? vAny.checkedInCount : null,
        watchingHereCount: typeof vAny.watchingHereCount === "number" ? vAny.watchingHereCount : null,
        operatorMarkedBusy: Boolean(vAny.operatorMarkedBusy),
        userCheckedIn: Boolean(vAny.userCheckedIn),
        userWatchingHere: Boolean(vAny.userWatchingHere),
        reasons: buildNearbyReasons({
          distanceKm: distKm,
          eventMatched: Boolean(eventId && vEventIds.includes(eventId)),
          competitionMatched: Boolean(competitionId && vCompId === competitionId),
          sportMatched: Boolean(sport && vSport === sport),
          showingNow: Boolean(vAny.showingNow),
        }),
      }
    })

    const items = filterNearbyEventVenues(normalized, {
      maxDistanceKm: radius,
      sport,
      competitionId,
      eventId,
    })

    return NextResponse.json(
      {
        items,
        locationUsed,
        filters: { radiusKm: radius, sport, competitionId, eventId },
        generatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (err) {
    console.error("[api/nearby/venues]", err)
    return NextResponse.json(
      { error: "Failed to load nearby venues" },
      { status: 500 },
    )
  }
}
