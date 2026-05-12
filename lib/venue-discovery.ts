import type { VenueCard } from "@/types/venues"
import { computeCrowdScore } from "@/lib/crowd-score"

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
  foodOnly?: boolean
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
      const haystack = [
        item.name,
        item.city,
        item.area,
        item.country,
        item.address,
        item.description,
        item.venueType,
        item.openingHours,
        item.happyHour,
        item.kitchenHours,
        item.menuUrl,
        ...(item.sports ?? []),
        ...(item.teams ?? []),
        ...(item.competitions ?? []),
        ...(item.events ?? []),
        ...(item.cuisine ?? []),
        ...(item.facilities ?? []),
        ...(item.offers ?? []).flatMap((offer) => [offer.title, offer.description]),
      ]
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

    if (filters.foodOnly && !venueHasFood(item)) {
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

export function venueHasFood(item: VenueCard): boolean {
  const facilities = new Set((item.facilities ?? []).map((f) => f.toLowerCase()))
  const venueType = item.venueType?.toLowerCase()
  return Boolean(
    venueType === "restaurant" ||
      venueType === "cafe" ||
      venueType === "bistro" ||
      venueType === "fine_dining" ||
      venueType === "hotel_restaurant" ||
      (item.cuisine?.length ?? 0) > 0 ||
      item.menuUrl ||
      item.kitchenHours ||
      facilities.has("food") ||
      facilities.has("food_served") ||
      facilities.has("restaurant") ||
      facilities.has("kitchen") ||
      facilities.has("kitchen_late") ||
      facilities.has("dining"),
  )
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

function collectNames(raw: Record<string, any>, keys: string[]): string[] {
  const values: string[] = []

  for (const key of keys) {
    const value = raw[key]
    if (!value) continue

    if (typeof value === "string") {
      values.push(...value.split(/[;,|]/).map((part) => part.trim()).filter(Boolean))
      continue
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === "string") values.push(entry)
        else if (entry && typeof entry === "object") {
          const name =
            entry.name ??
            entry.title ??
            entry.strTeam ??
            entry.strEvent ??
            entry.strLeague ??
            entry.strCompetition
          if (name) values.push(String(name))
        }
      }
      continue
    }

    if (typeof value === "object") {
      const name =
        value.name ??
        value.title ??
        value.strTeam ??
        value.strEvent ??
        value.strLeague ??
        value.strCompetition
      if (name) values.push(String(name))
    }
  }

  return Array.from(new Set(values.map((name) => name.trim()).filter(Boolean)))
}

export function normaliseVenue(
  raw: any,
  opts: {
    userLat?: number
    userLng?: number
    followedIds?: Set<string>
    eventId?: string
    competitionId?: string
    sport?: string
    eventStartAt?: string
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
  const teams = collectNames(raw, [
    "teams",
    "teamNames",
    "team_names",
    "showingTeams",
    "showing_teams",
    "homeTeam",
    "awayTeam",
  ])
  const competitions = collectNames(raw, [
    "competitions",
    "competitionNames",
    "competition_names",
    "leagues",
    "leagueNames",
    "league_names",
    "showingCompetitions",
    "showing_competitions",
  ])
  const events = collectNames(raw, [
    "events",
    "eventNames",
    "event_names",
    "fixtures",
    "fixtureNames",
    "fixture_names",
    "showingEvents",
    "showing_events",
  ])
  const facilities: string[] = Array.isArray(raw.facilities)
    ? raw.facilities
    : []
  const showingEventIds: string[] = Array.isArray(raw.showingEventIds)
    ? raw.showingEventIds
    : Array.isArray(raw.showing_event_ids)
    ? raw.showing_event_ids
    : []
  const competitionIds: string[] = Array.isArray(raw.competitionIds)
    ? raw.competitionIds.map(String)
    : Array.isArray(raw.competition_ids)
    ? raw.competition_ids.map(String)
    : []
  const followedTeamIds: string[] = Array.isArray(raw.followedTeamIds)
    ? raw.followedTeamIds.map(String)
    : Array.isArray(raw.teamIds)
    ? raw.teamIds.map(String)
    : Array.isArray(raw.team_ids)
    ? raw.team_ids.map(String)
    : []

  const phone = raw.phone || raw.strPhone || ""
  const whatsapp = raw.whatsapp || raw.strWhatsapp || ""
  const lineId = raw.lineId || raw.strLineId || ""
  const address = raw.address || raw.strAddress || ""
  const city = raw.city || raw.strCity || ""
  const area = raw.area || raw.strArea || raw.neighbourhood || raw.neighborhood || ""
  const country = raw.country || raw.strCountry || ""
  const cuisine = collectNames(raw, ["cuisine", "cuisineTags", "cuisine_tags", "foodTypes", "food_types"])

  const mapQuery = encodeURIComponent(
    [raw.name, address, city, country].filter(Boolean).join(", "),
  )
  const mapUrl =
    lat && lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${mapQuery}`

  const offers: any[] = Array.isArray(raw.offers)
    ? raw.offers
    : Array.isArray(raw.liveOffers)
    ? raw.liveOffers
    : []
  const screenCount = Number(raw.screenCount ?? raw.screen_count ?? raw.screens ?? 0)
  const openNow = Boolean(raw.openNow ?? raw.isOpenNow ?? raw.open_now)
  const checkedInCount = Number(raw.checkedInCount ?? raw.checkins ?? raw.check_in_count ?? 0)
  const watchingHereCount = Number(raw.watchingHereCount ?? raw.watchers ?? raw.watching_here_count ?? 0)
  const crowd = computeCrowdScore({
    checkins: checkedInCount,
    watchers: watchingHereCount,
    capacity: raw.capacity ?? null,
  })
  const eventStart = opts.eventStartAt ? new Date(opts.eventStartAt) : null
  const now = new Date()
  const startsSoon =
    eventStart != null &&
    Number.isFinite(eventStart.getTime()) &&
    eventStart.getTime() >= now.getTime() - 2 * 60 * 60 * 1000 &&
    eventStart.getTime() <= now.getTime() + 8 * 60 * 60 * 1000

  const { score, reasons } = scoreVenueCard({
    showsEvent:
      !!opts.eventId && showingEventIds.includes(opts.eventId),
    showsCompetition:
      !!opts.competitionId &&
      competitionIds.includes(opts.competitionId),
    showsSport:
      !!opts.sport &&
      rawSports.map((s) => s.toLowerCase()).includes(opts.sport.toLowerCase()),
    followedVenue: opts.followedIds
      ? opts.followedIds.has(id) || followedTeamIds.some((teamId) => opts.followedIds?.has(teamId))
      : false,
    nearUser: distanceKm != null && distanceKm <= 5,
    hasLiveOffer: offers.length > 0,
    openNow,
    hasScreens: screenCount > 0,
    matchTimeFit: startsSoon && (!!opts.eventId && showingEventIds.includes(opts.eventId)),
    crowdInterest: crowd.score >= 20,
    editorialBoost: !!raw.editorialBoost,
    sponsored: !!raw.sponsored,
  })

  return {
    id,
    name: raw.name || raw.strVenue || "Venue",
    slug: raw.slug,
    address: address || undefined,
    city: city || undefined,
    area: area || undefined,
    country: country || undefined,
    distanceKm,
    screenCount,
    capacity: raw.capacity ?? 0,
    rating: raw.rating ?? 0,
    description: raw.description || raw.strDescription || raw.summary || undefined,
    venueType: raw.venueType || raw.venue_type || raw.primaryCategory || raw.primary_category || undefined,
    priceBand: raw.priceBand || raw.price_band || undefined,
    cuisine,
    openingHours: raw.openingHours || raw.opening_hours || undefined,
    happyHour: raw.happyHour || raw.happy_hour || undefined,
    kitchenHours: raw.kitchenHours || raw.kitchen_hours || undefined,
    facilities,
    sports: rawSports,
    teams,
    competitions,
    events,
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
    openNow,
    checkedInCount,
    watchingHereCount,
    crowdScore: crowd.score,
    crowdLabel: crowd.label,
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
