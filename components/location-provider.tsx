"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface Location {
  latitude: number
  longitude: number
  city?: string
  country?: string
  accuracy?: number
  source?: "browser-geolocation"
}

interface LocationContextType {
  location: Location | null
  loading: boolean
  error: string | null
  locationEnabled: boolean
  setLocationEnabled: (enabled: boolean) => void
  requestLocation: (opts?: { silent?: boolean }) => Promise<void>
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)
const LOCATION_KEY = "userLocation"
const LOCATION_ENABLED_KEY = "sf_location_awareness_enabled"
const LOCATION_AUTO_ATTEMPT_KEY = "sf_location_auto_attempted"

function normaliseStoredLocation(raw: unknown): Location | null {
  if (!raw || typeof raw !== "object") return null
  const value = raw as Record<string, unknown>
  const latitude = Number(value.latitude ?? value.lat)
  const longitude = Number(value.longitude ?? value.lng)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  return {
    ...value,
    latitude,
    longitude,
    accuracy: value.accuracy != null ? Number(value.accuracy) : undefined,
    source: "browser-geolocation",
  }
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationEnabled, setLocationEnabledState] = useState(true)

  const setLocationEnabled = (enabled: boolean) => {
    setLocationEnabledState(enabled)
    localStorage.setItem(LOCATION_ENABLED_KEY, enabled ? "true" : "false")
    if (!enabled) {
      setLocation(null)
      setError(null)
      localStorage.removeItem(LOCATION_KEY)
    } else {
      sessionStorage.removeItem(LOCATION_AUTO_ATTEMPT_KEY)
      void requestLocation({ silent: true })
    }
  }

  const requestLocation = async (opts: { silent?: boolean } = {}) => {
    if (!locationEnabled && localStorage.getItem(LOCATION_ENABLED_KEY) === "false") return

    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser")
      return
    }

    if (!opts.silent) setLoading(true)
    setError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 60_000,
        })
      })

      const newLocation: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        source: "browser-geolocation",
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLocation.latitude}&lon=${newLocation.longitude}`,
        )
        const data = await response.json()
        newLocation.city = data.address?.city || data.address?.town || data.address?.village
        newLocation.country = data.address?.country
      } catch {
        // Coordinates are still usable without reverse geocoding.
      }

      setLocation(newLocation)
      localStorage.setItem(LOCATION_KEY, JSON.stringify(newLocation))
      localStorage.setItem(LOCATION_ENABLED_KEY, "true")
    } catch (err) {
      const geoError = err as GeolocationPositionError
      setError(geoError.message || "Failed to get location. Check browser site permissions.")
    } finally {
      if (!opts.silent) setLoading(false)
    }
  }

  useEffect(() => {
    const enabled = localStorage.getItem(LOCATION_ENABLED_KEY) !== "false"
    setLocationEnabledState(enabled)
    if (!enabled) {
      localStorage.removeItem(LOCATION_KEY)
      return
    }

    const savedLocation = localStorage.getItem(LOCATION_KEY)
    if (savedLocation) {
      try {
        const parsed = normaliseStoredLocation(JSON.parse(savedLocation))
        if (parsed) {
          setLocation(parsed)
          localStorage.setItem(LOCATION_KEY, JSON.stringify(parsed))
        } else {
          localStorage.removeItem(LOCATION_KEY)
        }
      } catch {
        localStorage.removeItem(LOCATION_KEY)
      }
    }

    if ("permissions" in navigator && "geolocation" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((status) => {
          if (status.state === "granted") requestLocation({ silent: true })
          if (status.state === "prompt" && !sessionStorage.getItem(LOCATION_AUTO_ATTEMPT_KEY)) {
            sessionStorage.setItem(LOCATION_AUTO_ATTEMPT_KEY, "true")
            requestLocation({ silent: true })
          }
          status.onchange = () => {
            if (status.state === "granted") requestLocation({ silent: true })
            if (status.state === "denied") setError("Location permission is blocked in the browser")
          }
        })
        .catch(() => {})
    } else if ("geolocation" in navigator && !sessionStorage.getItem(LOCATION_AUTO_ATTEMPT_KEY)) {
      sessionStorage.setItem(LOCATION_AUTO_ATTEMPT_KEY, "true")
      requestLocation({ silent: true })
    }
  }, [])

  return (
    <LocationContext.Provider value={{ location, loading, error, locationEnabled, setLocationEnabled, requestLocation }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider")
  }
  return context
}
