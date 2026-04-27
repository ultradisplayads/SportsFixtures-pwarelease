/**
 * lib/venues-pattaya.ts
 *
 * Watch venue data fetched from Strapi BE.
 * No hardcoded data — all venues come from the watch_venues table.
 */

import type { VenueCard, VenueType } from "@/types/venues"

export function splitTags(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw.split(";").map((s) => s.trim()).filter(Boolean)
}

export function buildFacilities(row: {
  outdoor_seating?: string | boolean
  reservable?: string | boolean
  family_friendly?: string | boolean
  live_music?: string | boolean
  cuisine_tags?: string
  commentary_available?: string | boolean
  projector_present?: string | boolean
  food?: string | boolean
}): string[] {
  const f: string[] = []
  const isYes = (v: any) => v === "yes" || v === true
  if (isYes(row.outdoor_seating)) f.push("outdoor_seating")
  if (isYes(row.reservable)) f.push("reservable")
  if (isYes(row.family_friendly)) f.push("family_friendly")
  if (isYes(row.live_music)) f.push("live_music")
  if (isYes(row.commentary_available)) f.push("commentary")
  if (isYes(row.projector_present)) f.push("projector")
  if (isYes(row.food)) f.push("food")
  splitTags(row.cuisine_tags).forEach((t) => f.push(`cuisine:${t}`))
  return f
}

export function mapVenueType(primary: string): VenueType | undefined {
  const p = primary.toLowerCase()
  if (p.includes("sports_bar") || p.includes("sports bar")) return "sports_bar"
  if (p.includes("rooftop")) return "rooftop_bar"
  if (p.includes("fine dining")) return "fine_dining"
  if (p.includes("bistro") || p.includes("lounge")) return "bistro"
  if (p.includes("cafe")) return "cafe"
  if (p.includes("restaurant")) return "restaurant"
  if (p.includes("club")) return "club"
  if (p.includes("pub")) return "pub"
  if (p.includes("bar")) return "bar"
  return "bar"
}

function getDefaultPhoto(category: string | null | undefined): string {
  const c = (category ?? "").toLowerCase()
  if (c.includes("sports_bar")) return "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80"
  if (c.includes("rooftop")) return "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800&q=80"
  if (c.includes("pub")) return "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80"
  if (c.includes("bar")) return "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&q=80"
  if (c.includes("cafe")) return "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80"
  if (c.includes("fine_dining")) return "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80"
  if (c.includes("restaurant")) return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
  return "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80"
}

function normaliseWatchVenue(v: any): VenueCard {
  return {
    id: String(v.id),
    name: v.name,
    slug: v.slug,
    address: v.address || undefined,
    area: v.area || undefined,
    city: v.city || undefined,
    country: v.country || undefined,
    latitude: v.latitude || undefined,
    longitude: v.longitude || undefined,
    photoUrl: v.photoUrl || v.photo_url || getDefaultPhoto(v.primaryCategory || v.primary_category),
    phoneHref: v.phone ? `tel:${v.phone.replace(/\s+/g, "")}` : undefined,
    whatsappHref: v.whatsapp || undefined,
    lineHref: v.lineUrl || v.line_url || undefined,
    website: v.website || undefined,
    menuUrl: v.menuUrl || v.menu_url || undefined,
    bookNowUrl: v.bookingUrl || v.booking_url || undefined,
    facebookUrl: v.facebookUrl || v.facebook_url || undefined,
    instagramUrl: v.instagramUrl || v.instagram_url || undefined,
    tripadvisorRating: v.tripadvisorRating || v.tripadvisor_rating || undefined,
    tripadvisorReviewCount: v.tripadvisorReviewCount || v.tripadvisor_review_count || undefined,
    tripadvisorUrl: v.tripadvisorUrl || v.tripadvisor_url || undefined,
    googleRating: v.googleRating || v.google_rating || undefined,
    googleReviewCount: v.googleReviewCount || v.google_review_count || undefined,
    priceBand: v.priceBand || v.price_band || undefined,
    openingHours: v.openingHours || v.opening_hours || undefined,
    happyHour: v.happyHour || v.happy_hour || undefined,
    kitchenHours: v.kitchenHours || v.kitchen_hours || undefined,
    venueType: mapVenueType(v.primaryCategory || v.primary_category || ""),
    sports: v.sportsSupported || v.sports_supported
      ? (v.sportsSupported || v.sports_supported).split(";").map((s: string) => s.trim()).filter(Boolean)
      : [],
    facilities: buildFacilities({
      outdoor_seating: v.outdoorSeating || v.outdoor_seating,
      reservable: v.reservable,
      family_friendly: v.familyFriendly || v.family_friendly,
      live_music: v.liveMusic || v.live_music,
      commentary_available: v.commentaryAvailable || v.commentary_available,
      projector_present: v.projectorPresent || v.projector_present,
      cuisine_tags: v.cuisineTags || v.cuisine_tags,
    }),
    showingNow: (v.sportsBarSignal || v.sports_bar_signal) === "Strong",
    sponsored: v.sponsored || false,
    score: 0,
    reasons: [],
    offers: [],
    offerCount: 0,
    showingEventIds: [],
    mapUrl: v.googleMapsUrl || v.google_maps_url || undefined,
  }
}

export async function getPattayaVenues(): Promise<VenueCard[]> {
  try {
    const baseUrl = process.env.SF_API_URL || "http://localhost:1337"
    const token = process.env.SF_API_TOKEN || ""
    const res = await fetch(
      `${baseUrl}/api/watch-venues?filters[isActive][$eq]=true&pagination[pageSize]=100`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      }
    )
    if (!res.ok) return []
    const json = await res.json()
    return (json.data || json || []).map((v: any) => normaliseWatchVenue(v))
  } catch {
    return []
  }
}

export async function getVenueBySlug(slugOrId: string): Promise<VenueCard | undefined> {
  try {
    const baseUrl = process.env.SF_API_URL || "http://localhost:1337"
    const token = process.env.SF_API_TOKEN || ""
    const res = await fetch(
      `${baseUrl}/api/watch-venues/slug/${slugOrId}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      }
    )
    if (!res.ok) return undefined
    const json = await res.json()
    const v = json.data || json
    return v ? normaliseWatchVenue(v) : undefined
  } catch {
    return undefined
  }
}

// Legacy aliases
export const getDemoVenuesPattaya = getPattayaVenues
export const getDemoVenues = getPattayaVenues
export const getDemoVenueBySlug = getVenueBySlug
