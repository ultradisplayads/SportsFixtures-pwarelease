import type { NearbyVenueCard } from "@/types/nearby-event"

export function filterNearbyEventVenues(
  venues: NearbyVenueCard[],
  input: {
    maxDistanceKm: number
    sport?: string
    competitionId?: string
    eventId?: string
  },
): NearbyVenueCard[] {
  return venues
    .filter((venue) => {
      if (venue.distanceKm != null && venue.distanceKm > input.maxDistanceKm) return false
      if (input.sport && venue.sport && venue.sport !== input.sport) return false
      if (input.competitionId && venue.competitionId && venue.competitionId !== input.competitionId) return false
      if (input.eventId && Array.isArray(venue.eventIds) && !venue.eventIds.includes(input.eventId)) return false
      return true
    })
    .sort((a, b) => {
      const aDist = a.distanceKm ?? 9999
      const bDist = b.distanceKm ?? 9999
      return aDist - bDist
    })
}

export function buildNearbyReasons(input: {
  distanceKm?: number | null
  eventMatched?: boolean
  competitionMatched?: boolean
  sportMatched?: boolean
  showingNow?: boolean
}): string[] {
  const reasons: string[] = []
  if (input.eventMatched) reasons.push("Relevant to this event")
  if (input.competitionMatched) reasons.push("Relevant to this competition")
  if (input.sportMatched) reasons.push("Relevant to this sport")
  if (typeof input.distanceKm === "number") reasons.push(`${input.distanceKm.toFixed(1)} km away`)
  if (input.showingNow) reasons.push("Showing now")
  return reasons
}
