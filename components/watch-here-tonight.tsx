"use client"

// components/watch-here-tonight.tsx
// Fetches /api/nearby/venues → NearbyEventResponse contract.
// Renders CheckinButton, WatchingHereChip, CrowdLevelChip per venue row.
// MUST NOT return null except on explicit user dismissal.

import { useState, useEffect } from "react"
import { Tv, MapPin, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useLocation } from "@/components/location-provider"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { deriveCrowdLevel } from "@/lib/crowd-score"
import { CheckinButton } from "@/components/venues/checkin-button"
import { WatchingHereChip } from "@/components/venues/watching-here-chip"
import { CrowdLevelChip } from "@/components/venues/crowd-level-chip"
import { NearbyEventEmptyState } from "@/components/venues/nearby-event-empty-state"
import { NearbyEventErrorState } from "@/components/venues/nearby-event-error-state"
import type { NearbyEventResponse, NearbyVenueCard } from "@/types/nearby-event"

function LoadingSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading nearby venues">
      {[1, 2].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-primary/10" />
      ))}
    </div>
  )
}

export function WatchHereTonight({
  eventId,
  sport,
  competitionId,
}: {
  eventId?: string
  sport?: string
  competitionId?: string
} = {}) {
  const { location } = useLocation()
  const [data, setData] = useState<NearbyEventResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [fetchKey, setFetchKey] = useState(0)

  // Timezone change: re-fetch without unmounting
  useEffect(() => {
    function onTimezoneChange() { setFetchKey((k) => k + 1) }
    window.addEventListener("sf:timezone-change", onTimezoneChange as EventListener)
    return () => window.removeEventListener("sf:timezone-change", onTimezoneChange as EventListener)
  }, [])

  useEffect(() => {
    if (dismissed) return
    let cancelled = false

    async function run() {
      setIsLoading(true)
      setError(null)
      try {
        const qs = new URLSearchParams()
        const lat = location ? Number((location as { latitude: unknown }).latitude) : NaN
        const lng = location ? Number((location as { longitude: unknown }).longitude) : NaN
        if (isFinite(lat)) qs.set("lat", String(lat))
        if (isFinite(lng)) qs.set("lng", String(lng))
        if (eventId) qs.set("eventId", eventId)
        if (sport) qs.set("sport", sport)
        if (competitionId) qs.set("competitionId", competitionId)
        qs.set("radiusKm", "15")

        const res = await fetch(`/api/nearby/venues?${qs.toString()}`, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load nearby venues")
        const json: NearbyEventResponse = await res.json()
        if (!cancelled) setData(json)
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [location, dismissed, fetchKey, eventId, sport, competitionId])

  if (dismissed) return null

  return (
    <div className="mx-3 mb-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Tv className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="text-sm font-bold">Watch Here Tonight</span>
        </div>
        <button
          onClick={() => { triggerHaptic("light"); setDismissed(true) }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Dismiss
        </button>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : error || !data ? (
        <NearbyEventErrorState />
      ) : data.items.length === 0 ? (
        <NearbyEventEmptyState />
      ) : (
        <div className="space-y-2">
          {data.items.map((venue: NearbyVenueCard) => {
            const crowdLevel = deriveCrowdLevel({
              checkedInCount: venue.checkedInCount,
              watchingHereCount: venue.watchingHereCount,
              showingNow: venue.showingNow,
              operatorMarkedBusy: venue.operatorMarkedBusy,
            })
            return (
              <article key={venue.id} className="rounded-lg bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="truncate text-sm font-medium">{venue.name}</span>
                  </div>
                  {venue.distanceKm != null && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {venue.distanceKm.toFixed(1)} km
                      <ChevronRight className="ml-0.5 inline h-3 w-3" aria-hidden="true" />
                    </span>
                  )}
                </div>

                {(venue.reasons?.length ?? 0) > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">{venue.reasons!.join(" · ")}</p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <WatchingHereChip active={Boolean(venue.userWatchingHere)} count={venue.watchingHereCount} />
                  <CrowdLevelChip level={crowdLevel} />
                </div>

                <div className="mt-2">
                  <CheckinButton
                    venueId={venue.id}
                    eventId={eventId}
                    active={Boolean(venue.userCheckedIn)}
                  />
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Link
        href="/venues"
        className="mt-2 block text-center text-xs text-primary hover:underline"
      >
        See all nearby venues
      </Link>
    </div>
  )
}
