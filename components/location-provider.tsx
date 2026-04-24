"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface Location {
  latitude: number
  longitude: number
  city?: string
  country?: string
}

interface LocationContextType {
  location: Location | null
  loading: boolean
  error: string | null
  requestLocation: () => Promise<void>
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Try to load saved location from localStorage
    const savedLocation = localStorage.getItem("userLocation")
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation)
        const lat = Number(parsed?.latitude)
        const lng = Number(parsed?.longitude)
        if (isFinite(lat) && isFinite(lng)) {
          setLocation({ ...parsed, latitude: lat, longitude: lng })
        } else {
          // Stale/corrupt entry — discard it
          localStorage.removeItem("userLocation")
        }
      } catch {
        localStorage.removeItem("userLocation")
      }
    }
  }, [])

  const requestLocation = async () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        })
      })

      const newLocation: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }

      // Reverse geocode to get city/country (using a mock implementation)
      // In production, use a real geocoding API like Google Maps or OpenStreetMap
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLocation.latitude}&lon=${newLocation.longitude}`,
        )
        const data = await response.json()
        newLocation.city = data.address?.city || data.address?.town || data.address?.village
        newLocation.country = data.address?.country
      } catch {
        // Geocoding failed — lat/lng still usable without city name
      }

      setLocation(newLocation)
      localStorage.setItem("userLocation", JSON.stringify(newLocation))
    } catch (err) {
      const error = err as GeolocationPositionError
      setError(error.message || "Failed to get location")
    } finally {
      setLoading(false)
    }
  }

  return (
    <LocationContext.Provider value={{ location, loading, error, requestLocation }}>
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
