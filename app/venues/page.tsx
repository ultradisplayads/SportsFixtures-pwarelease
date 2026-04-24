"use client"

import { useState, useCallback, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Clock,
  ExternalLink,
  Globe,
  MapPin,
  Navigation,
  Search,
  Star,
  Tv,
  Users,
  Utensils,
  X,
  Zap,
} from "lucide-react"
import { useLocation } from "@/components/location-provider"
import { SkeletonLoader } from "@/components/skeleton-loader"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { useVenueDiscovery } from "@/hooks/use-venue-discovery"
import { VenueFiltersSheet } from "@/components/venues/venue-filters-sheet"
import { VenueEmptyState } from "@/components/venues/venue-empty-state"
import { AdInjectionRow } from "@/components/ad-injection"
import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"
import { LiveTicker } from "@/components/live-ticker"
import type { VenueCard } from "@/types/venues"

type SortMode = "distance" | "score" | "rating"

const SORT_LABELS: Record<SortMode, string> = {
  distance: "Nearest",
  score:    "Best Match",
  rating:   "Top Rated",
}

const VENUE_TYPE_LABEL: Record<string, string> = {
  sports_bar:       "Sports Bar",
  bar:              "Bar",
  pub:              "Pub",
  restaurant:       "Restaurant",
  cafe:             "Cafe",
  club:             "Club",
  rooftop_bar:      "Rooftop Bar",
  bistro:           "Bistro",
  fine_dining:      "Fine Dining",
  hotel_restaurant: "Hotel Restaurant",
}

// ── Sponsored hero card ───────────────────────────────────────────────────────

function SponsoredCard({ venue }: { venue: VenueCard }) {
  const cuisineTags = (venue.cuisine ?? [])
    .concat(
      (venue.facilities ?? [])
        .filter((f) => f.startsWith("cuisine:"))
        .map((f) => f.replace("cuisine:", "").trim()),
    )
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 3)

  const displayRating =
    venue.googleRating ?? venue.tripadvisorRating ?? venue.rating

  return (
    <Link
      href={`/venues/${venue.slug ?? venue.id}`}
      onClick={() => triggerHaptic("light")}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-amber-400/40 bg-card shadow-md transition-shadow hover:shadow-lg"
    >
      {/* Cover photo */}
      <div className="relative h-36 w-full overflow-hidden bg-secondary">
        {venue.photoUrl && (
          <Image
            src={venue.photoUrl}
            alt={venue.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Sponsored badge */}
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5">
          <Zap className="h-2.5 w-2.5 text-white" aria-hidden="true" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-white">Sponsored</span>
        </div>

        {/* Live badge */}
        {venue.showingNow && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[9px] font-bold uppercase text-white">Live Sport</span>
          </div>
        )}

        {/* Name over photo */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
          <h3 className="font-bold text-white drop-shadow-sm leading-tight">{venue.name}</h3>
          {venue.area && (
            <p className="text-[11px] text-white/80 mt-0.5">{venue.area}, {venue.city}</p>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2 p-3">
        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-1.5">
          {venue.distanceKm != null && (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {venue.distanceKm < 1
                ? `${Math.round(venue.distanceKm * 1000)} m`
                : `${venue.distanceKm.toFixed(1)} km`}
            </span>
          )}
          {(venue.screenCount ?? 0) > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px]">
              <Tv className="h-3 w-3" aria-hidden="true" />
              {venue.screenCount} screens
            </span>
          )}
          {venue.priceBand && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {venue.priceBand}
            </span>
          )}
          {displayRating != null && (
            <span className="flex items-center gap-1 rounded-full bg-yellow-400/10 px-2 py-0.5 text-[11px] font-semibold text-yellow-600 dark:text-yellow-400">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" aria-hidden="true" />
              {displayRating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Cuisine tags */}
        {cuisineTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {cuisineTags.map((t) => (
              <span key={t} className="rounded-md bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground capitalize">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Happy hour */}
        {venue.happyHour && (
          <p className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            <Zap className="h-3 w-3" aria-hidden="true" />
            Happy Hour: {venue.happyHour}
          </p>
        )}
      </div>
    </Link>
  )
}

// ── Regular venue list card ───────────────────────────────────────────────────

function VenueListCard({ venue }: { venue: VenueCard }) {
  const cuisineTags = (venue.cuisine ?? [])
    .concat(
      (venue.facilities ?? [])
        .filter((f) => f.startsWith("cuisine:"))
        .map((f) => f.replace("cuisine:", "").trim()),
    )
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 3)

  const displayRating =
    venue.googleRating ?? venue.tripadvisorRating ?? venue.rating

  return (
    <Link
      href={`/venues/${venue.slug ?? venue.id}`}
      onClick={() => triggerHaptic("light")}
      className="group flex overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.99]"
    >
      {/* Thumbnail */}
      <div className="relative h-28 w-28 shrink-0 overflow-hidden bg-secondary sm:h-36 sm:w-36">
        {venue.photoUrl ? (
          <Image
            src={venue.photoUrl}
            alt={venue.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="144px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Tv className="h-6 w-6 text-muted-foreground/30" aria-hidden="true" />
          </div>
        )}
        {venue.showingNow && (
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-red-500/90 px-1.5 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[8px] font-bold uppercase text-white leading-none">Live</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3">
        {/* Name row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold leading-tight text-sm">{venue.name}</h3>
            {venue.area && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {venue.area}{venue.city ? `, ${venue.city}` : ""}
              </p>
            )}
          </div>
          {displayRating != null && (
            <div className="flex shrink-0 items-center gap-0.5">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
              <span className="text-xs font-semibold">{displayRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Type + price band */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {venue.venueType && (
            <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {VENUE_TYPE_LABEL[venue.venueType] ?? venue.venueType}
            </span>
          )}
          {venue.priceBand && (
            <span className="text-[11px] font-semibold text-muted-foreground">{venue.priceBand}</span>
          )}
        </div>

        {/* Stats chips */}
        <div className="flex flex-wrap gap-1">
          {venue.distanceKm != null && (
            <span className="flex items-center gap-0.5 text-[10px] font-medium text-primary">
              <MapPin className="h-2.5 w-2.5" aria-hidden="true" />
              {venue.distanceKm < 1
                ? `${Math.round(venue.distanceKm * 1000)} m`
                : `${venue.distanceKm.toFixed(1)} km`}
            </span>
          )}
          {(venue.screenCount ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Tv className="h-2.5 w-2.5" aria-hidden="true" />
              {venue.screenCount} screens
            </span>
          )}
          {(venue.capacity ?? 0) > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Users className="h-2.5 w-2.5" aria-hidden="true" />
              {venue.capacity}
            </span>
          )}
        </div>

        {/* Opening hours */}
        {venue.openingHours && (
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
            {venue.openingHours}
          </p>
        )}

        {/* Cuisine tags */}
        {cuisineTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {cuisineTags.map((t) => (
              <span key={t} className="text-[10px] text-muted-foreground capitalize">
                {t}
              </span>
            )).reduce((acc: React.ReactNode[], el, i) => [
              ...acc,
              i > 0 ? <span key={`sep-${i}`} className="text-[10px] text-border">·</span> : null,
              el,
            ], [])}
          </div>
        )}

        {/* Happy hour pill */}
        {venue.happyHour && (
          <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            <Zap className="h-2.5 w-2.5" aria-hidden="true" />
            {venue.happyHour}
          </span>
        )}
      </div>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VenuesPage() {
  const { location, requestLocation, loading: locationLoading } = useLocation()

  const [sortMode, setSortMode] = useState<SortMode>("distance")
  const [searchQuery, setSearchQuery] = useState("")

  const { items, isLoading, error, data, filters, setFilters } = useVenueDiscovery({
    lat: location ? Number(location.latitude) : undefined,
    lng: location ? Number(location.longitude) : undefined,
  })

  const handleSearchChange = useCallback(
    (q: string) => {
      setSearchQuery(q)
      setFilters((prev: typeof filters) => ({ ...prev, searchQuery: q }))
    },
    [setFilters],
  )

  const handleSort = (sort: SortMode) => {
    triggerHaptic("selection")
    setSortMode(sort)
  }

  // Split sponsored (geo-PPC) from organic, sort each group independently
  const { sponsored, organic } = useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      if (sortMode === "distance") {
        if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm
        if (a.distanceKm != null) return -1
        if (b.distanceKm != null) return 1
      }
      if (sortMode === "rating") {
        const ra = a.googleRating ?? a.tripadvisorRating ?? a.rating ?? 0
        const rb = b.googleRating ?? b.tripadvisorRating ?? b.rating ?? 0
        return rb - ra
      }
      return (b.score ?? 0) - (a.score ?? 0)
    })
    return {
      sponsored: sorted
        .filter((v) => v.sponsored)
        .sort((a, b) => (b.ppcBid ?? 0) - (a.ppcBid ?? 0)),
      organic: sorted.filter((v) => !v.sponsored),
    }
  }, [items, sortMode])

  const activeFilterCount = [
    filters.maxDistanceKm != null,
    !!filters.offersOnly,
    !!filters.followedOnly,
    (filters.facilityKeys?.length ?? 0) > 0,
    (filters.venueTypes?.length ?? 0) > 0,
    (filters.foodOptions?.length ?? 0) > 0,
    (filters.sports?.length ?? 0) > 0,
  ].filter(Boolean).length

  const totalCount = sponsored.length + organic.length

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <LiveTicker />
      <HeaderMenu />

      {/* Sticky sub-header */}
      <div className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="px-4 pt-4 pb-2.5">
          <h1 className="text-xl font-bold leading-tight">Places to Watch</h1>
          <p className="text-sm text-muted-foreground">
            Sports bars, pubs &amp; restaurants near you
          </p>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search by name, city or country..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/40 py-2.5 pl-9 pr-9 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:bg-background transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sort chips + Filters button */}
        <div className="flex items-center gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
          {(["distance", "score", "rating"] as SortMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleSort(mode)}
              className={`shrink-0 rounded-xl border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                sortMode === mode
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              {SORT_LABELS[mode]}
            </button>
          ))}
          <div className="mx-1 h-5 w-px shrink-0 bg-border" />
          <VenueFiltersSheet
            filters={filters}
            onFiltersChange={setFilters}
            availableFacilities={data?.filters?.facilities ?? []}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4">

        {/* Location prompt */}
        {!location && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Enable Location</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Find sports bars near you, or search by city or country above.
                </p>
                <button
                  onClick={() => { triggerHaptic("medium"); requestLocation() }}
                  disabled={locationLoading}
                  className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {locationLoading ? "Getting Location..." : "Use My Location"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Location active banner */}
        {location && (
          <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-3 py-2 text-sm">
            <Navigation className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
            <span className="text-green-700 dark:text-green-400">
              Showing venues near {location.city || "your location"}
            </span>
          </div>
        )}

        {/* Results count */}
        {!isLoading && totalCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {totalCount} venue{totalCount !== 1 ? "s" : ""} found
            {activeFilterCount > 0
              ? ` · ${activeFilterCount} filter${activeFilterCount !== 1 ? "s" : ""} active`
              : ""}
          </p>
        )}

        {/* Sponsored section */}
        {!isLoading && sponsored.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Featured Venues
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground/70">Sponsored</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {sponsored.map((venue) => (
                <SponsoredCard key={venue.id} venue={venue} />
              ))}
            </div>
          </div>
        )}

        {/* Organic list */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex h-28 animate-pulse overflow-hidden rounded-2xl border border-border bg-card">
                <div className="h-full w-28 shrink-0 bg-secondary sm:w-36" />
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div className="h-4 w-3/4 rounded bg-secondary" />
                  <div className="h-3 w-1/2 rounded bg-secondary" />
                  <div className="h-3 w-2/3 rounded bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            {error}
          </p>
        ) : organic.length === 0 && sponsored.length === 0 ? (
          <VenueEmptyState mode="nearby" />
        ) : (
          <>
            {organic.length > 0 && (
              <div>
                {sponsored.length > 0 && (
                  <h2 className="mb-2 text-sm font-semibold text-muted-foreground">All Venues</h2>
                )}
                <div className="flex flex-col gap-2.5">
                  {organic.map((venue, i) => (
                    <div key={venue.id}>
                      <AdInjectionRow groupIndex={i} every={6} placement="venues" />
                      <VenueListCard venue={venue} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Owner CTA */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <Globe className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <h3 className="font-bold">Own a Sports Bar or Restaurant?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Join our network and reach thousands of sports fans. Get a featured listing, PPC placement, and bookings — all managed from one dashboard.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/venues/owner-signup"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                List Your Venue
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <Link
                href="/venues/advertise"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-accent transition-colors"
              >
                <Zap className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                Advertise
              </Link>
            </div>
          </div>
        </div>

      </div>
      <BottomNav />
    </div>
  )
}
