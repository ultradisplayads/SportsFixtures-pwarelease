"use client"

import { Star, ChevronUp, ChevronRight, MapPin, Navigation, Target } from "lucide-react"
import Image from "next/image"
import { SmartImage } from "@/components/assets/smart-image"
import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"
import { getNextEvents, getPastEvents, type Event } from "@/app/actions/sports-api"
import { getMatchStatus } from "@/lib/match-utils"
import type { SFTVEvent } from "@/lib/sf-api"
import { FixtureCardSkeleton, LeagueHeaderSkeleton } from "@/components/skeleton-loader"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { AdInjection, AdInjectionRow } from "@/components/ad-injection"
import { parseSportsDate, formatTimeWithTimezones, formatInPlayTime } from "@/lib/date-utils"
import { pwaManager, useOnlineStatus } from "@/lib/pwa-manager"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { useFixturesFilter } from "@/lib/fixtures-filter-context"
import { getCachedFavourites } from "@/lib/favourites-api"
import { coloursForTeam, dispatchGoalCelebration, type GoalCelebrationMood } from "@/lib/goal-celebration"
import { MatchPrediction } from "@/components/match-prediction"
import { gamificationManager } from "@/lib/gamification-manager"
import { PinScoreButton } from "@/components/pin-score-button"

const POPULAR_LEAGUE_IDS = [
  "4330", // Scottish Premiership (Celtic FC) — always first
  "4328", // Premier League
  "4480", // UEFA Champions League
  "4335", // La Liga
  "4331", // Bundesliga
  "4332", // Serie A
  "4334", // Ligue 1
  "4346", // Thai League 1
  "4347", // Thai League 2
]

interface GroupedFixtures {
  league: string
  leagueLogo: string
  leagueId: string
  date: string
  time: string
  matches: {
    id: string
    home: string
    homeLogo: string
    homeId: string
    away: string
    awayLogo: string
    awayId: string
    score: string
    homeScore: number | null
    awayScore: number | null
    matchTime: string
    dateRaw: string
    tv: string
    status: string
    progress: string
    isLive: boolean
    isFinished: boolean
  }[]
}

export function FixturesList() {
  const { activeLeagueIds, nearbyFilter } = useFixturesFilter()
  const [fixtures, setFixtures] = useState<GroupedFixtures[]>([])
  const [pastFixtures, setPastFixtures] = useState<GroupedFixtures[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [leagueIndex, setLeagueIndex] = useState(0)
  const [collapsedLeagues, setCollapsedLeagues] = useState<Set<string>>(new Set())
  const [allCollapsed, setAllCollapsed] = useState(false)
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set())
  const [expandedPredictions, setExpandedPredictions] = useState<Set<string>>(new Set())
  const [predictedMatchIds, setPredictedMatchIds] = useState<Set<string>>(new Set())
  const [tvChannelsMap, setTvChannelsMap] = useState<Record<string, SFTVEvent[]>>({})
  const observerRef = useRef<HTMLDivElement>(null)
  const initialLoadRef = useRef(false)
  const scoreSnapshotRef = useRef<Map<string, { home: number | null; away: number | null }>>(new Map())
  const isOnline = useOnlineStatus()

  useEffect(() => {
    const refresh = () => setPredictedMatchIds(new Set(Object.keys(gamificationManager.getPredictions())))
    refresh()
    window.addEventListener("sf:gamification:update", refresh)
    return () => window.removeEventListener("sf:gamification:update", refresh)
  }, [])

  // Reload fixtures whenever the active league filter changes
  useEffect(() => {
    loadInitialFixtures(activeLeagueIds)
  }, [activeLeagueIds.join(",")])

  useEffect(() => {
    const previous = scoreSnapshotRef.current
    const next = new Map<string, { home: number | null; away: number | null }>()
    const favouriteTeamIds = new Set(
      getCachedFavourites()
        .filter((fav) => fav.entity_type === "team")
        .map((fav) => String(fav.entity_id)),
    )

    for (const group of fixtures) {
      for (const match of group.matches) {
        next.set(match.id, { home: match.homeScore, away: match.awayScore })

        const old = previous.get(match.id)
        if (!old || match.homeScore == null || match.awayScore == null) continue

        const homeScored = old.home != null && match.homeScore > old.home
        const awayScored = old.away != null && match.awayScore > old.away
        if (!homeScored && !awayScored) continue

        const scoringHome = homeScored
        const scoringTeam = scoringHome ? match.home : match.away
        const scoringTeamId = scoringHome ? match.homeId : match.awayId
        const opponentTeam = scoringHome ? match.away : match.home
        const opponentTeamId = scoringHome ? match.awayId : match.homeId
        const [primaryColor, secondaryColor] = coloursForTeam(scoringTeam)
        const mood: GoalCelebrationMood = favouriteTeamIds.has(scoringTeamId)
          ? "for"
          : favouriteTeamIds.has(opponentTeamId)
          ? "against"
          : "neutral"

        dispatchGoalCelebration({
          matchId: match.id,
          teamName: scoringTeam,
          opponentName: opponentTeam,
          homeTeam: match.home,
          awayTeam: match.away,
          score: `${match.homeScore} - ${match.awayScore}`,
          mood,
          primaryColor,
          secondaryColor,
        })
      }
    }

    scoreSnapshotRef.current = next
  }, [fixtures])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !initialLoadRef.current) {
          loadMoreFixtures(activeLeagueIds)
        }
      },
      { threshold: 0.1 },
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [loadingMore, hasMore, leagueIndex, activeLeagueIds])

  const loadInitialFixtures = async (leagueIds: string[]) => {
    initialLoadRef.current = true
    const cacheScope = leagueIds.join(",") || "default"
    const cached = pwaManager.getCachedFixtures(cacheScope)

    setLoading(!cached?.length)
    if (cached?.length) {
      setFixtures(cached)
    } else {
      setFixtures([])
    }
    setPastFixtures([])
    setLeagueIndex(0)
    setHasMore(true)

    try {
      if (!isOnline) {
        if (cached && cached.length > 0) {
          setLoading(false)
          return
        }
      }

      const allFixtures: GroupedFixtures[] = []
      const allPastFixtures: GroupedFixtures[] = []
      const initialBatch = leagueIds.slice(0, 3)

      for (const leagueId of initialBatch) {
        const [events, pastEvents] = await Promise.all([
          getNextEvents(leagueId),
          getPastEvents(leagueId),
        ])
        if (events.length > 0) {
          allFixtures.push(...groupEventsByLeague(events))
        }
        if (pastEvents.length > 0) {
          allPastFixtures.push(...groupEventsByLeague(pastEvents, "past"))
        }
      }

      setPastFixtures(allPastFixtures)
      setFixtures(allFixtures)
      setLeagueIndex(3)
      setLoading(false)

      if (allFixtures.length > 0) {
        pwaManager.cacheFixtures(allFixtures, cacheScope)
      }
    } finally {
      initialLoadRef.current = false
    }
  }

  const loadMoreFixtures = async (leagueIds: string[]) => {
    if (loadingMore || leagueIndex >= leagueIds.length) {
      setHasMore(false)
      return
    }

    setLoadingMore(true)
    const leagueId = leagueIds[leagueIndex]
    const events = await getNextEvents(leagueId)

    if (events.length > 0) {
      const cacheScope = leagueIds.join(",") || "default"
      setFixtures((prev) => {
        const next = [...prev, ...groupEventsByLeague(events)]
        pwaManager.cacheFixtures(next, cacheScope)
        return next
      })
    }

    setLeagueIndex((prev) => prev + 1)
    setLoadingMore(false)

    if (leagueIndex + 1 >= leagueIds.length) {
      setHasMore(false)
    }
  }

  const groupEventsByLeague = (events: Event[], phase: "past" | "upcoming" = "upcoming"): GroupedFixtures[] => {
    if (events.length === 0) return []

    const firstEvent = events[0]

    const parsedDate = parseSportsDate(firstEvent.dateEvent)

    const sourceEvents = phase === "past" ? [...events].slice(0, 5).reverse() : events.slice(0, 5)
    const matches = sourceEvents.map((event) => {
      const progress = event.strProgress || event.strStatus || "NS"
      const inPlay = formatInPlayTime(progress)
      const homeScore = event.intHomeScore !== null ? Number(event.intHomeScore) : null
      const awayScore = event.intAwayScore !== null ? Number(event.intAwayScore) : null
      const hasScore = homeScore !== null && awayScore !== null
      return {
        id: event.idEvent,
        home: event.strHomeTeam,
        homeLogo: event.strHomeTeamBadge || "",
        homeId: event.idHomeTeam,
        away: event.strAwayTeam,
        awayLogo: event.strAwayTeamBadge || "",
        awayId: event.idAwayTeam,
        score: hasScore ? `${event.intHomeScore} – ${event.intAwayScore}` : "- – -",
        homeScore: Number.isFinite(homeScore) ? homeScore : null,
        awayScore: Number.isFinite(awayScore) ? awayScore : null,
        matchTime: event.strTime || "TBD",
        dateRaw: event.dateEvent || "",
        tv: "TV Guide",
        status: phase === "past" && inPlay.display === "NS" ? "FT" : inPlay.display,
        progress,
        isLive: inPlay.isLive,
        isFinished: phase === "past" || inPlay.isFinished,
      }
    })

    return [
      {
        league: firstEvent.strLeague,
        leagueLogo: firstEvent.strLeagueBadge || "",
        leagueId: firstEvent.idLeague,
        date: parsedDate.formatted,
        time: firstEvent.strTime || "",
        matches,
      },
    ]
  }

  const handleCardClick = () => {
    triggerHaptic("light")
  }

  const toggleLeagueCollapse = (leagueKey: string) => {
    triggerHaptic("selection")
    const newCollapsed = new Set(collapsedLeagues)
    if (newCollapsed.has(leagueKey)) {
      newCollapsed.delete(leagueKey)
    } else {
      newCollapsed.add(leagueKey)
    }
    setCollapsedLeagues(newCollapsed)
    setAllCollapsed(newCollapsed.size === fixtures.length)
  }

  const toggleAllLeagues = () => {
    triggerHaptic("medium")
    if (allCollapsed) {
      setCollapsedLeagues(new Set())
      setAllCollapsed(false)
    } else {
      const allKeys = fixtures.map((_, idx) => `${fixtures[idx].leagueId}-${idx}`)
      setCollapsedLeagues(new Set(allKeys))
      setAllCollapsed(true)
    }
  }

  const toggleChannels = async (matchId: string) => {
    triggerHaptic("selection")
    const newExpanded = new Set(expandedChannels)
    if (newExpanded.has(matchId)) {
      newExpanded.delete(matchId)
    } else {
      newExpanded.add(matchId)
      if (!tvChannelsMap[matchId]) {
        const res = await fetch(`/api/tv/event/${matchId}`, { cache: "no-store" })
        const json = res.ok ? await res.json() : { data: [] }
        const channels = Array.isArray(json?.data) ? json.data : []
        setTvChannelsMap((prev) => ({ ...prev, [matchId]: channels }))
      }
    }
    setExpandedChannels(newExpanded)
  }

  const togglePrediction = (matchId: string) => {
    triggerHaptic("selection")
    setExpandedPredictions((prev) => {
      const next = new Set(prev)
      if (next.has(matchId)) next.delete(matchId)
      else next.add(matchId)
      return next
    })
  }

  const getTvChannels = (matchId: string): SFTVEvent[] => {
    return tvChannelsMap[matchId] || []
  }

  const formatMatchTime = (matchTime: string, dateString: string) => {
    // dateString here is the raw YYYY-MM-DD from the API (UTC date)
    return formatTimeWithTimezones(dateString, matchTime)
  }

  const buildVenueHref = (match: GroupedFixtures["matches"][number], league: string) => {
    const query = [match.home, match.away, league].filter(Boolean).join(" ")
    return `/venues?search=${encodeURIComponent(query)}`
  }

  const buildTvHref = (match: GroupedFixtures["matches"][number]) => {
    const params = new URLSearchParams()
    if (match.dateRaw) params.set("date", match.dateRaw)
    params.set("q", `${match.home} ${match.away}`)
    return `/tv?${params}`
  }

  const handleRefresh = useCallback(async () => {
    await loadInitialFixtures(activeLeagueIds)
  }, [activeLeagueIds])

  const renderFixtureGroup = (fixtureGroup: GroupedFixtures, groupIndex: number, variant: "past" | "upcoming") => {
    const leagueKey = `${variant}-${fixtureGroup.leagueId}-${groupIndex}`
    const isCollapsed = collapsedLeagues.has(leagueKey)

    return (
      <div key={leagueKey} className="mb-4">
        <AdInjectionRow groupIndex={groupIndex} every={6} placement="fixtures" />

        <button
          onClick={() => toggleLeagueCollapse(leagueKey)}
          className="mb-2.5 flex w-full items-center gap-2 px-1 text-left transition-opacity hover:opacity-70"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-sm font-bold">{isCollapsed ? "+" : "−"}</span>
          </div>
          <SmartImage
            kind="competition_logo"
            src={fixtureGroup.leagueLogo}
            fallbackLabel={fixtureGroup.league}
            alt={fixtureGroup.league}
            className="h-5 w-5 rounded-full object-contain"
          />
          <h2 className="text-sm font-semibold">{fixtureGroup.league}</h2>
          <ChevronUp className={`ml-auto h-4 w-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
        </button>

        {!isCollapsed && (
          <>
            {fixtureGroup.date && (
              <div className="mb-2.5 flex items-center justify-between px-1 text-xs text-muted-foreground">
                <span>{fixtureGroup.date}</span>
                <Star className="h-4 w-4" />
              </div>
            )}

            <div className="space-y-2.5">
              {fixtureGroup.matches.map((match) => {
                const isChannelsExpanded = expandedChannels.has(match.id)
                const tvChannels = getTvChannels(match.id)
                const timeData = formatMatchTime(match.matchTime, match.dateRaw || fixtureGroup.date)
                const inPlay = formatInPlayTime(match.progress)
                const isFinished = variant === "past" || inPlay.isFinished

                const statusDotClass = inPlay.isLive
                  ? "bg-green-500"
                  : isFinished
                  ? "bg-destructive"
                  : "bg-muted-foreground/50"

                const statusTextClass = inPlay.isLive
                  ? "text-green-500"
                  : isFinished
                  ? "text-destructive"
                  : "text-muted-foreground"

                return (
                  <div key={match.id}>
                    <Link href={`/match/${match.id}`} onClick={handleCardClick}>
                      <div className={`rounded-xl border bg-card p-3 shadow-sm transition-all hover:border-primary hover:shadow-md active:scale-[0.98] ${
                        inPlay.isLive ? "border-green-500/40" : "border-border"
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-1 items-center gap-2.5">
                            <SmartImage kind="team_badge" src={match.homeLogo} fallbackLabel={match.home} alt={match.home} className="h-8 w-8 object-contain" />
                            <p className="flex-1 text-sm font-medium leading-tight">{match.home}</p>
                          </div>

                          <div className="relative flex min-w-[70px] flex-col items-center px-2 text-center">
                            <p className="font-mono text-base font-bold text-foreground">{match.score}</p>
                            <div className="flex items-center gap-1">
                              <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusDotClass}`} />
                              <span className={`text-[10px] font-semibold uppercase ${statusTextClass}`}>
                                {isFinished && !inPlay.isLive ? "FT" : inPlay.display}
                              </span>
                            </div>
                            <span data-quirk-zone="score" aria-hidden="true" className="pointer-events-none absolute inset-0" />
                          </div>

                          <div className="flex flex-1 items-center gap-2.5">
                            <p className="flex-1 text-right text-sm font-medium leading-tight">{match.away}</p>
                            <SmartImage kind="team_badge" src={match.awayLogo} fallbackLabel={match.away} alt={match.away} className="h-8 w-8 object-contain" />
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2.5 text-xs">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {timeData.isValid ? timeData.localFull : "Time TBD"}
                            </span>
                            {timeData.showBoth && timeData.isValid && (
                              <span className="text-[10px] text-muted-foreground">{timeData.uk} UK</span>
                            )}
                          </div>
                          <span data-quirk-zone="row-right" aria-hidden="true" className="pointer-events-none flex-1 self-stretch mx-2" />
                          <div className="flex items-center gap-1.5">
                            <PinScoreButton
                              compact
                              score={{
                                id: match.id,
                                home: match.home,
                                away: match.away,
                                homeLogo: match.homeLogo,
                                awayLogo: match.awayLogo,
                                score: match.score,
                                status: isFinished && !inPlay.isLive ? "FT" : inPlay.display,
                                isLive: inPlay.isLive,
                                startsAt: match.dateRaw && match.matchTime ? `${match.dateRaw}T${match.matchTime}` : undefined,
                              }}
                            />
                            {!isFinished && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  togglePrediction(match.id)
                                }}
                                className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
                                  predictedMatchIds.has(match.id)
                                    ? "bg-green-500 text-white"
                                    : "bg-primary/10 text-primary hover:bg-primary/20"
                                }`}
                                aria-label={`Predict ${match.home} vs ${match.away}`}
                                type="button"
                              >
                                <Target className="h-3 w-3" />
                                Pick
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                toggleChannels(match.id)
                              }}
                              className="flex items-center gap-1.5 rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                              type="button"
                            >
                              <span>{tvChannels.length > 0 ? `TV: ${tvChannels.length}` : "TV Guide"}</span>
                              <ChevronRight className={`h-3 w-3 transition-transform ${isChannelsExpanded ? "rotate-90" : ""}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Link>

                    {expandedPredictions.has(match.id) && !isFinished && (
                      <div className="mt-1">
                        <MatchPrediction
                          matchId={match.id}
                          homeTeam={match.home}
                          awayTeam={match.away}
                          homeLogo={match.homeLogo}
                          awayLogo={match.awayLogo}
                        />
                      </div>
                    )}

                    {isChannelsExpanded && (
                      <div className="mt-1 rounded-lg border border-border bg-card/50 p-2">
                        {tvChannels.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {tvChannels.map((channel, idx) => (
                              <div key={idx} className="flex items-center gap-2 rounded-md bg-card p-2 shadow-sm">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10">
                                  {channel.channelLogo ? (
                                    <img src={channel.channelLogo} alt="" className="h-6 w-6 object-contain" />
                                  ) : (
                                    <span className="text-[10px] font-bold text-primary">{channel.channel?.substring(0, 2) || "TV"}</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-semibold leading-tight truncate">{channel.channel}</p>
                                  <p className="text-[9px] text-muted-foreground">{channel.country || channel.countryCode}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              {isFinished ? "Match finished - highlights may be available" : "No TV listing in your region yet"}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              {isFinished ? (
                                <Link
                                  href={`/match/${match.id}?tab=videos`}
                                  className="rounded-md bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground"
                                >
                                  Match highlights
                                </Link>
                              ) : (
                                <Link
                                  href={buildVenueHref(match, fixtureGroup.league)}
                                  className="rounded-md bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground"
                                >
                                  Find venues showing it
                                </Link>
                              )}
                              <Link href={buildTvHref(match)} className="text-xs font-medium text-primary hover:underline">
                                Full TV Guide →
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-secondary/20 px-3 py-3">
        <LeagueHeaderSkeleton />
        <div className="space-y-2.5">
          <FixtureCardSkeleton />
          <FixtureCardSkeleton />
        </div>
        <LeagueHeaderSkeleton />
        <div className="space-y-2.5">
          <FixtureCardSkeleton />
          <FixtureCardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="flex-1 overflow-y-auto bg-secondary/20 px-3 py-3" data-section="fixtures">
        <AdInjection placement="fixtures" index={0} className="mb-2" />

        {nearbyFilter && (
          <div className="mb-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Fixtures within {nearbyFilter.radius}&nbsp;km</p>
                <p className="text-xs text-muted-foreground">Match data has no geo-coordinates — showing all fixtures. Find venues near you instead.</p>
              </div>
              <Link
                href="/venues"
                className="shrink-0 flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
              >
                <Navigation className="h-3 w-3" />
                Venues
              </Link>
            </div>
          </div>
        )}



        {fixtures.length > 0 && (
          <div className="mb-4 flex justify-center">
            <button
              onClick={toggleAllLeagues}
              className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium shadow-sm transition-all hover:bg-accent active:scale-95"
            >
              <div className="flex h-5 w-5 items-center justify-center">
                <div className="h-3 w-3 border-b-2 border-l-2 border-foreground"></div>
                <div className="h-3 w-3 border-b-2 border-r-2 border-foreground"></div>
              </div>
              {allCollapsed ? "Show all" : "Hide all"}
              <ChevronUp className={`h-4 w-4 transition-transform ${allCollapsed ? "rotate-180" : ""}`} />
            </button>
          </div>
        )}

        {pastFixtures.length > 0 && (
          <section aria-label="Previous results" className="mb-5">
            <div className="sticky top-0 z-10 -mx-3 mb-3 border-y border-border bg-background/95 px-3 py-2 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Previous Results</p>
            </div>
            {pastFixtures.map((fixtureGroup, groupIndex) => renderFixtureGroup(fixtureGroup, groupIndex, "past"))}
          </section>
        )}

        <section aria-label="Live and upcoming fixtures" id="live-upcoming">
          <div className="sticky top-0 z-10 -mx-3 mb-3 border-y border-border bg-background/95 px-3 py-2 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Live &amp; Upcoming</p>
          </div>
        {fixtures.map((fixtureGroup, groupIndex) => {
          const leagueKey = `${fixtureGroup.leagueId}-${groupIndex}`
          const isCollapsed = collapsedLeagues.has(leagueKey)

          return (
            <div key={leagueKey} className="mb-4">
              <AdInjectionRow groupIndex={groupIndex} every={6} placement="fixtures" />

              <button
                onClick={() => toggleLeagueCollapse(leagueKey)}
                className="mb-2.5 flex w-full items-center gap-2 px-1 text-left transition-opacity hover:opacity-70"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="text-sm font-bold">{isCollapsed ? "+" : "−"}</span>
                </div>
                <SmartImage
                  kind="competition_logo"
                  src={fixtureGroup.leagueLogo}
                  fallbackLabel={fixtureGroup.league}
                  alt={fixtureGroup.league}
                  className="h-5 w-5 rounded-full object-contain"
                />
                <h2 className="text-sm font-semibold">{fixtureGroup.league}</h2>
                <ChevronUp className={`ml-auto h-4 w-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
              </button>

              {!isCollapsed && (
                <>
                  {fixtureGroup.date && (
                    <div className="mb-2.5 flex items-center justify-between px-1 text-xs text-muted-foreground">
                      <span>{fixtureGroup.date}</span>
                      <Star className="h-4 w-4" />
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {fixtureGroup.matches.map((match) => {
                      const isChannelsExpanded = expandedChannels.has(match.id)
                      const tvChannels = getTvChannels(match.id)
                      const timeData = formatMatchTime(match.matchTime, match.dateRaw || fixtureGroup.date)
                      const inPlay = formatInPlayTime(match.progress)

                      // Status indicator colour
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

                      return (
                        <div key={match.id}>
                          <Link href={`/match/${match.id}`} onClick={handleCardClick}>
                            <div className={`rounded-xl border bg-card p-3 shadow-sm transition-all hover:border-primary hover:shadow-md active:scale-[0.98] ${
                              inPlay.isLive ? "border-green-500/40" : "border-border"
                            }`}>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex flex-1 items-center gap-2.5">
                                  <SmartImage
                                    kind="team_badge"
                                    src={match.homeLogo}
                                    fallbackLabel={match.home}
                                    alt={match.home}
                                    className="h-8 w-8 object-contain"
                                  />
                                  <p className="flex-1 text-sm font-medium leading-tight">{match.home}</p>
                                </div>

                                <div className="relative flex min-w-[70px] flex-col items-center px-2 text-center">
                                  <p className="font-mono text-base font-bold text-foreground">{match.score}</p>
                                  <div className="flex items-center gap-1">
                                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusDotClass}`} />
                                    <span className={`text-[10px] font-semibold uppercase ${statusTextClass}`}>
                                      {inPlay.display}
                                    </span>
                                  </div>
                                  {/* Quirk blank-zone anchor — invisible, sits in score column */}
                                  <span
                                    data-quirk-zone="score"
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-0"
                                  />
                                </div>

                                <div className="flex flex-1 items-center gap-2.5">
                                  <p className="flex-1 text-right text-sm font-medium leading-tight">{match.away}</p>
                                  <SmartImage
                                    kind="team_badge"
                                    src={match.awayLogo}
                                    fallbackLabel={match.away}
                                    alt={match.away}
                                    className="h-8 w-8 object-contain"
                                  />
                                </div>
                              </div>

                              <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2.5 text-xs">
                                <div className="flex flex-col">
                                  <span className="font-medium text-foreground">
                                    {timeData.isValid ? timeData.localFull : "Time TBD"}
                                  </span>
                                  {timeData.showBoth && timeData.isValid && (
                                    <span className="text-[10px] text-muted-foreground">{timeData.uk} UK</span>
                                  )}
                                </div>
                                {/* Quirk blank-zone anchor — the gap between time and TV btn */}
                                <span
                                  data-quirk-zone="row-right"
                                  aria-hidden="true"
                                  className="pointer-events-none flex-1 self-stretch mx-2"
                                />
                                <div className="flex items-center gap-1.5">
                                  <PinScoreButton
                                    compact
                                    score={{
                                      id: match.id,
                                      home: match.home,
                                      away: match.away,
                                      homeLogo: match.homeLogo,
                                      awayLogo: match.awayLogo,
                                      score: match.score,
                                      status: inPlay.isFinished ? "FT" : inPlay.display,
                                      isLive: inPlay.isLive,
                                      startsAt: match.dateRaw && match.matchTime ? `${match.dateRaw}T${match.matchTime}` : undefined,
                                    }}
                                  />
                                  {!inPlay.isFinished && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault()
                                        togglePrediction(match.id)
                                      }}
                                      className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
                                        predictedMatchIds.has(match.id)
                                          ? "bg-green-500 text-white"
                                          : "bg-primary/10 text-primary hover:bg-primary/20"
                                      }`}
                                      aria-label={`Predict ${match.home} vs ${match.away}`}
                                      type="button"
                                    >
                                      <Target className="h-3 w-3" />
                                      Pick
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      toggleChannels(match.id)
                                    }}
                                    className="flex items-center gap-1.5 rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                                    type="button"
                                  >
                                    <span>
                                      {tvChannels.length > 0 ? `TV: ${tvChannels.length}` : "TV Guide"}
                                    </span>
                                    <ChevronRight
                                      className={`h-3 w-3 transition-transform ${isChannelsExpanded ? "rotate-90" : ""}`}
                                    />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </Link>

                          {expandedPredictions.has(match.id) && !inPlay.isFinished && (
                            <div className="mt-1">
                              <MatchPrediction
                                matchId={match.id}
                                homeTeam={match.home}
                                awayTeam={match.away}
                                homeLogo={match.homeLogo}
                                awayLogo={match.awayLogo}
                              />
                            </div>
                          )}

                          {isChannelsExpanded && (
                            <div className="mt-1 rounded-lg border border-border bg-card/50 p-2">
                              {tvChannels.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                  {tvChannels.map((channel, idx) => (
                                    <div key={idx} className="flex items-center gap-2 rounded-md bg-card p-2 shadow-sm">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10">
                                        {channel.channelLogo ? (
                                          <img src={channel.channelLogo} alt="" className="h-6 w-6 object-contain" />
                                        ) : (
                                          <span className="text-[10px] font-bold text-primary">
                                            {channel.channel?.substring(0, 2) || "TV"}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-semibold leading-tight truncate">{channel.channel}</p>
                                        <p className="text-[9px] text-muted-foreground">{channel.country || channel.countryCode}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-xs text-muted-foreground">
                                    {inPlay.isFinished ? "Match finished - highlights may be available" : "No TV listing in your region yet"}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {inPlay.isFinished ? (
                                      <Link
                                        href={`/match/${match.id}?tab=videos`}
                                        className="rounded-md bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground"
                                      >
                                        Match highlights
                                      </Link>
                                    ) : (
                                      <Link
                                        href={buildVenueHref(match, fixtureGroup.league)}
                                        className="rounded-md bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground"
                                      >
                                        Find venues showing it
                                      </Link>
                                    )}
                                    <Link href={buildTvHref(match)} className="text-xs font-medium text-primary hover:underline">
                                      Full TV Guide →
                                    </Link>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )
        })}
        </section>

        {hasMore && (
          <div ref={observerRef} className="py-8 text-center">
            {loadingMore ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading more fixtures...</p>
              </div>
            ) : (
              <div className="h-8" />
            )}
          </div>
        )}

        {!hasMore && fixtures.length > 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No more fixtures available</p>
          </div>
        )}

        {fixtures.length > 0 && <AdInjection placement="fixtures" index={9} className="mt-4" />}
      </div>
    </PullToRefresh>
  )
}
