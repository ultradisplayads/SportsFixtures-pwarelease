import { NextRequest, NextResponse } from "next/server"
import { normaliseVenue } from "@/lib/venue-discovery"
import { makeSuccessEnvelope, makeEmptyEnvelope } from "@/lib/contracts"
import {
  fetchControlPlaneSnapshot,
  getVenueBoostScore,
} from "@/lib/control-plane"
import type { VenueCard, VenueDiscoveryResponse } from "@/types/venues"
import type { NormalizedEnvelope } from "@/types/contracts"

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net")
  .replace(/\/api-docs\/?$/, "")
  .replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""

function getDefaultPhoto(category: string): string {
  if (category?.includes("sports_bar")) return "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80"
  if (category?.includes("rooftop")) return "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800&q=80"
  if (category?.includes("bar")) return "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80"
  if (category?.includes("restaurant")) return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
  if (category?.includes("cafe")) return "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80"
  if (category?.includes("pub")) return "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80"
  return "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80"
}

async function fetchSFVenues(qs: URLSearchParams): Promise<any[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(`${SF_API_URL}/api/watch-venues?${qs}`, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
      },
    })
    clearTimeout(timeout)
    if (!res.ok) return []
    const json = await res.json()
    return Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.venues)
      ? json.venues
      : []
  } catch {
    clearTimeout(timeout)
    return []
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const sp = req.nextUrl.searchParams
  const fetchedAt = new Date().toISOString()

  const eventId = sp.get("eventId") ?? undefined
  const sport = sp.get("sport") ?? undefined
  const competitionId = sp.get("competitionId") ?? undefined
  const latRaw = sp.get("lat")
  const lngRaw = sp.get("lng")
  const followedIdsRaw = sp.get("followedIds") ?? ""
  const maxDistanceKm = sp.get("maxDistanceKm") ? Number(sp.get("maxDistanceKm")) : 50

  const userLat = latRaw ? parseFloat(latRaw) : undefined
  const userLng = lngRaw ? parseFloat(lngRaw) : undefined
  const followedIds = new Set(followedIdsRaw ? followedIdsRaw.split(",").filter(Boolean) : [])

  const sfQs = new URLSearchParams()
  sfQs.set("pagination[pageSize]", "80")
  if (userLat != null) sfQs.set("lat", String(userLat))
  if (userLng != null) sfQs.set("lng", String(userLng))
  sfQs.set("radius", String(maxDistanceKm))
  if (sport) sfQs.set("filters[sports][$containsi]", sport)
  if (eventId) sfQs.set("filters[showingEventIds][$contains]", eventId)

  try {
    let venueBoosts: any[] = []
    try {
      const snapshot = await fetchControlPlaneSnapshot()
      venueBoosts = snapshot.venueBoosts ?? []
    } catch {
      // Strapi unavailable — continue with no boosts applied
    }

    const rawVenues = await fetchSFVenues(sfQs)

    // No live API data — return empty, no hardcoded fallback
    if (!rawVenues || rawVenues.length === 0) {
      const payload: VenueDiscoveryResponse = {
        items: [],
        filters: { sports: [], facilities: [] },
        locationUsed: false,
      }
      const envelope: NormalizedEnvelope<VenueDiscoveryResponse> = makeSuccessEnvelope({
        data: payload,
        source: "strapi",
        fetchedAt,
        maxAgeSeconds: 60,
        confidence: "low",
      })
      return NextResponse.json(envelope)
    }

    const cards: VenueCard[] = rawVenues
      .map((raw) => {
        const venueId = String(raw.id ?? "")
        const { boosted, sponsorDisclosure } = getVenueBoostScore(venueBoosts, venueId, {
          sport,
          competitionId,
          eventId,
        })
        const boostedRaw = boosted
          ? { ...raw, editorialBoost: true, sponsored: raw.sponsored || sponsorDisclosure }
          : raw
        return {
          ...boostedRaw,
          id: String(boostedRaw.id ?? ""),
          photoUrl: boostedRaw.photoUrl || getDefaultPhoto(boostedRaw.primaryCategory),
          sports: boostedRaw.sports_supported
            ? boostedRaw.sports_supported.split(";").map((s: string) => s.trim()).filter(Boolean)
            : [],
          facilities: [],
          offers: [],
          offerCount: 0,
          showingEventIds: [],
          reasons: [],
          score: boostedRaw.sponsored ? 10 : 0,
          showingNow: boostedRaw.sports_bar_signal === "Strong",
        }
      })
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

    const allSports = Array.from(new Set(cards.flatMap((c) => c.sports ?? [])))
    const allFacilities = Array.from(new Set(cards.flatMap((c) => c.facilities ?? [])))

    const payload: VenueDiscoveryResponse = {
      items: cards,
      filters: { sports: allSports, facilities: allFacilities },
      locationUsed: userLat != null && userLng != null,
      eventContext: eventId ? { eventId, competitionId, sport } : undefined,
    }

    const envelope: NormalizedEnvelope<VenueDiscoveryResponse> = makeSuccessEnvelope({
      data: payload,
      source: "strapi",
      fetchedAt,
      maxAgeSeconds: 300,
      confidence: cards.length > 0 ? "high" : "low",
    })

    return NextResponse.json(envelope)
  } catch (err) {
    console.error("[venues/discovery] unexpected error:", err)
    // Return empty on error — no hardcoded fallback
    const payload: VenueDiscoveryResponse = {
      items: [],
      filters: { sports: [], facilities: [] },
      locationUsed: false,
    }
    const envelope: NormalizedEnvelope<VenueDiscoveryResponse> = makeSuccessEnvelope({
      data: payload,
      source: "strapi",
      fetchedAt: new Date().toISOString(),
      maxAgeSeconds: 60,
      confidence: "low",
    })
    return NextResponse.json(envelope)
  }
}
