"use client"

import { useState, useEffect } from "react"
import { Heart, Navigation, Phone, MessageCircle, ExternalLink } from "lucide-react"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { ExternalLinkGuard } from "@/components/platform/external-link-guard"

const FAV_KEY = "sf_fav_venues"

// ── Favourite venue helpers ─────────────────────────────────────────────────
// These are device-local saves only — not shared social state.
export function getFavouriteVenues(): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]")
  } catch {
    return []
  }
}

export function toggleFavouriteVenue(id: string): boolean {
  const favs = getFavouriteVenues()
  const next = favs.includes(id) ? favs.filter((v) => v !== id) : [...favs, id]
  localStorage.setItem(FAV_KEY, JSON.stringify(next))
  return next.includes(id)
}

// ── Component ───────────────────────────────────────────────────────────────

interface Props {
  venueId: string
  venueName: string
  phone?: string
  whatsapp?: string
  lineId?: string
  mapUrl?: string
  latitude?: number
  longitude?: number
  /** Optional: pass additional structured action links */
  reserveUrl?: string
  website?: string
  menuUrl?: string
  bookNowUrl?: string
}

export function VenueActions({
  venueId,
  venueName,
  phone,
  whatsapp,
  lineId,
  mapUrl,
  latitude,
  longitude,
  reserveUrl,
  website,
  menuUrl,
  bookNowUrl,
}: Props) {
  const [isFav, setIsFav] = useState(false)

  useEffect(() => {
    setIsFav(getFavouriteVenues().includes(venueId))
  }, [venueId])

  const handleFav = () => {
    triggerHaptic(isFav ? "light" : "medium")
    const next = toggleFavouriteVenue(venueId)
    setIsFav(next)
    window.dispatchEvent(
      new CustomEvent("sf:venue-fav-change", { detail: { venueId, fav: next } }),
    )
  }

  const directionsUrl =
    mapUrl ||
    (latitude && longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueName)}`)

  return (
    <div className="space-y-3">
      {/* Save (device-local) */}
      <button
        onClick={handleFav}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium transition-colors ${
          isFav
            ? "border-red-500/30 bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
            : "border-border bg-card hover:bg-accent"
        }`}
      >
        <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
        {isFav ? "Saved to device" : "Save Venue"}
      </button>

      {/* Directions — primary CTA */}
      <ExternalLinkGuard
        href={directionsUrl}
        onClick={() => triggerHaptic("light")}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        <Navigation className="h-4 w-4" />
        Get Directions
      </ExternalLinkGuard>

      {/* Contact grid */}
      {(phone || whatsapp || lineId || reserveUrl || website || menuUrl || bookNowUrl) && (
        <div className="grid grid-cols-2 gap-2">
          {phone && (
            <a
              href={`tel:${phone}`}
              onClick={() => triggerHaptic("light")}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium hover:bg-accent"
            >
              <Phone className="h-4 w-4 text-primary" />
              Call
            </a>
          )}
          {whatsapp && (
            <ExternalLinkGuard
              href={`https://wa.me/${whatsapp.replace(/[^\d]/g, "")}`}
              onClick={() => triggerHaptic("light")}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium hover:bg-accent"
            >
              <MessageCircle className="h-4 w-4 text-green-500" />
              WhatsApp
            </ExternalLinkGuard>
          )}
          {lineId && (
            <ExternalLinkGuard
              href={`https://line.me/ti/p/~${lineId}`}
              onClick={() => triggerHaptic("light")}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium hover:bg-accent"
            >
              <ExternalLink className="h-4 w-4 text-green-600" />
              LINE
            </ExternalLinkGuard>
          )}
          {bookNowUrl && (
            <ExternalLinkGuard
              href={bookNowUrl}
              onClick={() => triggerHaptic("light")}
              className="flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 py-3 text-sm font-medium text-primary hover:bg-primary/10"
            >
              Book Now
            </ExternalLinkGuard>
          )}
          {reserveUrl && (
            <ExternalLinkGuard
              href={reserveUrl}
              onClick={() => triggerHaptic("light")}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium hover:bg-accent"
            >
              Reserve
            </ExternalLinkGuard>
          )}
          {menuUrl && (
            <ExternalLinkGuard
              href={menuUrl}
              onClick={() => triggerHaptic("light")}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium hover:bg-accent"
            >
              Menu
            </ExternalLinkGuard>
          )}
          {website && (
            <ExternalLinkGuard
              href={website}
              onClick={() => triggerHaptic("light")}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium hover:bg-accent"
            >
              Website
            </ExternalLinkGuard>
          )}
        </div>
      )}
    </div>
  )
}
