"use client"

import Link from "next/link"
import { MapPin, ChevronRight } from "lucide-react"
import { useVenueDiscovery } from "@/hooks/use-venue-discovery"
import { VenueReasonBadges } from "@/components/venues/venue-reason-badges"
import { VenueActionButtons } from "@/components/venues/venue-action-buttons"
import { VenueOffersStrip } from "@/components/venues/venue-offers-strip"
import { VenueEmptyState } from "@/components/venues/venue-empty-state"
import { Skeleton } from "@/components/ui/skeleton"

interface Props {
  eventId: string
  sport?: string
  competitionId?: string
  lat?: number
  lng?: number
}

export function FindPlacesToWatch({ eventId, sport, competitionId, lat, lng }: Props) {
  const { items, isLoading, error } = useVenueDiscovery({
    eventId,
    sport,
    competitionId,
    lat,
    lng,
  })

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">
          Could not load places to watch. Please try again later.
        </p>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="p-4">
        <VenueEmptyState mode="event" />
      </div>
    )
  }

  // Show top 5 — users can tap "See all" for the full list
  const visible = items.slice(0, 5)

  return (
    <div className="p-4 space-y-3">
      {visible.map((venue) => (
        <article
          key={venue.id}
          className="rounded-2xl border border-border bg-card p-4 space-y-2"
        >
          {/* Venue name + link */}
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/venues/${venue.id}`}
              className="flex-1 text-sm font-semibold hover:text-primary"
            >
              {venue.name}
            </Link>
            {venue.distanceKm != null && (
              <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {venue.distanceKm.toFixed(1)} km
              </div>
            )}
          </div>

          {/* City / area */}
          {(venue.city || venue.area) && (
            <p className="text-xs text-muted-foreground">
              {[venue.area, venue.city].filter(Boolean).join(", ")}
            </p>
          )}

          {/* Why this venue is shown */}
          <VenueReasonBadges reasons={venue.reasons ?? []} />

          {/* Offers */}
          <VenueOffersStrip offers={venue.offers ?? []} />

          {/* Actions */}
          <VenueActionButtons venue={venue} />
        </article>
      ))}

      {items.length > 5 && (
        <Link
          href="/venues"
          className="flex items-center justify-center gap-1 py-2 text-sm text-primary hover:underline"
        >
          See all {items.length} venues
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}
