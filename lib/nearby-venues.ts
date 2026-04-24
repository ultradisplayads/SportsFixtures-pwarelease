export type NearbyVenue = {
  id: string
  name: string
  distanceKm?: number | null
  city?: string | null
  area?: string | null
  eventIds?: string[]
  sport?: string | null
  competitionId?: string | null
  showingNow?: boolean
}

export function filterNearbyVenues(
  venues: NearbyVenue[],
  input: {
    maxDistanceKm?: number
    sport?: string
    competitionId?: string
    eventId?: string
  },
): NearbyVenue[] {
  return venues.filter((venue) => {
    if (
      input.maxDistanceKm != null &&
      venue.distanceKm != null &&
      venue.distanceKm > input.maxDistanceKm
    ) {
      return false
    }
    if (input.sport && venue.sport && venue.sport !== input.sport) return false
    if (
      input.competitionId &&
      venue.competitionId &&
      venue.competitionId !== input.competitionId
    )
      return false
    if (
      input.eventId &&
      Array.isArray(venue.eventIds) &&
      !venue.eventIds.includes(input.eventId)
    )
      return false
    return true
  })
}
