"use client"

import { ExternalLink, MapPin, Phone, MessageCircle, CalendarCheck, Globe, UtensilsCrossed } from "lucide-react"
import { triggerHaptic } from "@/lib/haptic-feedback"
import type { VenueActionType, VenueCard } from "@/types/venues"
import { ExternalLinkGuard } from "@/components/platform/external-link-guard"

const ACTION_ICONS: Record<VenueActionType, React.ReactNode> = {
  directions: <MapPin className="h-4 w-4" />,
  call: <Phone className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4 text-green-500" />,
  line: <ExternalLink className="h-4 w-4 text-green-600" />,
  reserve: <CalendarCheck className="h-4 w-4" />,
  website: <Globe className="h-4 w-4" />,
  menu: <UtensilsCrossed className="h-4 w-4" />,
  book_now: <CalendarCheck className="h-4 w-4 text-primary" />,
}

type ActionDef = { type: VenueActionType; label: string; href: string; primary?: boolean }

interface Props {
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
  >
  /** When true, renders the directions button as a full-width primary CTA */
  prominentDirections?: boolean
}

export function VenueActionButtons({ venue, prominentDirections = false }: Props) {
  const actions: ActionDef[] = []

  if (venue.mapUrl)
    actions.push({ type: "directions", label: "Directions", href: venue.mapUrl, primary: true })
  if (venue.phoneHref)
    actions.push({ type: "call", label: "Call", href: venue.phoneHref })
  if (venue.whatsappHref)
    actions.push({ type: "whatsapp", label: "WhatsApp", href: venue.whatsappHref })
  if (venue.lineHref)
    actions.push({ type: "line", label: "LINE", href: venue.lineHref })
  if (venue.bookNowUrl)
    actions.push({ type: "book_now", label: "Book Now", href: venue.bookNowUrl, primary: true })
  if (venue.reserveUrl)
    actions.push({ type: "reserve", label: "Reserve", href: venue.reserveUrl })
  if (venue.menuUrl)
    actions.push({ type: "menu", label: "Menu", href: venue.menuUrl })
  if (venue.website)
    actions.push({ type: "website", label: "Website", href: venue.website })

  if (!actions.length) return null

  const directionsAction = actions.find((a) => a.type === "directions")
  const rest = actions.filter((a) => a.type !== "directions")

  return (
    <div className="space-y-2">
      {/* Prominent directions CTA */}
      {prominentDirections && directionsAction && (
        <ExternalLinkGuard
          href={directionsAction.href}
          onClick={() => triggerHaptic("light")}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <MapPin className="h-4 w-4" />
          Get Directions
        </ExternalLinkGuard>
      )}

      {/* Secondary action grid */}
      <div className="flex flex-wrap gap-2">
        {(prominentDirections ? rest : actions).map((action) => (
          <ExternalLinkGuard
            key={action.type}
            href={action.href}
            onClick={() => triggerHaptic("light")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-accent"
          >
            {ACTION_ICONS[action.type]}
            {action.label}
          </ExternalLinkGuard>
        ))}
      </div>
    </div>
  )
}
