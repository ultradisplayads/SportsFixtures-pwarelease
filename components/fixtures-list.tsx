"use client"

import { Star, ChevronUp, ChevronRight, MapPin, Navigation } from "lucide-react"
import Image from "next/image"
import { SmartImage } from "@/components/assets/smart-image"
import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"
import { getNextEvents, type Event } from "@/app/actions/sports-api"
import { getMatchStatus } from "@/lib/match-utils"
import { getTVEventsForEvent, type SFTVEvent } from "@/lib/sf-api"
import { FixtureCardSkeleton, LeagueHeaderSkeleton } from "@/components/skeleton-loader"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { AdInjection, AdInjectionRow } from "@/components/ad-injection"
import { parseSportsDate, formatTimeWithTimezones, formatInPlayTime } from "@/lib/date-utils"
import { pwaManager, useOnlineStatus } from "@/lib/pwa-manager"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { useFixturesFilter } from "@/lib/fixtures-filter-context"

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
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [leagueIndex, setLeagueIndex] = useState(0)
  const [collapsedLeagues, setCollapsedLeagues] = useState<Set<string>>(new Set())
  const [allCollapsed, setAllCollapsed] = useState(false)
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set())
  const [tvChannelsMap, setTvChannelsMap] = useState<Record<string, SFTVEvent[]>>({})
  const observerRef = useRef<HTMLDivElement>(null)
  const isOnline = useOnlineStatus()

  // Reload fixtures whenever the active league filter changes
  useEffect(() => {
    loadInitialFixtures(activeLeagueIds)
  }, [activeLeagueIds.join(",")])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
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
    setLoading(true)
    setFixtures([])
    setLeagueIndex(0)
    setHasMore(true)

    if (!isOnline) {
      const cached = pwaManager.getCachedFixtures()
      if (cached && cached.length > 0) {
        setFixtures(cached)
        setLoading(false)
        return
      }
    }

    const allFixtures: GroupedFixtures[] = []
    const initialBatch = leagueIds.slice(0, 3)

    for (const leagueId of initialBatch) {
      const events = await getNextEvents(leagueId)
      if (events.length > 0) {
        allFixtures.push(...groupEventsByLeague(events))
      }
    }

    setFixtures(allFixtures)
    setLeagueIndex(3)
    setLoading(false)

    if (allFixtures.length > 0) {
      pwaManager.cacheFixtures(allFixtures)
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
      setFixtures((prev) => [...prev, ...groupEventsByLeague(events)])
    }

    setLeagueIndex((prev) => prev + 1)
    setLoadingMore(false)

    if (leagueIndex + 1 >= leagueIds.length) {
      setHasMore(false)
    }
  }

  const groupEventsByLeague = (events: Event[]): GroupedFixtures[] => {
    if (events.length === 0) return []

    const firstEvent = events[0]

    const parsedDate = parseSportsDate(firstEvent.dateEvent)

    const matches = events.slice(0, 5).map((event) => {
      const progress = event.strProgress || event.strStatus || "NS"
      const inPlay = formatInPlayTime(progress)
      const hasScore = event.intHomeScore !== null && event.intAwayScore !== null
      return {
        id: event.idEvent,
        home: event.strHomeTeam,
        homeLogo: event.strHomeTeamBadge || "",
        homeId: event.idHomeTeam,
        away: event.strAwayTeam,
        awayLogo: event.strAwayTeamBadge || "",
        awayId: event.idAwayTeam,
        score: hasScore ? `${event.intHomeScore} – ${event.intAwayScore}` : "- – -",
        matchTime: event.strTime || "TBD",
        dateRaw: event.dateEvent || "",
        tv: "TV Guide",
        status: inPlay.display,
        progress,
        isLive: inPlay.isLive,
        isFinished: inPlay.isFinished,
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
        const channels = await getTVEventsForEvent(matchId)
        setTvChannelsMap((prev) => ({ ...prev, [matchId]: channels }))
      }
    }
    setExpandedChannels(newExpanded)
  }

  const getTvChannels = (matchId: string): SFTVEvent[] => {
    return tvChannelsMap[matchId] || []
  }

  const formatMatchTime = (matchTime: string, dateString: string) => {
    // dateString here is the raw YYYY-MM-DD from the API (UTC date)
    return formatTimeWithTimezones(dateString, matchTime)
  }

  const handleRefresh = useCallback(async () => {
    await loadInitialFixtures(activeLeagueIds)
  }, [activeLeagueIds])

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
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    toggleChannels(match.id)
                                  }}
                                  className="flex items-center gap-1.5 rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
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
                          </Link>

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
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-muted-foreground">No listings in your region yet</p>
                                  <Link href="/tv" className="text-xs font-medium text-primary hover:underline">
                                    Full TV Guide →
                                  </Link>
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
