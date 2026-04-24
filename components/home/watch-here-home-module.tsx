"use client"

// components/home/watch-here-home-module.tsx
// Section 04.A — Shell-wrapped home module variant of venue discovery.
//
// Differences from WatchHereTonight (the standalone widget):
//   - No own header / dismiss button — those belong to HomeModuleShell.
//   - No outer mx-3 / border — the shell owns the container.
//   - Uses useUserLocation() for a typed, narrowed coord shape.
//   - Uses VenueCard (compact) / VenueLoadingState / VenueErrorState.
//
// Rule (04.A): this component MUST NOT return null.
// Dismissal is the sole responsibility of HomeModuleShell / the module manager.
// All other states (no location, loading, error, empty) must render a visible
// placeholder so the shell always has something to show.

import { useState, useEffect } from "react"
import Link from "next/link"
import { useUserLocation } from "@/hooks/use-user-location"
import { VenueCard } from "@/components/venues/venue-card"
import { VenueLoadingState } from "@/components/venues/venue-loading-state"
import { VenueErrorState } from "@/components/venues/venue-error-state"
import { VenueEmptyState } from "@/components/venues/venue-empty-state"
import { getCachedFavourites } from "@/lib/favourites-api"
import type { VenueCard as VenueCardData } from "@/types/venues"
import { LocateOff } from "lucide-react"

// ── No-location placeholder ───────────────────────────────────────────────────

function NoLocationPlaceholder({ onRequest, isRequesting }: { onRequest: () => void; isRequesting: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-card px-3 py-3">
      <LocateOff className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Location not available</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Enable location to find nearby venues showing sport.
        </p>
      </div>
      <button
        onClick={onRequest}
        disabled={isRequesting}
        className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isRequesting ? "Locating…" : "Enable"}
      </button>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function WatchHereHomeModule() {
  const { lat, lng, permissionState, isLoading: locationLoading, requestLocation } = useUserLocation()

  const [venues, setVenues] = useState<VenueCardData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [fetchKey, setFetchKey] = useState(0)

  // Listen for timezone-change events — re-trigger fetch without unmounting.
  useEffect(() => {
    function onTimezoneChange() {
      setFetchKey((k) => k + 1)
    }
    window.addEventListener("sf:timezone-change", onTimezoneChange as EventListener)
    return () => window.removeEventListener("sf:timezone-change", onTimezoneChange as EventListener)
  }, [])

  useEffect(() => {
    if (lat == null || lng == null) return

    let cancelled = false

    async function load() {
      setIsLoading(true)
      setFetchError(false)
      try {
        const qs = new URLSearchParams({
          lat: String(lat),
          lng: String(lng),
          maxDistanceKm: "10",
        })
        const followed = getCachedFavourites()
          .filter((f) => f.entity_type === "venue")
          .map((f) => f.entity_id)
        if (followed.length) qs.set("followedIds", followed.join(","))

        const res = await fetch(`/api/venues/discovery?${qs}`, { cache: "no-store" })
        if (!res.ok) throw new Error("fetch failed")
        const json = await res.json()
        // Accept both envelope and raw shapes
        const items: VenueCardData[] = Array.isArray(json?.data?.items)
          ? json.data.items.slice(0, 3)
          : Array.isArray(json?.items)
          ? json.items.slice(0, 3)
          : []
        if (!cancelled) setVenues(items)
      } catch {
        if (!cancelled) setFetchError(true)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [lat, lng, fetchKey])

  // ── Render states — never return null ────────────────────────────────────────

  const content = (() => {
    if (locationLoading || (isLoading && venues.length === 0)) {
      return <VenueLoadingState count={2} compact />
    }
    if (permissionState === "unknown" || permissionState === "denied" || lat == null) {
      return (
        <NoLocationPlaceholder
          onRequest={requestLocation}
          isRequesting={locationLoading}
        />
      )
    }
    if (fetchError) {
      return <VenueErrorState onRetry={() => setFetchKey((k) => k + 1)} />
    }
    if (venues.length === 0) {
      return <VenueEmptyState mode="nearby" />
    }
    return (
      <div className="space-y-2">
        {venues.map((v) => (
          <VenueCard key={v.id} venue={v} density="compact" />
        ))}
      </div>
    )
  })()

  return (
    <div className="px-3 pb-3 space-y-2">
      {content}
      <Link
        href="/venues"
        className="block pt-1 text-center text-xs text-primary hover:underline"
      >
        See all nearby venues
      </Link>
    </div>
  )
}
