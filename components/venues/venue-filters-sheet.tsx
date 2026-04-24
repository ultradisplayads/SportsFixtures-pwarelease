"use client"

import { useState } from "react"
import { SlidersHorizontal, X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { triggerHaptic } from "@/lib/haptic-feedback"
import type { VenueClientFilters, VenueType, FoodOption } from "@/lib/venue-discovery"
import {
  VENUE_TYPE_LABELS,
  FOOD_OPTION_LABELS,
} from "@/lib/venue-discovery"

const DISTANCE_OPTIONS = [2, 5, 10, 20, 50] as const

const VENUE_TYPES: VenueType[] = ["bar", "pub", "restaurant", "cafe", "club"]
const FOOD_OPTIONS: FoodOption[] = ["food_served", "kitchen_late", "happy_hour"]

const SPORT_OPTIONS = [
  "Football", "Rugby", "Cricket", "Tennis", "Golf",
  "Basketball", "Boxing", "MMA", "Darts", "American Football",
]

interface Props {
  filters: VenueClientFilters
  onFiltersChange: (f: VenueClientFilters) => void
  availableFacilities?: string[]
}

export function VenueFiltersSheet({
  filters,
  onFiltersChange,
  availableFacilities = [],
}: Props) {
  const [open, setOpen] = useState(false)

  const activeCount = [
    filters.maxDistanceKm != null,
    !!filters.offersOnly,
    !!filters.followedOnly,
    (filters.facilityKeys?.length ?? 0) > 0,
    (filters.venueTypes?.length ?? 0) > 0,
    (filters.foodOptions?.length ?? 0) > 0,
    (filters.sports?.length ?? 0) > 0,
  ].filter(Boolean).length

  const set = (patch: Partial<VenueClientFilters>) => {
    onFiltersChange({ ...filters, ...patch })
    triggerHaptic("selection")
  }

  const toggleItem = <T extends string>(
    key: keyof VenueClientFilters,
    value: T,
    current: T[] | undefined,
  ) => {
    const arr = current ?? []
    set({ [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] })
  }

  const toggleFacility = (k: string) => toggleItem("facilityKeys", k, filters.facilityKeys)
  const toggleVenueType = (t: VenueType) => toggleItem("venueTypes", t, filters.venueTypes)
  const toggleFoodOption = (o: FoodOption) => toggleItem("foodOptions", o, filters.foodOptions)
  const toggleSport = (s: string) => toggleItem("sports", s, filters.sports)

  const reset = () => {
    onFiltersChange({
      maxDistanceKm: undefined,
      facilityKeys: [],
      offersOnly: false,
      followedOnly: false,
      venueTypes: [],
      foodOptions: [],
      sports: [],
      searchQuery: filters.searchQuery, // preserve search text
    })
    triggerHaptic("light")
  }

  const chipCls = (active: boolean) =>
    `rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-card hover:bg-accent"
    }`

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          onClick={() => triggerHaptic("light")}
          className={`relative flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
            activeCount > 0
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card hover:bg-accent"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="flex flex-row items-center justify-between pb-4">
          <SheetTitle className="text-base">Filter Venues</SheetTitle>
          {activeCount > 0 && (
            <button
              onClick={reset}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Reset all
            </button>
          )}
        </SheetHeader>

        <div className="space-y-6 pb-safe">

          {/* Venue type */}
          <div>
            <p className="mb-2.5 text-sm font-semibold">Venue Type</p>
            <div className="flex flex-wrap gap-2">
              {VENUE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleVenueType(t)}
                  className={chipCls(!!filters.venueTypes?.includes(t))}
                >
                  {VENUE_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Food & drink */}
          <div>
            <p className="mb-2.5 text-sm font-semibold">Food &amp; Drink</p>
            <div className="flex flex-wrap gap-2">
              {FOOD_OPTIONS.map((o) => (
                <button
                  key={o}
                  onClick={() => toggleFoodOption(o)}
                  className={chipCls(!!filters.foodOptions?.includes(o))}
                >
                  {FOOD_OPTION_LABELS[o]}
                </button>
              ))}
            </div>
          </div>

          {/* Sports shown */}
          <div>
            <p className="mb-2.5 text-sm font-semibold">Sports Shown</p>
            <div className="flex flex-wrap gap-2">
              {SPORT_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSport(s)}
                  className={chipCls(!!filters.sports?.includes(s))}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Max distance */}
          <div>
            <p className="mb-2.5 text-sm font-semibold">Max Distance</p>
            <div className="flex flex-wrap gap-2">
              {DISTANCE_OPTIONS.map((km) => (
                <button
                  key={km}
                  onClick={() => set({ maxDistanceKm: filters.maxDistanceKm === km ? undefined : km })}
                  className={chipCls(filters.maxDistanceKm === km)}
                >
                  {km} km
                </button>
              ))}
            </div>
          </div>

          {/* Toggle filters */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="offers-only" className="text-sm font-medium">
                Offers &amp; deals only
              </Label>
              <Switch
                id="offers-only"
                checked={!!filters.offersOnly}
                onCheckedChange={(v) => set({ offersOnly: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="followed-only" className="text-sm font-medium">
                Followed venues only
              </Label>
              <Switch
                id="followed-only"
                checked={!!filters.followedOnly}
                onCheckedChange={(v) => set({ followedOnly: v })}
              />
            </div>
          </div>

          {/* Facilities (dynamic from API) */}
          {availableFacilities.length > 0 && (
            <div>
              <p className="mb-2.5 text-sm font-semibold">Facilities</p>
              <div className="flex flex-wrap gap-2">
                {availableFacilities.map((fac) => (
                  <button
                    key={fac}
                    onClick={() => toggleFacility(fac)}
                    className={chipCls(!!filters.facilityKeys?.includes(fac))}
                  >
                    {fac}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
