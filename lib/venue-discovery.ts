import type { VenueCard } from "@/types/venues"

// ── Scoring — canonical implementation lives in lib/venue-scoring.ts ──────────
// Re-exported here so existing importers of lib/venue-discovery do not break.

export type { VenueDiscoveryInput } from "@/lib/venue-scoring"
export { scoreVenueCard, VENUE_SCORE_WEIGHTS } from "@/lib/venue-scoring"
import { scoreVenueCard } from "@/lib/venue-scoring"

// ── Filtering ─────────────────────────────────────────────────────────────────

export type VenueType = "bar" | "pub" | "restaurant" | "cafe" | "club"
export type FoodOption = "food_served" | "kitchen_late" | "happy_hour"

export type VenueClientFilters = {
  maxDistanceKm?: number
  facilityKeys?: string[]
  offersOnly?: boolean
  followedOnly?: boolean
  venueTypes?: VenueType[]
  foodOptions?: FoodOption[]
  sports?: string[]
  searchQuery?: string
}

export const VENUE_TYPE_LABELS: Record<VenueType, string> = {
  bar: "Bar",
  pub: "Pub",
  restaurant: "Restaurant",
  cafe: "Cafe",
  club: "Club",
}

export const FOOD_OPTION_LABELS: Record<FoodOption, string> = {
  food_served: "Food Served",
  kitchen_late: "Kitchen Open Late",
  happy_hour: "Happy Hour",
}

export function filterVenueCards(
  items: VenueCard[],
  filters: VenueClientFilters,
): VenueCard[] {
  const q = filters.searchQuery?.toLowerCase().trim()

  return items.filter((item) => {
    // Text search — name, city, country, address
    if (q) {
      const haystack = [item.name, item.city, item.country, item.address]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }

    if (
      filters.maxDistanceKm != null &&
      item.distanceKm != null &&
      item.distanceKm > filters.maxDistanceKm
    ) {
      return false
    }

    if (filters.facilityKeys?.length) {
      const facilities = new Set(item.facilities ?? [])
      const ok = filters.facilityKeys.every((k) => facilities.has(k))
      if (!ok) return false
    }

    if (filters.offersOnly && !(item.offerCount && item.offerCount > 0)) {
      return false
    }

    if (
      filters.followedOnly &&
      !item.reasons?.includes("you_follow_this_venue")
    ) {
      return false
    }

    // Venue type filter — item.venueType must match one of the selected
    if (filters.venueTypes?.length) {
      const vt = (item as any).venueType as VenueType | undefined
      if (!vt || !filters.venueTypes.includes(vt)) return false
    }

    // Food options — mapped to facility keys
    if (filters.foodOptions?.length) {
      const facilities = new Set(item.facilities ?? [])
      const mapped: Record<FoodOption, string> = {
        food_served: "food",
        kitchen_late: "kitchen_late",
        happy_hour: "happy_hour",
      }
      const ok = filters.foodOptions.every((fo) => facilities.has(mapped[fo]))
      if (!ok) return false
    }

    // Sports filter
    if (filters.sports?.length) {
      const itemSports = (item.sports ?? []).map((s) => s.toLowerCase())
      const ok = filters.sports.some((s) => itemSports.includes(s.toLowerCase()))
      if (!ok) return false
    }

    return true
  })
}

// ── Haversine distance helper (used server-side in routes) ────────────────────

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Normalise a raw Strapi venue record into a VenueCard ─────────────────────

export function normaliseVenue(
  raw: any,
  opts: {
    userLat?: number
    userLng?: number
    followedIds?: Set<string>
    eventId?: string
    competitionId?: string
    sport?: string
  } = {},
): VenueCard {
  const id = String(raw.id ?? "")
  const lat: number | undefined =
    raw.latitude ?? raw.lat ?? undefined
  const lng: number | undefined =
    raw.longitude ?? raw.lng ?? undefined

  const distanceKm =
    opts.userLat != null &&
    opts.userLng != null &&
    lat != null &&
    lng != null
      ? haversineKm(opts.userLat, opts.userLng, lat, lng)
      : undefined

  const rawSports: string[] = Array.isArray(raw.sports)
    ? raw.sports
    : []
  const facilities: string[] = Array.isArray(raw.facilities)
    ? raw.facilities
    : []
  const showingEventIds: string[] = Array.isArray(raw.showingEventIds)
    ? raw.showingEventIds
    : []

  const phone = raw.phone || raw.strPhone || ""
  const whatsapp = raw.whatsapp || raw.strWhatsapp || ""
  const lineId = raw.lineId || raw.strLineId || ""
  const address = raw.address || raw.strAddress || ""
  const city = raw.city || raw.strCity || ""
  const country = raw.country || raw.strCountry || ""

  const mapQuery = encodeURIComponent(
    [raw.name, address, city, country].filter(Boolean).join(", "),
  )
  const mapUrl =
    lat && lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${mapQuery}`

  const offers: any[] = Array.isArray(raw.offers) ? raw.offers : []

  const { score, reasons } = scoreVenueCard({
    showsEvent:
      !!opts.eventId && showingEventIds.includes(opts.eventId),
    showsCompetition:
      !!opts.competitionId &&
      (raw.competitionIds ?? []).includes(opts.competitionId),
    showsSport:
      !!opts.sport &&
      rawSports.map((s) => s.toLowerCase()).includes(opts.sport.toLowerCase()),
    followedVenue: opts.followedIds ? opts.followedIds.has(id) : false,
    nearUser: distanceKm != null && distanceKm <= 5,
    hasLiveOffer: offers.length > 0,
    editorialBoost: !!raw.editorialBoost,
    sponsored: !!raw.sponsored,
  })

  return {
    id,
    name: raw.name || raw.strVenue || "Venue",
    slug: raw.slug,
    address: address || undefined,
    city: city || undefined,
    country: country || undefined,
    distanceKm,
    screenCount: raw.screenCount ?? 0,
    capacity: raw.capacity ?? 0,
    rating: raw.rating ?? 0,
    facilities,
    sports: rawSports,
    offers: offers.map((o: any) => ({
      id: String(o.id ?? Math.random()),
      title: o.title ?? "",
      description: o.description,
      validUntil: o.validUntil,
      sponsored: !!o.sponsored,
    })),
    offerCount: offers.length,
    showingNow: !!raw.showingNow,
    showingEventIds,
    reasons,
    sponsored: !!raw.sponsored,
    score,
    mapUrl,
    phoneHref: phone ? `tel:${phone}` : undefined,
    whatsappHref: whatsapp
      ? `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`
      : undefined,
    lineHref: lineId
      ? `https://line.me/ti/p/~${lineId}`
      : undefined,
    reserveUrl: raw.reserveUrl || raw.strReserveUrl || undefined,
    website: raw.website || raw.strWebsite || undefined,
    menuUrl: raw.menuUrl || raw.strMenuUrl || undefined,
    bookNowUrl: raw.bookNowUrl || undefined,
    latitude: lat,
    longitude: lng,
  }
}
