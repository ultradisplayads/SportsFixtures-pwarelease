"use client"

import { useEffect, useMemo, useState } from "react"
import { filterVenueCards } from "@/lib/venue-discovery"
import { getCachedFavourites } from "@/lib/favourites-api"
import type { VenueDiscoveryResponse } from "@/types/venues"
import type { VenueClientFilters } from "@/lib/venue-discovery"
import type { NormalizedEnvelope, DataFreshness, DataAvailability } from "@/types/contracts"

export type VenueDiscoveryParams = {
  eventId?: string
  sport?: string
  competitionId?: string
  lat?: number
  lng?: number
}

export function useVenueDiscovery(params: VenueDiscoveryParams) {
  const [data, setData] = useState<VenueDiscoveryResponse | null>(null)
  const [freshness, setFreshness] = useState<DataFreshness>("unknown")
  const [availability, setAvailability] = useState<DataAvailability>("unavailable")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<VenueClientFilters>({
    maxDistanceKm: undefined,
    facilityKeys: [],
    offersOnly: false,
    followedOnly: false,
    venueTypes: [],
    foodOptions: [],
    sports: [],
    searchQuery: "",
  })

  useEffect(() => {
    let cancelled = false

    async function run() {
      setIsLoading(true)
      setError(null)
      try {
        const qs = new URLSearchParams()
        if (params.eventId) qs.set("eventId", params.eventId)
        if (params.sport) qs.set("sport", params.sport)
        if (params.competitionId) qs.set("competitionId", params.competitionId)
        if (params.lat != null) qs.set("lat", String(params.lat))
        if (params.lng != null) qs.set("lng", String(params.lng))

        const followed = getCachedFavourites()
          .filter((f) => f.entity_type === "venue")
          .map((f) => f.entity_id)
        if (followed.length) qs.set("followedIds", followed.join(","))

        const res = await fetch(`/api/venues/discovery?${qs}`, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load venues")

        // Unwrap normalized envelope
        const envelope: NormalizedEnvelope<VenueDiscoveryResponse> = await res.json()
        if (!cancelled) {
          setData(envelope.data ?? null)
          setFreshness(envelope.freshness)
          setAvailability(envelope.availability)
          if (envelope.unavailableReason) setError(envelope.unavailableReason)
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load venues")
          setAvailability("unavailable")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.eventId, params.sport, params.competitionId, params.lat, params.lng])

  const items = useMemo(() => {
    if (!data?.items) return []
    return filterVenueCards(data.items, filters)
  }, [data, filters])

  return {
    data,
    items,
    freshness,
    availability,
    isLoading,
    error,
    filters,
    setFilters,
  }
}
