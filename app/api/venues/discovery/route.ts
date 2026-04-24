import { NextRequest, NextResponse } from "next/server"
import { normaliseVenue } from "@/lib/venue-discovery"
import { makeSuccessEnvelope, makeEmptyEnvelope } from "@/lib/contracts"
import { getPattayaVenues } from "@/lib/venues-pattaya"
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

async function fetchSFVenues(qs: URLSearchParams): Promise<any[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(`${SF_API_URL}/api/venues?${qs}`, {
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
    // Load control-plane snapshot — never let this throw; degrade gracefully.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let venueBoosts: any[] = []
    try {
      const snapshot = await fetchControlPlaneSnapshot()
      venueBoosts = snapshot.venueBoosts ?? []
    } catch {
      // Strapi unavailable — continue with no boosts applied
    }

    // Skip SF API entirely when no token is configured
    const rawVenues = SF_API_TOKEN ? await fetchSFVenues(sfQs) : []

    // No live API data — serve the Pattaya venue dataset.
    if (!rawVenues || rawVenues.length === 0) {
      const cards = getPattayaVenues()
      const sports = Array.from(new Set(cards.flatMap((c) => c.sports ?? [])))
      const facilities = Array.from(new Set(cards.flatMap((c) => c.facilities ?? [])))
      const payload: VenueDiscoveryResponse = {
        items: cards,
        filters: { sports, facilities },
        locationUsed: false,
      }
      const envelope: NormalizedEnvelope<VenueDiscoveryResponse> = makeSuccessEnvelope({
        data: payload,
        source: "strapi",
        fetchedAt,
        maxAgeSeconds: 60,
        confidence: "high",
      })
      return NextResponse.json(envelope)
    }

    const cards: VenueCard[] = rawVenues
      .map((raw) => {
        const venueId = String(raw.id ?? "")
        // Apply operator boost rules — additive to organic scoring via editorialBoost/sponsored flags.
        // sponsorDisclosure=true triggers disclosure pill rendering in the UI.
        const { boosted, sponsorDisclosure } = getVenueBoostScore(venueBoosts, venueId, {
          sport,
          competitionId,
          eventId,
        })
        const boostedRaw = boosted
          ? { ...raw, editorialBoost: true, sponsored: raw.sponsored || sponsorDisclosure }
          : raw
        return normaliseVenue(boostedRaw, { userLat, userLng, followedIds, eventId, competitionId, sport })
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
      maxAgeSeconds: 300, // venue discovery stales after 5 minutes
      confidence: cards.length > 0 ? "high" : "low",
    })

    return NextResponse.json(envelope)
  } catch (err) {
    console.error("[venues/discovery] unexpected error — serving fallback venues:", err)
    // Serve Pattaya venues even on unexpected errors so the page is never blank
    const cards = getPattayaVenues()
    const payload: VenueDiscoveryResponse = {
      items: cards,
      filters: {
        sports: Array.from(new Set(cards.flatMap((c) => c.sports ?? []))),
        facilities: Array.from(new Set(cards.flatMap((c) => c.facilities ?? []))),
      },
      locationUsed: false,
    }
    const envelope: NormalizedEnvelope<VenueDiscoveryResponse> = makeSuccessEnvelope({
      data: payload,
      source: "strapi",
      fetchedAt: new Date().toISOString(),
      maxAgeSeconds: 60,
      confidence: "high",
    })
    return NextResponse.json(envelope)
  }
}
