// lib/nearby-event-filter.ts
// Section 08 — Filters a list of events down to those taking place at
// venues within a given radius of the user's location.
// Used by /api/nearby/venues to scope results to geo-relevant events.

export interface GeoPoint {
  lat: number
  lng: number
}

/** Haversine distance in kilometres between two geo points. */
function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sin2 = (x: number) => Math.sin(x / 2) ** 2
  const h = sin2(dLat) + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sin2(dLng)
  return 2 * R * Math.asin(Math.sqrt(h))
}

export interface NearbyEventCandidate {
  id: string
  venueLat?: number | null
  venueLng?: number | null
  sport?: string | null
  dateEvent?: string | null
  strTime?: string | null
  [key: string]: unknown
}

export interface NearbyEventFilterOptions {
  origin: GeoPoint
  maxDistanceKm?: number
  sport?: string
  /** ISO date string YYYY-MM-DD */
  date?: string
}

export function filterNearbyEvents<T extends NearbyEventCandidate>(
  events: T[],
  opts: NearbyEventFilterOptions,
): Array<T & { distanceKm: number }> {
  const maxKm = opts.maxDistanceKm ?? 25

  return events
    .filter((e) => {
      if (e.venueLat == null || e.venueLng == null) return false
      if (opts.sport && (e.sport ?? "").toLowerCase() !== opts.sport.toLowerCase()) return false
      if (opts.date && e.dateEvent && !e.dateEvent.startsWith(opts.date)) return false
      return true
    })
    .map((e) => ({
      ...e,
      distanceKm: haversineKm(opts.origin, {
        lat: Number(e.venueLat),
        lng: Number(e.venueLng),
      }),
    }))
    .filter((e) => e.distanceKm <= maxKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
}
