"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft, Star, User, MapPin, Trophy, Globe,
  LayoutDashboard, CalendarDays, Trash2, AlertCircle, RefreshCw,
} from "lucide-react"
import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"
import { TimezoneSelector } from "@/components/timezone-selector"
import { triggerHaptic } from "@/lib/haptic-feedback"
import {
  getFavourites,
  removeFavourite,
  type Favourite,
  type EntityType,
} from "@/lib/favourites-api"
import {
  getSavedCalendarMode,
  saveCalendarMode,
  type CalendarMode,
} from "@/lib/personalization"
import {
  getSavedLocationConsent,
  setSavedLocationConsent,
} from "@/lib/personalization-prefs"

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
    </div>
  )
}

// ── Follow pill (removable) ────────────────────────────────────────────────────

function FollowPill({
  fav,
  onRemove,
}: {
  fav: Favourite
  onRemove: (type: EntityType, id: string) => void
}) {
  const [removing, setRemoving] = useState(false)

  const handleRemove = async () => {
    triggerHaptic("medium")
    setRemoving(true)
    await removeFavourite(fav.entity_type, fav.entity_id)
    onRemove(fav.entity_type, fav.entity_id)
    window.dispatchEvent(new CustomEvent("sf:favourites-change"))
  }

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 transition-opacity ${
        removing ? "opacity-30" : ""
      }`}
    >
      {fav.entity_logo && (
        <img src={fav.entity_logo} alt="" className="h-4 w-4 object-contain" />
      )}
      <span className="text-xs font-medium">{fav.entity_name ?? fav.entity_id}</span>
      <button
        onClick={handleRemove}
        disabled={removing}
        aria-label={`Unfollow ${fav.entity_name ?? fav.entity_id}`}
        className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-40"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  )
}

// ── Empty state for a follow category ─────────────────────────────────────────

function EmptyFollows({ label }: { label: string }) {
  return (
    <p className="text-xs text-muted-foreground">
      You are not following any {label} yet.
    </p>
  )
}

// ── Reset confirmation ─────────────────────────────────────────────────────────

function ResetSection({ onReset }: { onReset: () => void }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
        <div className="flex items-start gap-2 text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p className="text-sm font-medium">This will remove all your followed teams, players, venues, and leagues. This cannot be undone.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { triggerHaptic("heavy"); onReset() }}
            className="flex-1 rounded-lg bg-destructive py-2 text-sm font-semibold text-white hover:bg-destructive/90"
          >
            Yes, reset everything
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold hover:bg-accent"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => { triggerHaptic("medium"); setConfirming(true) }}
      className="flex w-full items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 p-4 hover:bg-destructive/10 transition-colors active:scale-[0.98]"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-destructive/10 p-2 text-destructive">
          <RefreshCw className="h-4 w-4" />
        </div>
        <div className="text-left">
          <div className="font-semibold text-destructive text-sm">Reset personalization</div>
          <div className="text-xs text-muted-foreground mt-0.5">Remove all follows and reset defaults</div>
        </div>
      </div>
    </button>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function PersonalizationPage() {
  const router = useRouter()
  const [favs,           setFavs]           = useState<Favourite[]>([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState<string | null>(null)
  const [calMode,        setCalMode]        = useState<CalendarMode>("my-calendar")
  const [locationEnabled, setLocationEnabled] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getFavourites()
      setFavs(data)
    } catch {
      setError("Could not load your preferences. Pull to retry.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    setCalMode(getSavedCalendarMode())
    setLocationEnabled(getSavedLocationConsent())
  }, [load])

  // Keep in sync when follow-button siblings change the cache
  useEffect(() => {
    window.addEventListener("sf:favourites-change", load)
    return () => window.removeEventListener("sf:favourites-change", load)
  }, [load])

  const handleRemove = useCallback((type: EntityType, id: string) => {
    setFavs((prev) => prev.filter((f) => !(f.entity_type === type && f.entity_id === id)))
  }, [])

  const handleReset = useCallback(async () => {
    // Remove all in parallel
    await Promise.allSettled(favs.map((f) => removeFavourite(f.entity_type, f.entity_id)))
    setFavs([])
    window.dispatchEvent(new CustomEvent("sf:favourites-change"))
  }, [favs])

  const teamFavs   = favs.filter((f) => f.entity_type === "team")
  const leagueFavs = favs.filter((f) => f.entity_type === "league")
  const playerFavs = favs.filter((f) => f.entity_type === "player")
  const venueFavs  = favs.filter((f) => f.entity_type === "venue")

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <HeaderMenu />

      <main className="flex-1 p-4 space-y-6">
        {/* Back + title */}
        <div>
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold">Personalization</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your followed teams, players, venues, and app preferences.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={load}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Followed teams */}
            <div>
              <SectionHeader icon={Star} title="Followed Teams" />
              <div className="rounded-xl border border-border bg-card p-4">
                {teamFavs.length === 0 ? (
                  <EmptyFollows label="teams" />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {teamFavs.map((f) => (
                      <FollowPill key={f.entity_id} fav={f} onRemove={handleRemove} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Followed competitions */}
            <div>
              <SectionHeader icon={Trophy} title="Followed Competitions" />
              <div className="rounded-xl border border-border bg-card p-4">
                {leagueFavs.length === 0 ? (
                  <EmptyFollows label="competitions" />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {leagueFavs.map((f) => (
                      <FollowPill key={f.entity_id} fav={f} onRemove={handleRemove} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Followed players */}
            <div>
              <SectionHeader icon={User} title="Followed Players" />
              <div className="rounded-xl border border-border bg-card p-4">
                {playerFavs.length === 0 ? (
                  <EmptyFollows label="players" />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {playerFavs.map((f) => (
                      <FollowPill key={f.entity_id} fav={f} onRemove={handleRemove} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Followed venues */}
            <div>
              <SectionHeader icon={MapPin} title="Followed Venues" />
              <div className="rounded-xl border border-border bg-card p-4">
                {venueFavs.length === 0 ? (
                  <EmptyFollows label="venues" />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {venueFavs.map((f) => (
                      <FollowPill key={f.entity_id} fav={f} onRemove={handleRemove} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Timezone */}
            <div>
              <SectionHeader icon={Globe} title="Timezone" />
              <div className="rounded-xl border border-border bg-card p-4">
                <TimezoneSelector />
              </div>
            </div>

            {/* Calendar mode */}
            <div>
              <SectionHeader icon={CalendarDays} title="Calendar Default" />
              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                {(
                  [
                    {
                      mode: "my-calendar" as CalendarMode,
                      label: "My Calendar",
                      desc: "Show only matches from teams, competitions, and players you follow",
                    },
                    {
                      mode: "all-fixtures" as CalendarMode,
                      label: "All Fixtures",
                      desc: "Show all upcoming fixtures from every sport",
                    },
                  ] as const
                ).map(({ mode, label, desc }) => {
                  const isActive = calMode === mode
                  return (
                    <button
                      key={mode}
                      onClick={() => {
                        triggerHaptic("selection")
                        setCalMode(mode)
                        saveCalendarMode(mode)
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        isActive
                          ? "border-primary/40 bg-primary/5"
                          : "border-transparent hover:bg-accent"
                      }`}
                    >
                      <CalendarDays
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isActive ? "text-primary" : ""}`}>
                          {label}
                        </p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      {isActive && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Location-based recommendations */}
            <div>
              <SectionHeader icon={MapPin} title="Location" />
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Location-based recommendations</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Use your location preference to improve nearby venue and event suggestions. This preference does not prompt for browser location permission — that happens separately when a location feature is first used.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={locationEnabled}
                    onClick={() => {
                      triggerHaptic("selection")
                      const next = !locationEnabled
                      setLocationEnabled(next)
                      setSavedLocationConsent(next)
                    }}
                    className={`relative mt-0.5 inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      locationEnabled ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        locationEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                    <span className="sr-only">
                      {locationEnabled ? "Disable" : "Enable"} location-based recommendations
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Home layout shortcut */}
            <div>
              <SectionHeader icon={LayoutDashboard} title="Home Layout" />
              <button
                onClick={() => router.push("/settings/home-layout")}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-accent transition-colors active:scale-[0.98]"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-sm">Home screen modules</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Reorder or hide cards on your home screen</div>
                  </div>
                </div>
                <ChevronLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
              </button>
            </div>

            {/* Reset */}
            <div>
              <SectionHeader icon={RefreshCw} title="Reset" />
              <ResetSection onReset={handleReset} />
            </div>

            {/*
             * IDENTITY & PERSISTENCE NOTES (staged TODOs for future sprint):
             *
             * Currently personalization is device-token scoped (anonymous-first).
             * A device UUID stored in localStorage is used as the DB key.
             *
             * Future work:
             * - When a user signs in, merge the device-token favourites into
             *   their user account (POST /api/favourites/merge?from=<device_token>).
             * - For signed-in users, replace x-device-token with a JWT so the
             *   backend can scope follows to the user account instead.
             * - On a new device sign-in, load server-side follows and populate
             *   the localStorage cache so the UX is immediately personalised.
             */}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
