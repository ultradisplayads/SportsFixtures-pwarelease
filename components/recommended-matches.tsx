"use client"

import { useEffect, useState } from "react"
import { ChevronRight, Clock, Star, Trophy } from "lucide-react"
import Link from "next/link"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { getCachedFavourites, getFavourites, type Favourite } from "@/lib/favourites-api"
import { getNextEventsByTeam, getPastEventsByTeam } from "@/app/actions/sports-api"
import { useSubscription } from "@/lib/use-subscription"
import { AdInjection } from "@/components/ad-injection"
import {
  buildRecommendationReason,
  scoreHomeItem,
} from "@/lib/personalization"

interface TeamMatch {
  idEvent: string
  strHomeTeam: string
  strAwayTeam: string
  strHomeTeamBadge?: string
  strAwayTeamBadge?: string
  dateEvent: string
  strTime?: string
  strLeague?: string
  intHomeScore?: string | null
  intAwayScore?: string | null
  kind: "upcoming" | "result"
  followedName: string
  score: number
  reason: string
}

type RawTeamMatch = Omit<TeamMatch, "score" | "reason" | "followedName">

const HOUSE_AD_ENABLED = process.env.NEXT_PUBLIC_ENABLE_HOUSE_ADS === "true"

function mergeFavourites(primary: Favourite[], fallback: Favourite[]) {
  const seen = new Set<string>()
  return [...primary, ...fallback].filter((fav) => {
    const key = `${fav.entity_type}:${fav.entity_id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function deriveMatchScore(
  match: RawTeamMatch,
  favs: Favourite[],
): { score: number; reason: string; followedName: string } {
  const teamFavs = favs.filter((f) => f.entity_type === "team")
  const competitionFavs = favs.filter(
    (f) => f.entity_type === "league" || f.entity_type === "competition",
  )
  const playerFavs = favs.filter((f) => f.entity_type === "player")
  const venueFavs = favs.filter((f) => f.entity_type === "venue")

  let followedTeamName: string | undefined
  let followedCompetitionName: string | undefined
  let followedPlayerName: string | undefined
  let followedVenueName: string | undefined

  for (const fav of teamFavs) {
    const name = fav.entity_name || fav.entity_id
    const lowerName = name.toLowerCase()
    if (
      match.strHomeTeam?.toLowerCase().includes(lowerName) ||
      match.strAwayTeam?.toLowerCase().includes(lowerName)
    ) {
      followedTeamName = name
      break
    }
  }

  if (!followedTeamName) {
    for (const fav of competitionFavs) {
      const name = fav.entity_name || fav.entity_id
      if (match.strLeague?.toLowerCase().includes(name.toLowerCase())) {
        followedCompetitionName = name
        break
      }
    }
  }

  if (!followedTeamName && !followedCompetitionName) {
    for (const fav of playerFavs) {
      const playerTeam = (
        (fav.entity_meta as Record<string, string> | undefined)?.team || ""
      ).toLowerCase()
      if (
        playerTeam &&
        (match.strHomeTeam?.toLowerCase().includes(playerTeam) ||
          match.strAwayTeam?.toLowerCase().includes(playerTeam))
      ) {
        followedPlayerName = fav.entity_name || fav.entity_id
        break
      }
    }
  }

  if (!followedTeamName && !followedCompetitionName && !followedPlayerName) {
    for (const fav of venueFavs) {
      const venueName = (fav.entity_name || fav.entity_id).toLowerCase()
      const matchVenue = ((match as Record<string, unknown>).strVenue || "")
        .toString()
        .toLowerCase()
      if (matchVenue && matchVenue.includes(venueName)) {
        followedVenueName = fav.entity_name || fav.entity_id
        break
      }
    }
  }

  const matchDate = new Date(`${match.dateEvent}T${match.strTime || "00:00"}Z`)
  const msUntil = matchDate.getTime() - Date.now()
  const isLive = msUntil < 0 && msUntil > -3 * 60 * 60 * 1000
  const startsSoon = msUntil > 0 && msUntil < 3 * 60 * 60 * 1000

  let sameSport = false
  if (!followedTeamName && !followedCompetitionName) {
    for (const fav of teamFavs) {
      const sport = (
        (fav.entity_meta as Record<string, string> | undefined)?.sport || ""
      ).toLowerCase()
      if (sport && match.strLeague?.toLowerCase().includes(sport)) {
        sameSport = true
        break
      }
    }
  }

  const { score, reasons } = scoreHomeItem({
    isLive,
    startsSoon,
    followedTeam: !!followedTeamName,
    followedCompetition: !!followedCompetitionName,
    followedPlayer: !!followedPlayerName,
    followedVenue: !!followedVenueName,
    sameSport,
  })

  const minutesUntil = Math.min(Math.max(msUntil / 60_000, 0), 720)
  const finalScore = match.kind === "result" ? score : score - minutesUntil * 0.01
  const baseReason =
    buildRecommendationReason(match, {
      isLive,
      startsSoon,
      followedTeamName,
      followedCompetitionName,
      followedPlayerName,
      followedVenueName,
    }) ??
    reasons[0]?.label ??
    "Your team"

  return {
    score: finalScore,
    reason: match.kind === "result" ? `Result - ${baseReason}` : baseReason,
    followedName:
      followedTeamName ??
      followedCompetitionName ??
      followedPlayerName ??
      followedVenueName ??
      "",
  }
}

function formatMatchDate(match: TeamMatch) {
  const matchDate = new Date(`${match.dateEvent}T${match.strTime || "00:00"}Z`)
  const isToday = match.dateEvent === new Date().toISOString().split("T")[0]
  return isToday
    ? matchDate.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : matchDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
}

function normaliseEvent(event: Record<string, any>, kind: TeamMatch["kind"]): RawTeamMatch {
  return {
    idEvent: event.idEvent,
    strHomeTeam: event.strHomeTeam,
    strAwayTeam: event.strAwayTeam,
    strHomeTeamBadge: event.strHomeTeamBadge,
    strAwayTeamBadge: event.strAwayTeamBadge,
    dateEvent: event.dateEvent,
    strTime: event.strTime,
    strLeague: event.strLeague,
    intHomeScore: event.intHomeScore,
    intAwayScore: event.intAwayScore,
    kind,
  }
}

function MatchCard({ match }: { match: TeamMatch }) {
  const isResult = match.kind === "result"
  const scoreLine =
    match.intHomeScore != null && match.intAwayScore != null
      ? `${match.intHomeScore} - ${match.intAwayScore}`
      : "FT"

  return (
    <Link
      href={`/match/${match.idEvent}`}
      onClick={() => triggerHaptic("selection")}
      className="group w-44 shrink-0 rounded-lg border border-border bg-background p-3 transition-all hover:border-primary hover:shadow-md active:scale-95"
    >
      <p className="mb-2 truncate rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
        {match.reason}
      </p>

      <div className="mb-1.5 flex items-center gap-2">
        {match.strHomeTeamBadge && (
          <img src={match.strHomeTeamBadge} alt="" className="h-5 w-5 object-contain" />
        )}
        <p className="min-w-0 flex-1 truncate text-xs font-semibold">
          {match.strHomeTeam}
        </p>
        {isResult && (
          <span className="text-xs font-bold tabular-nums">{match.intHomeScore ?? "-"}</span>
        )}
      </div>

      <div className="mb-2 flex items-center gap-2">
        {match.strAwayTeamBadge && (
          <img src={match.strAwayTeamBadge} alt="" className="h-5 w-5 object-contain" />
        )}
        <p className="min-w-0 flex-1 truncate text-xs font-semibold">
          {match.strAwayTeam}
        </p>
        {isResult && (
          <span className="text-xs font-bold tabular-nums">{match.intAwayScore ?? "-"}</span>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          {isResult ? <Trophy className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
          {isResult ? scoreLine : formatMatchDate(match)}
        </span>
        {match.strLeague && (
          <span className="max-w-[70px] truncate text-[10px] text-primary">
            {match.strLeague}
          </span>
        )}
      </div>
    </Link>
  )
}

function MatchLane({ matches }: { matches: TeamMatch[] }) {
  if (!matches.length) return null

  return (
    <section className="min-w-0">
      <div className="overflow-x-auto">
        <div className="flex gap-3 pb-2">
          {matches.map((match) => (
            <MatchCard key={`${match.kind}-${match.idEvent}`} match={match} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function RecommendedMatches() {
  const [upcoming, setUpcoming] = useState<TeamMatch[]>([])
  const [results, setResults] = useState<TeamMatch[]>([])
  const [loading, setLoading] = useState(true)
  const { tier } = useSubscription()

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const cachedFavs = getCachedFavourites()
        const serverFavs = await getFavourites()
        const favs = mergeFavourites(serverFavs, cachedFavs)
        const teams = favs.filter((f) => f.entity_type === "team").slice(0, 5)

        if (!teams.length) {
          setLoading(false)
          return
        }

        const [nextSettled, pastSettled] = await Promise.all([
          Promise.allSettled(
            teams.map((team) =>
              getNextEventsByTeam(team.entity_id).then((events) =>
                events.slice(0, 3).map((event) => normaliseEvent(event, "upcoming")),
              ),
            ),
          ),
          Promise.allSettled(
            teams.map((team) =>
              getPastEventsByTeam(team.entity_id).then((events) =>
                events.slice(0, 3).map((event) => normaliseEvent(event, "result")),
              ),
            ),
          ),
        ])

        const rawUpcoming = nextSettled
          .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
          .filter((match) => match.idEvent && match.strHomeTeam)
          .filter((match, index, list) => list.findIndex((item) => item.idEvent === match.idEvent) === index)

        const rawResults = pastSettled
          .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
          .filter((match) => match.idEvent && match.strHomeTeam)
          .filter((match, index, list) => list.findIndex((item) => item.idEvent === match.idEvent) === index)

        const scoredUpcoming = rawUpcoming.map((match) => ({
          ...match,
          ...deriveMatchScore(match, favs),
        }))

        const scoredResults = rawResults.map((match) => ({
          ...match,
          ...deriveMatchScore(match, favs),
        }))

        scoredUpcoming.sort((a, b) => b.score - a.score)
        scoredResults.sort((a, b) => {
          const aTime = new Date(`${a.dateEvent}T${a.strTime || "00:00"}Z`).getTime()
          const bTime = new Date(`${b.dateEvent}T${b.strTime || "00:00"}Z`).getTime()
          return bTime - aTime
        })

        setUpcoming(scoredUpcoming.slice(0, 8))
        setResults(scoredResults.slice(0, 8))
      } catch {
        // Empty state is less noisy than a broken home module.
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="border-b border-border bg-card p-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <Star className="h-4 w-4 text-muted-foreground/30" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 w-44 shrink-0 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (!upcoming.length && !results.length) return null

  return (
    <div className="border-b border-border bg-card p-3">
      <div className="mb-2 flex min-h-6 items-center gap-3">
        <h2 className="shrink-0 text-sm font-semibold">Your Teams</h2>
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto text-[11px] font-semibold text-muted-foreground [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {upcoming.length > 0 && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
              Upcoming {Math.min(upcoming.length, 8)}
            </span>
          )}
          {results.length > 0 && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5">
              Results {Math.min(results.length, 8)}
            </span>
          )}
        </div>
        <Star className="h-4 w-4 shrink-0 text-primary" />
      </div>

      <div className="grid gap-3 min-[900px]:grid-cols-2">
        <MatchLane matches={upcoming} />
        <MatchLane matches={results} />
      </div>

      <AdInjection placement="home" index={1} className="mt-2" />

      {HOUSE_AD_ENABLED && tier === "bronze" && (
        <div className="mt-2 overflow-x-auto">
          <div className="flex gap-3 pb-2">
            <Link
              href="/venues"
              onClick={() => triggerHaptic("selection")}
              className="group w-44 shrink-0 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 transition-all hover:border-primary hover:bg-primary/10 active:scale-95"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/70">
                Find a venue
              </p>
              <p className="mt-1 text-xs font-semibold leading-snug">
                Watching tonight? Find a sports bar near you.
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
                Find venues <ChevronRight className="h-3 w-3" />
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
