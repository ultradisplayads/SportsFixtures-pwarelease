"use client"

import { useState } from "react"
import { MapPin, Navigation, X } from "lucide-react"
import { useLocation } from "@/components/location-provider"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { useFixturesFilter } from "@/lib/fixtures-filter-context"

const RADII = [5, 10, 25, 50, 100]

export function NearbyEventFilter() {
  const { location, requestLocation, loading } = useLocation()
  const { setNearbyFilter } = useFixturesFilter()
  const [radius, setRadius] = useState(25)
  const [active, setActive] = useState(false)

  const handleEnable = async () => {
    triggerHaptic("medium")
    let loc = location
    if (!loc) {
      await requestLocation()
      // location updates asynchronously; rely on re-render
      loc = location
    }
    setActive(true)
    if (loc) {
      setNearbyFilter({ lat: loc.latitude, lng: loc.longitude, radius })
    }
  }

  const handleDisable = () => {
    triggerHaptic("light")
    setActive(false)
    setNearbyFilter(null)
  }

  const handleRadiusChange = (r: number) => {
    triggerHaptic("selection")
    setRadius(r)
    if (active && location) {
      setNearbyFilter({ lat: location.latitude, lng: location.longitude, radius: r })
    }
  }

  if (!active) {
    return (
      <button
        onClick={handleEnable}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
        aria-label="Filter events near me"
      >
        <Navigation className="h-3.5 w-3.5 text-primary" />
        <span>Near me</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-1">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium text-primary">
          {location ? `${location.city || "Near you"}` : "Locating..."}
        </span>
        <div className="flex gap-0.5 ml-1">
          {RADII.map((r) => (
            <button
              key={r}
              onClick={() => handleRadiusChange(r)}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                radius === r ? "bg-primary text-primary-foreground" : "text-primary hover:bg-primary/20"
              }`}
            >
              {r}km
            </button>
          ))}
        </div>
        <button onClick={handleDisable} className="ml-1 rounded-full p-0.5 hover:bg-primary/20">
          <X className="h-3 w-3 text-primary" />
        </button>
      </div>
    </div>
  )
}
