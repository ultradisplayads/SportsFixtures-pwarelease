"use client"

import { useState, useEffect } from "react"
import { MapPin, Beer, Settings } from "lucide-react"
import Link from "next/link"
import { useLocation } from "./location-provider"
import { triggerHaptic } from "@/lib/haptic-feedback"

export function LocationBanner() {
  const { location, loading, error, locationEnabled, requestLocation } = useLocation()
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    setShowBanner(locationEnabled && !location)
  }, [location, locationEnabled])

  const handleEnable = async () => {
    triggerHaptic("medium")
    await requestLocation()
    if (!error) setShowBanner(false)
  }

  if (!showBanner || location || !locationEnabled) {
    return null
  }

  return (
    <div className="border-b border-border bg-blue-50 dark:bg-blue-950/20">
      <div className="flex items-stretch gap-0">
        {/* Left — Find Local Matches */}
        <div className="flex flex-1 items-start gap-3 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Find Local Matches</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Location-aware results are on by default for nearby matches and local teams
            </p>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleEnable}
                disabled={loading}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Getting Location..." : "Use My Location"}
              </button>
              <Link
                href="/settings#location"
                onClick={() => triggerHaptic("selection")}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
              >
                <Settings className="h-3 w-3" />
                Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-border/60 my-3" />

        {/* Right — Find Places to Watch */}
        <div className="flex flex-1 items-start gap-3 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
            <Beer className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Find Places to Watch</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Discover venues showing live sport near your current area
            </p>
            <Link
              href="/venues"
              onClick={() => triggerHaptic("selection")}
              className="mt-2 inline-block rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-500/20 dark:text-amber-400"
            >
              Find Venues
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
