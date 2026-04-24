"use client"

import { useState, useEffect } from "react"
import { MapPin, ChevronRight, X } from "lucide-react"
import Link from "next/link"
import { useLocation } from "@/components/location-provider"
import { triggerHaptic } from "@/lib/haptic-feedback"

// Geo-pull sponsored venue/ad cards — shown inline in fixtures or home feed
// Only renders when house ads are enabled and user has location

const ENABLE_ADS = process.env.NEXT_PUBLIC_ENABLE_HOUSE_ADS === "true"

interface SponsoredVenue {
  id: string
  name: string
  tagline: string
  distance?: number
  imageUrl?: string
  href: string
}

export function GeoAdCard() {
  const { location } = useLocation()
  const [venue, setVenue] = useState<SponsoredVenue | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Dismiss state persists for 1 hour
    const d = sessionStorage.getItem("sf_geo_ad_dismissed")
    if (d && Date.now() - Number(d) < 60 * 60 * 1000) setDismissed(true)
  }, [])

  useEffect(() => {
    if (!ENABLE_ADS || !location || dismissed) return
    const load = async () => {
      try {
        const q = new URLSearchParams({
          lat: String(location.latitude),
          lng: String(location.longitude),
          radius: "15",
          sponsored: "true",
        })
        const res = await fetch(`/api/venues?${q}`, { cache: "no-store" })
        const json = res.ok ? await res.json() : null
        const raw = json?.data?.[0] ?? json?.venues?.[0] ?? null
        if (!raw) return
        setVenue({
          id: String(raw.id),
          name: raw.name || raw.strVenue || "Sports Bar",
          tagline: raw.tagline || "Watching tonight — book your table now",
          href: `/venues/${raw.id}`,
        })
      } catch { /* silent */ }
    }
    load()
  }, [location, dismissed])

  if (!ENABLE_ADS || !venue || dismissed) return null

  const dismiss = () => {
    triggerHaptic("light")
    sessionStorage.setItem("sf_geo_ad_dismissed", String(Date.now()))
    setDismissed(true)
  }

  return (
    <div className="mx-3 mb-2 rounded-xl border border-primary/20 bg-card shadow-sm">
      <div className="flex items-start gap-3 p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sponsored</span>
          </div>
          <p className="text-sm font-bold leading-tight">{venue.name}</p>
          <p className="text-xs text-muted-foreground">{venue.tagline}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <button onClick={dismiss} className="rounded p-0.5 hover:bg-accent" aria-label="Dismiss ad">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <Link href={venue.href} className="flex items-center gap-0.5 text-xs text-primary hover:underline">
            View <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
