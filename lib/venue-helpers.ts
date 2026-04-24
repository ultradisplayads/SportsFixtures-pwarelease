import type { VenueCard } from "@/types/venues"

const VENUE_TYPE_LABEL: Record<string, string> = {
  sports_bar:       "Sports Bar",
  bar:              "Bar",
  pub:              "Pub",
  restaurant:       "Restaurant",
  cafe:             "Cafe",
  club:             "Club",
  rooftop_bar:      "Rooftop Bar",
  bistro:           "Bistro",
  fine_dining:      "Fine Dining",
  hotel_restaurant: "Hotel Restaurant",
}

/** Canonical display name — never empty. */
export function venueName(venue: VenueCard): string {
  return venue.name?.trim() || "Venue"
}

/** Meta description built from structured fields; undefined when nothing available. */
export function venueDescription(venue: VenueCard): string | undefined {
  const desc = venue.description?.trim()
  if (desc) return desc
  const name = venueName(venue)
  const city = venue.city?.trim()
  return `${name} is a sports bar${city ? ` in ${city}` : ""}. View fixtures, TV channels, opening hours, and how to get there on SportsFixtures.`
}

/** Related entity links for SEO blocks. */
export function buildRelatedLinks(
  venue: VenueCard,
  id: string,
): Array<{ href: string; label: string }> {
  const city = venue.city?.trim()
  const links: Array<{ href: string; label: string }> = [
    { href: "/venues", label: city ? `All sports venues in ${city}` : "All sports venues" },
    { href: "/fixtures", label: "Upcoming sports fixtures" },
    { href: "/tv", label: "Sports TV guide" },
  ]
  if (venue.sports?.length) {
    const sport = venue.sports[0]
    links.push({ href: `/fixtures?sport=${encodeURIComponent(sport)}`, label: `${sport} fixtures` })
  }
  return links
}

/** Maps VenueCard fields into label/value pairs for PageFactBlock. */
export function mapVenueFacts(
  venue: VenueCard,
): Array<{ label: string; value: string | null }> {
  const address = [venue.address, venue.area, venue.city].filter(Boolean).join(", ")
  return [
    { label: "Type",          value: VENUE_TYPE_LABEL[venue.venueType ?? ""] ?? venue.venueType ?? null },
    { label: "Location",      value: address || null },
    { label: "City",          value: venue.city ?? null },
    { label: "Country",       value: venue.country ?? null },
    { label: "Screens",       value: venue.screenCount ? `${venue.screenCount} screens` : null },
    { label: "Price",         value: venue.priceBand ?? null },
    { label: "Opening hours", value: venue.openingHours ?? null },
  ]
}
