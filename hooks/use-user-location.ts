"use client"

// hooks/use-user-location.ts
// Section 04.A — Typed adaptor over LocationProvider for venue components.
//
// Returns a stable, narrowed shape so venue components don't depend on the raw
// context structure. All coordinate accessors are typed as number | undefined.
//
// permissionState:
//   "unknown"   — not yet requested
//   "granted"   — coords available
//   "denied"    — browser/user denied
//   "requesting" — in flight

import { useMemo } from "react"
import { useLocation } from "@/components/location-provider"

export type UserLocationPermissionState =
  | "unknown"
  | "granted"
  | "denied"
  | "requesting"

export type UserLocationResult = {
  lat: number | undefined
  lng: number | undefined
  city: string | undefined
  country: string | undefined
  permissionState: UserLocationPermissionState
  isLoading: boolean
  error: string | null
  requestLocation: () => Promise<void>
}

/**
 * Venue-oriented location hook.
 * Wraps useLocation() and normalises coords + permission state into a
 * predictable shape. Safe to call before location has been granted.
 */
export function useUserLocation(): UserLocationResult {
  const { location, loading, error, requestLocation } = useLocation()

  const permissionState = useMemo<UserLocationPermissionState>(() => {
    if (loading) return "requesting"
    if (location) return "granted"
    if (error) return "denied"
    return "unknown"
  }, [location, loading, error])

  return {
    lat: location ? Number(location.latitude) : undefined,
    lng: location ? Number(location.longitude) : undefined,
    city: location?.city,
    country: location?.country,
    permissionState,
    isLoading: loading,
    error,
    requestLocation,
  }
}
