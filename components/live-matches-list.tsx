"use client"

import { BadgePercent, ChevronRight, MapPin, RefreshCw, TrendingUp, Tv, Users } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef, useCallback, type MouseEvent } from "react"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { FixtureCardSkeleton } from "@/components/skeleton-loader"
import { SmartImage } from "@/components/assets/smart-image"
import { formatTimeWithTimezones, formatInPlayTime } from "@/lib/date-utils"
import type { LiveMatchRow } from "@/app/api/live/route"
import { PinScoreButton } from "@/components/pin-score-button"
import { AdInjection } from "@/components/ad-injection"
import { useLocation } from "@/components/location-provider"
import { VenueReasonBadges } from "@/components/venues/venue-reason-badges"
import type { VenueCard } from "@/types/venues"

const POLL_INTERVAL = 30_000
const LIVE_MATCHES_CACHE_KEY = "sf_live_matches_last_payload"
type GenderFilter = "all" | "men" | "women"

const WOMENS_MATCH_TERMS = [
  "women",
  "womens",
  "women's",
  "femenina",
  "femenino",
  "feminina",
  "feminino",
  "ladies",
  "female",
  "girls",
  "wfc",
  "nwsl",
  "wsl",
  "w-league",
  "fmc",
  "red angels",
  "sportstoto",
  "kspo",
  "boeun sangmu",
  "changnyeong",
  "gyeongju",
  "hwacheon",
  "seoul city",
]

function inferMatchGender(match: LiveMatchRow): Exclude<GenderFilter, "all"> {
  const text = `${match.homeTeam} ${match.awayTeam} ${match.league ?? ""}`.toLowerCase()
  const hasWomenSuffix = /\b[a-zÀ-ÿ.'-]+\s+w\b/i.test(`${match.homeTeam} ${match.awayTeam}`)
  return hasWomenSuffix || WOMENS_MATCH_TERMS.some((term) => text.includes(term)) ? "women" : "men"
}

/** Derive a display score string matching the home fixture card format ("1 - 0", "- - -"). */
function scoreDisplay(home: number | null, away: number | null): string {
  if (home == null && away == null) return "- - -"
  return `${home ?? "-"} - ${away ?? "-"}`
}

function formatMinute(minute: number | null): string {
  return minute == null ? "" : `${minute}'`
}

function formatEventChip(event: NonNullable<LiveMatchRow["liveDetails"]>["events"][number]): string {
  const marker = event.type === "goal" ? "G" : event.detail?.toLowerCase().includes("red") ? "R" : "Y"
  const minute = formatMinute(event.minute)
  const player = event.player ? event.player.split(" ").slice(-1)[0] : ""
  return [minute, marker, player].filter(Boolean).join(" ")
}

export function LiveMatchesList() {
  const [matches, setMatches] = useState<LiveMatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    try {
      const cached = localStorage.getItem(LIVE_MATCHES_CACHE_KEY)
      if (!cached) return
      const parsed = JSON.parse(cached)
      if (Array.isArray(parsed.matches) && parsed.matches.length > 0) {
        setMatches(parsed.matches)
        setLastUpdated(parsed.updatedAt ? new Date(parsed.updatedAt) : null)
        setLoading(false)
      }
    } catch {}
  }, [])

  const load = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    try {
      const res = await fetch("/api/live", { cache: "no-store" })
      if (res.ok) {
        const json = await res.json()
        const nextMatches = json.matches ?? []
        setMatches(nextMatches)
        try {
          localStorage.setItem(LIVE_MATCHES_CACHE_KEY, JSON.stringify({
            matches: nextMatches,
            updatedAt: new Date().toISOString(),
          }))
        } catch {}
      }
      setLastUpdated(new Date())
    } catch (err) {
      console.error("[LiveMatchesList] load error:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    intervalRef.current = setInterval(() => load(), POLL_INTERVAL)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [load])

  const handleRefresh = useCallback(async () => {
    triggerHaptic("light")
    await load(true)
  }, [load])

  const genderCounts = matches.reduce(
    (counts, match) => {
      const gender = inferMatchGender(match)
      counts[gender] += 1
      counts.all += 1
      return counts
    },
    { all: 0, men: 0, women: 0 } as Record<GenderFilter, number>,
  )

  const filteredMatches = matches.filter((match) => (
    genderFilter === "all" || inferMatchGender(match) === genderFilter
  ))

  const genderFilterOptions: Array<{ value: GenderFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "men", label: "Men" },
    { value: "women", label: "Women" },
  ]

  if (loading) {
    return (
      <div className="space-y-2.5 px-3 py-3">
        <FixtureCardSkeleton />
        <FixtureCardSkeleton />
        <FixtureCardSkeleton />
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
        <TrendingUp className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">No live matches right now</p>
        <p className="text-xs text-muted-foreground/60">Check back soon or pull to refresh</p>
        <button
          onClick={handleRefresh}
          className="mt-1 flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground active:scale-95 transition-transform"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2 pr-1">
          <div className="inline-flex rounded-full border border-border bg-card p-0.5 shadow-sm">
            {genderFilterOptions.map((option) => {
              const active = genderFilter === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    triggerHaptic("light")
                    setGenderFilter(option.value)
                  }}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-pressed={active}
                >
                  {option.label} <span className="opacity-70">{genderCounts[option.value]}</span>
                </button>
              )
            })}
          </div>
          {lastUpdated && (
            <p className="shrink-0 text-[10px] text-muted-foreground/50">
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        {filteredMatches.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm font-semibold text-foreground">
              No {genderFilter === "women" ? "women's" : "men's"} live matches right now
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Switch back to All or pull to refresh.</p>
          </div>
        ) : (
          filteredMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))
        )}
      </div>
    </PullToRefresh>
  )
}

function MatchCard({ match }: { match: LiveMatchRow }) {
  const { location, requestLocation } = useLocation()
  const [expanded, setExpanded] = useState(false)
  const [loadingGuide, setLoadingGuide] = useState(false)
  const [channels, setChannels] = useState<Array<{ id: string; channel: string; channelLogo?: string | null; country?: string | null }>>([])
  const [venues, setVenues] = useState<VenueCard[]>([])
  const inPlay = formatInPlayTime(match.progress)
  const liveEvents = match.liveDetails?.events ?? []
  const visibleEvents = liveEvents.slice(-3)
  const possession = match.liveDetails?.possession
  const hasPossession = possession?.home != null && possession?.away != null

  const timeData =
    match.dateEvent && match.strTime
      ? formatTimeWithTimezones(match.dateEvent, match.strTime)
      : null

  const statusDotClass = inPlay.isLive
    ? "bg-green-500"
    : inPlay.isFinished
    ? "bg-destructive"
    : "bg-muted-foreground/50"

  const statusTextClass = inPlay.isLive
    ? "text-green-500"
    : inPlay.isFinished
    ? "text-destructive"
    : "text-muted-foreground"

  const loadGuide = useCallback(async () => {
    setLoadingGuide(true)
    try {
      const tvRes = await fetch(`/api/tv/event/${match.id}`, { cache: "no-store" })
      const tvJson = tvRes.ok ? await tvRes.json() : { data: [] }
      let nextChannels = Array.isArray(tvJson?.data) ? tvJson.data : []

      if (nextChannels.length === 0 && match.dateEvent) {
        const dayRes = await fetch(`/api/tv?date=${encodeURIComponent(match.dateEvent)}`, { cache: "no-store" })
        const dayJson = dayRes.ok ? await dayRes.json() : { data: [] }
        const rows = Array.isArray(dayJson?.data) ? dayJson.data : []
        const home = match.homeTeam.toLowerCase()
        const away = match.awayTeam.toLowerCase()
        const matched = rows.find((row: any) => {
          const text = [
            row.event,
            row.strEvent,
            row.homeTeam,
            row.awayTeam,
            row.strHomeTeam,
            row.strAwayTeam,
          ].filter(Boolean).join(" ").toLowerCase()
          return text.includes(home) && text.includes(away)
        })
        nextChannels = (matched?.channels || []).map((channel: string) => ({
          id: channel,
          channel,
          channelLogo: null,
          country: null,
        }))
      }

      setChannels(nextChannels)

      const venueParams = new URLSearchParams({
        eventId: String(match.id),
        maxDistanceKm: "50",
      })
      if (location?.latitude != null && location?.longitude != null) {
        venueParams.set("lat", String(location.latitude))
        venueParams.set("lng", String(location.longitude))
      }
      const venueRes = await fetch(`/api/venues/discovery?${venueParams}`, { cache: "no-store" })
      const venueJson = venueRes.ok ? await venueRes.json() : null
      const items = venueJson?.data?.items || venueJson?.items || []
      setVenues(Array.isArray(items) ? items.slice(0, 3) : [])
    } finally {
      setLoadingGuide(false)
    }
  }, [location?.latitude, location?.longitude, match.awayTeam, match.dateEvent, match.homeTeam, match.id])

  const toggleGuide = async (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    triggerHaptic("light")
    const nextExpanded = !expanded
    setExpanded(nextExpanded)
    if (nextExpanded && channels.length === 0 && venues.length === 0) {
      await loadGuide()
    }
  }

  return (
    <div>
      <Link href={`/match/${match.id}`} onClick={() => triggerHaptic("light")}>
        <div
          className={`rounded-xl border bg-card p-3 shadow-sm transition-all hover:border-primary hover:shadow-md active:scale-[0.98] ${
            inPlay.isLive ? "border-green-500/40" : "border-border"
          }`}
        >
        {/* Teams row */}
        <div className="flex items-center justify-between gap-2">
          {/* Home team */}
          <div className="flex flex-1 items-center gap-2.5">
            <SmartImage
              kind="team_badge"
              src={match.homeLogo}
              fallbackLabel={match.homeTeam}
              alt={match.homeTeam}
              className="h-8 w-8 object-contain"
            />
            <p className="flex-1 text-sm font-medium leading-tight">{match.homeTeam}</p>
          </div>

          {/* Score + status */}
          <div className="relative flex min-w-[70px] flex-col items-center px-2 text-center">
            <p className="font-mono text-base font-bold text-foreground">
              {scoreDisplay(match.homeScore, match.awayScore)}
            </p>
            <div className="flex items-center gap-1">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusDotClass}`} />
              <span className={`text-[10px] font-semibold uppercase ${statusTextClass}`}>
                {inPlay.display}
              </span>
            </div>
            {visibleEvents.length > 0 && (
              <div className="mt-0.5 flex max-w-[128px] items-center justify-center gap-1 overflow-hidden">
                {visibleEvents.map((event) => (
                  <span
                    key={event.id}
                    className={`truncate rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none ${
                      event.type === "goal"
                        ? "bg-green-500/10 text-green-700 dark:text-green-300"
                        : event.detail?.toLowerCase().includes("red")
                        ? "bg-destructive/10 text-destructive"
                        : "bg-yellow-400/20 text-yellow-700 dark:text-yellow-300"
                    }`}
                    title={[event.minute != null ? `${event.minute}'` : "", event.detail, event.player].filter(Boolean).join(" ")}
                  >
                    {formatEventChip(event)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Away team */}
          <div className="flex flex-1 items-center justify-end gap-2.5">
            <p className="flex-1 text-right text-sm font-medium leading-tight">{match.awayTeam}</p>
            <SmartImage
              kind="team_badge"
              src={match.awayLogo}
              fallbackLabel={match.awayTeam}
              alt={match.awayTeam}
              className="h-8 w-8 object-contain"
            />
          </div>
        </div>

        {/* Footer row: time + TV Guide button */}
        <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2.5 text-xs">
          <div className="flex flex-col">
            {timeData?.isValid ? (
              <>
                <span className="font-medium text-foreground">{timeData.localFull}</span>
                {timeData.showBoth && (
                  <span className="text-[10px] text-muted-foreground">{timeData.uk} UK</span>
                )}
              </>
            ) : (
              <span className="font-medium text-foreground">Time TBD</span>
            )}
          </div>
          <div className="mx-2 flex min-w-[76px] max-w-[130px] flex-1 flex-col items-center">
            {hasPossession && (
              <>
                <div className="flex w-full items-center justify-between text-[9px] font-bold text-muted-foreground">
                  <span>{possession.home}%</span>
                  <span>POS</span>
                  <span>{possession.away}%</span>
                </div>
                <div className="mt-0.5 flex h-1 w-full overflow-hidden rounded-full bg-muted">
                  <span className="bg-primary" style={{ width: `${possession.home ?? 50}%` }} />
                  <span className="bg-muted-foreground/30" style={{ width: `${possession.away ?? 50}%` }} />
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={toggleGuide}
            className="flex items-center gap-1.5 rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <span>TV Guide</span>
            <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </button>
          <PinScoreButton
            compact
            score={{
              id: String(match.id),
              home: match.homeTeam,
              away: match.awayTeam,
              homeLogo: match.homeLogo || undefined,
              awayLogo: match.awayLogo || undefined,
              score: scoreDisplay(match.homeScore, match.awayScore),
              status: inPlay.display,
              isLive: inPlay.isLive,
              startsAt: match.dateEvent && match.strTime ? `${match.dateEvent}T${match.strTime}` : undefined,
            }}
          />
        </div>
      </div>
    </Link>

    {expanded && (
      <div className="mt-1 rounded-xl border border-border bg-card/80 p-3 shadow-sm">
        {loadingGuide ? (
          <div className="flex items-center gap-2 py-3 text-xs text-muted-foreground">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Loading TV, venues and offers...
          </div>
        ) : (
          <div className="space-y-3">
            <section>
              <div className="mb-2 flex items-center gap-2">
                <Tv className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-black">Broadcast & streaming</h3>
              </div>
              {channels.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {channels.map((channel) => (
                    <div key={channel.id} className="flex items-center gap-2 rounded-lg border border-border bg-background p-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10">
                        {channel.channelLogo ? (
                          <img src={channel.channelLogo} alt="" className="h-6 w-6 object-contain" />
                        ) : (
                          <span className="text-[10px] font-black text-primary">{channel.channel.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">{channel.channel}</p>
                        {channel.country && <p className="text-[10px] text-muted-foreground">{channel.country}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
                  No confirmed TV listing yet. We will keep checking as listings update.
                </div>
              )}
            </section>

            <AdInjection placement="tv" index={Number(match.id.slice(-1)) || 0} />

            <section>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-black">Smart places to watch</h3>
                </div>
                {!location && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      requestLocation()
                    }}
                    className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary"
                  >
                    Use location
                  </button>
                )}
              </div>
              {venues.length > 0 ? (
                <div className="space-y-2">
                  {venues.map((venue) => (
                    <Link
                      key={venue.id}
                      href={`/venues/${venue.slug || venue.id}`}
                      className="block rounded-lg border border-border bg-background p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{venue.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {venue.distanceKm != null ? `${venue.distanceKm.toFixed(1)}km away` : venue.area || venue.city || "Venue"}
                            {venue.openNow ? " · Open now" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {(venue.screenCount ?? 0) > 0 && <span>{venue.screenCount} screens</span>}
                          {(venue.checkedInCount ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{venue.checkedInCount}</span>
                          )}
                          {(venue.offerCount ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 text-primary"><BadgePercent className="h-3 w-3" />Offer</span>
                          )}
                        </div>
                      </div>
                      <VenueReasonBadges reasons={venue.reasons || []} max={3} />
                    </Link>
                  ))}
                  <Link href={`/venues?eventId=${match.id}`} className="block text-center text-xs font-bold text-primary">
                    See more places showing this match
                  </Link>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
                  No matched venues yet. Nearby sports bars and sponsored offers will appear here when Strapi has a match.
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    )}
    </div>
  )
}
