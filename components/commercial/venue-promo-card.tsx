// Venue-driven promotional card — used when a venue has paid for campaign placement.
// Must always disclose its sponsored state. Never disguised as an organic recommendation.

import Link from "next/link"
import { MapPin } from "lucide-react"
import type { CommercialCard as CommercialCardType } from "@/types/monetization"
import { DisclosurePill } from "@/components/commercial/disclosure-pill"

interface VenuePromoCardProps {
  item: CommercialCardType
  className?: string
}

export function VenuePromoCard({ item, className = "" }: VenuePromoCardProps) {
  if (item.type !== "venue_promo") return null
  if (!item.title) return null

  const disclosure = item.disclosure ?? "sponsored"

  return (
    <article
      className={`rounded-xl border border-border bg-card px-4 py-3 ${className}`}
      aria-label={`${item.title} — venue promotion`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold leading-tight">{item.title}</p>
            <DisclosurePill disclosure={disclosure} />
          </div>
          {item.body && (
            <p className="mt-0.5 text-xs text-muted-foreground">{item.body}</p>
          )}
        </div>
      </div>

      {item.href && (
        <Link
          href={item.venueId ? `/venues/${item.venueId}` : item.href}
          className="mt-2.5 inline-flex items-center text-xs text-primary hover:underline"
        >
          View venue
        </Link>
      )}
    </article>
  )
}
