export type NearbyVenueCard = {
  id: string
  name: string
  area?: string | null
  city?: string | null
  distanceKm?: number | null
  sport?: string | null
  competitionId?: string | null
  eventIds?: string[]
  showingNow?: boolean
  reasons?: string[]
  checkedInCount?: number | null
  watchingHereCount?: number | null
  operatorMarkedBusy?: boolean
  userCheckedIn?: boolean
  userWatchingHere?: boolean
}

export type NearbyEventResponse = {
  items: NearbyVenueCard[]
  locationUsed: boolean
  filters: {
    radiusKm: number
    sport?: string
    competitionId?: string
    eventId?: string
  }
  generatedAt: string
}
