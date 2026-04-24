// lib/venue-actions.ts
// Section 04.D — Resolves the ordered list of available action buttons for a
// venue, given its data shape. Keeps the action-resolution logic out of the UI.
//
// Rule: never render an action button whose href is null/undefined.
// Rule: "directions" is always first when present; "book_now" is always second.

import type { VenueActionType, VenueCard } from "@/types/venues"

export type ResolvedVenueAction = {
  type: VenueActionType
  label: string
  href: string
  /** When true the button should be rendered as a full-width primary CTA. */
  primary?: boolean
}

/**
 * Returns the ordered list of actions available for a venue.
 * Actions with no href are silently excluded.
 */
export function resolveVenueActions(
  venue: Pick<
    VenueCard,
    | "mapUrl"
    | "phoneHref"
    | "whatsappHref"
    | "lineHref"
    | "reserveUrl"
    | "website"
    | "menuUrl"
    | "bookNowUrl"
  >,
): ResolvedVenueAction[] {
  const actions: ResolvedVenueAction[] = []

  if (venue.mapUrl)
    actions.push({ type: "directions", label: "Directions", href: venue.mapUrl, primary: true })
  if (venue.bookNowUrl)
    actions.push({ type: "book_now", label: "Book Now", href: venue.bookNowUrl, primary: true })
  if (venue.reserveUrl)
    actions.push({ type: "reserve", label: "Reserve", href: venue.reserveUrl })
  if (venue.phoneHref)
    actions.push({ type: "call", label: "Call", href: venue.phoneHref })
  if (venue.whatsappHref)
    actions.push({ type: "whatsapp", label: "WhatsApp", href: venue.whatsappHref })
  if (venue.lineHref)
    actions.push({ type: "line", label: "LINE", href: venue.lineHref })
  if (venue.menuUrl)
    actions.push({ type: "menu", label: "Menu", href: venue.menuUrl })
  if (venue.website)
    actions.push({ type: "website", label: "Website", href: venue.website })

  return actions
}

/**
 * Returns only the primary (CTA-weight) actions for compact surfaces
 * like the home module or inline card rows. Maximum of 2.
 */
export function resolvePrimaryVenueActions(
  venue: Parameters<typeof resolveVenueActions>[0],
): ResolvedVenueAction[] {
  return resolveVenueActions(venue)
    .filter((a) => a.primary)
    .slice(0, 2)
}
