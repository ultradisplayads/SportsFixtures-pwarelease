"use client"

// components/venues/venue-card.tsx
// Section 04.E — Reusable venue card for list, discovery, and event surfaces.
//
// Supports two densities:
//   full (default) — full card with offers, actions, reason badges
//   compact        — single-row summary used in home module and inline lists
//
// The card links to /venues/[slug] when a slug is available, falling back
// to /venues/[id]. It never navigates when href=null (embedded contexts).

import Link from "next/link"
import { MapPin, Tv, Users, Star, ChevronRight } from "lucide-react"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { VenueReasonBadges } from "@/components/venues/venue-reason-badges"
import { VenueOffersStrip } from "@/components/venues/venue-offers-strip"
import { VenueActionButtons } from "@/components/venues/venue-action-buttons"
import type { VenueCard as VenueCardData } from "@/types/venues"

interface Props {
  venue: VenueCardData
  density?: "full" | "compact"
  /** Override the href; pass null to disable navigation entirely. */
  href?: string | null
  /** When true the card renders as an article (landmark). Default: true. */
  asArticle?: boolean
}

function venueHref(venue: VenueCardData): string {
  return `/venues/${venue.slug ?? venue.id}`
}

// ── Compact row ───────────────────────────────────────────────────────────────

function CompactCard({ venue, href }: { venue: VenueCardData; href: string | null }) {
  const dest = href === null ? null : href ?? venueHref(venue)
  const inner = (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2.5 hover:bg-accent">
      <div className="flex min-w-0 items-center gap-2">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
        <span className="truncate text-sm font-medium">{venue.name}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
        {venue.distanceKm != null && <span>{venue.distanceKm.toFixed(1)} km</span>}
        {(venue.screenCount ?? 0) > 0 && <span>{venue.screenCount} screens</span>}
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
    </div>
  )

  if (dest) {
    return (
      <Link href={dest} onClick={() => triggerHaptic("light")}>
        {inner}
      </Link>
    )
  }
  return <div>{inner}</div>
}

// ── Full card ─────────────────────────────────────────────────────────────────

function FullCard({ venue, href, asArticle }: { venue: VenueCardData; href: string | null; asArticle: boolean }) {
  const dest = href === null ? null : href ?? venueHref(venue)
  const Wrapper = asArticle ? "article" : "div"

  return (
    <Wrapper className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent/40">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {dest ? (
            <Link
              href={dest}
              onClick={() => triggerHaptic("light")}
              className="text-sm font-semibold hover:text-primary"
            >
              {venue.name}
            </Link>
          ) : (
            <span className="text-sm font-semibold">{venue.name}</span>
          )}
          {(venue.address || venue.city) && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {[venue.address, venue.city].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        {typeof venue.rating === "number" && venue.rating > 0 && (
          <div className="flex shrink-0 items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
            <span className="text-sm font-semibold">{venue.rating}</span>
          </div>
        )}
      </div>

      {/* Reason badges */}
      {(venue.reasons?.length ?? 0) > 0 && (
        <div className="mt-2">
          <VenueReasonBadges reasons={venue.reasons!} max={3} />
        </div>
      )}

      {/* Stats row */}
      <div className="mt-2 flex flex-wrap gap-2">
        {venue.distanceKm != null && (
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {venue.distanceKm.toFixed(1)} km
          </span>
        )}
        {(venue.screenCount ?? 0) > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs">
            <Tv className="h-3 w-3" aria-hidden="true" />
            {venue.screenCount} screens
          </span>
        )}
        {(venue.capacity ?? 0) > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs">
            <Users className="h-3 w-3" aria-hidden="true" />
            {venue.capacity} cap
          </span>
        )}
        {(venue.offerCount ?? 0) > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
            {venue.offerCount} offer{venue.offerCount! > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Sports tags */}
      {Array.isArray(venue.sports) && venue.sports.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {venue.sports.map((s) => (
            <span key={s} className="rounded-md bg-accent px-2 py-0.5 text-xs text-muted-foreground">
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Offers */}
      {(venue.offers?.length ?? 0) > 0 && (
        <div className="mt-3">
          <VenueOffersStrip offers={venue.offers!} />
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-3">
        <VenueActionButtons venue={venue} />
      </div>
    </Wrapper>
  )
}

// ── Public component ──────────────────────────────────────────────────────────

export function VenueCard({
  venue,
  density = "full",
  href,
  asArticle = true,
}: Props) {
  if (density === "compact") {
    return <CompactCard venue={venue} href={href !== undefined ? href : venueHref(venue)} />
  }
  return (
    <FullCard
      venue={venue}
      href={href !== undefined ? href : venueHref(venue)}
      asArticle={asArticle}
    />
  )
}
