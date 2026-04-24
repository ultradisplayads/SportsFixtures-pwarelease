"use client"

import { useEffect, useState } from "react"
import { Star, Clock, ChevronRight } from "lucide-react"
import Link from "next/link"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { getFavourites, type Favourite } from "@/lib/favourites-api"
import { getNextEventsByTeam } from "@/app/actions/sports-api"
import { useSubscription } from "@/lib/use-subscription"
import {
  scoreHomeItem,
  buildRecommendationReason,
} from "@/lib/personalization"

// ── Types ─────────────────────────────────────────────────────────────────────

interface UpcomingMatch {
  idEvent: string
  strHomeTeam: string
  strAwayTeam: string
  strHomeTeamBadge?: string
  strAwayTeamBadge?: string
  dateEvent: string
  strTime?: string
  strLeague?: string
  /** The followed-entity name that triggered this result */
  followedName: string
  /** Computed relevance score (higher = more relevant) */
  score: number
  /** Human-readable reason shown as a badge */
  reason: string
}

// ── Scoring ───────────────────────────────────────────────────────────────────

/**
 * deriveMatchScore — uses the central personalization engine.
 *
 * Checks all follow types: team, league/competition, player, venue.
 * Returns the final score and a user-facing reason string.
 */
function deriveMatchScore(
  match: Omit<UpcomingMatch, "score" | "reason" | "followedName">,
  favs: Favourite[]
): { score: number; reason: string; followedName: string } {
  const teamFavs        = favs.filter((f) => f.entity_type === "team")
  const competitionFavs = favs.filter(
    (f) => f.entity_type === "league" || f.entity_type === "competition"
  )
  const playerFavs = favs.filter((f) => f.entity_type === "player")
  const venueFavs  = favs.filter((f) => f.entity_type === "venue")

  let followedTeamName:        string | undefined
  let followedCompetitionName: string | undefined
  let followedPlayerName:      string | undefined
  let followedVenueName:       string | undefined

  // ── Direct team match ──────────────────────────────────────────────────────
  for (const f of teamFavs) {
    const name = f.entity_name || f.entity_id
    const lo   = name.toLowerCase()
    if (
      match.strHomeTeam?.toLowerCase().includes(lo) ||
      match.strAwayTeam?.toLowerCase().includes(lo)
    ) {
      followedTeamName = name
      break
    }
  }

  // ── Competition / league match ─────────────────────────────────────────────
  if (!followedTeamName) {
    for (const f of competitionFavs) {
      const name = f.entity_name || f.entity_id
      if (match.strLeague?.toLowerCase().includes(name.toLowerCase())) {
        followedCompetitionName = name
        break
      }
    }
  }

  // ── Player mention (best effort via league/match meta) ────────────────────
  // Player-level filtering would need line-ups data; for now we mark it if
  // the player's team appears in the match (indirect follow signal).
  if (!followedTeamName && !followedCompetitionName) {
    for (const f of playerFavs) {
      const playerTeam = (
        (f.entity_meta as Record<string, string> | undefined)?.team || ""
      ).toLowerCase()
      if (
        playerTeam &&
        (match.strHomeTeam?.toLowerCase().includes(playerTeam) ||
          match.strAwayTeam?.toLowerCase().includes(playerTeam))
      ) {
        followedPlayerName = f.entity_name || f.entity_id
        break
      }
    }
  }

  // ── Venue match (if meta carries stadium info) ────────────────────────────
  if (!followedTeamName && !followedCompetitionName && !followedPlayerName) {
    for (const f of venueFavs) {
      const venueName = (f.entity_name || f.entity_id).toLowerCase()
      const matchVenue = (
        (match as Record<string, any>).strVenue || ""
      ).toLowerCase()
      if (matchVenue && matchVenue.includes(venueName)) {
        followedVenueName = f.entity_name || f.entity_id
        break
      }
    }
  }

  // ── Temporal signals ───────────────────────────────────────────────────────
  const matchDate = new Date(
    `${match.dateEvent}T${match.strTime || "00:00"}Z`
  )
  const msUntil = matchDate.getTime() - Date.now()
  const isLive    = msUntil < 0 && msUntil > -3 * 60 * 60 * 1000
  const startsSoon = msUntil > 0 && msUntil < 3 * 60 * 60 * 1000

  // ── Sport affinity (heuristic) ─────────────────────────────────────────────
  let sameSport = false
  if (!followedTeamName && !followedCompetitionName) {
    for (const f of teamFavs) {
      const sport = (
        (f.entity_meta as Record<string, string> | undefined)?.sport || ""
      ).toLowerCase()
      if (sport && match.strLeague?.toLowerCase().includes(sport)) {
        sameSport = true
        break
      }
    }
  }

  // ── Score via shared engine ────────────────────────────────────────────────
  const { score, reasons } = scoreHomeItem({
    isLive,
    startsSoon,
    followedTeam:        !!followedTeamName,
    followedCompetition: !!followedCompetitionName,
    followedPlayer:      !!followedPlayerName,
    followedVenue:       !!followedVenueName,
    sameSport,
  })

  // Recency decay for future matches (cap at 12h)
  const minutesUntil = Math.min(Math.max(msUntil / 60_000, 0), 720)
  const finalScore = score - minutesUntil * 0.01

  const reason =
    buildRecommendationReason(match, {
      isLive,
      startsSoon,
      followedTeamName,
      followedCompetitionName,
      followedPlayerName,
      followedVenueName,
    }) ??
    (reasons[0]?.label || "Upcoming match")

  const followedName =
    followedTeamName ??
    followedCompetitionName ??
    followedPlayerName ??
    followedVenueName ??
    ""

  return { score: finalScore, reason, followedName }
}

// ── Component ─────────────────────────────────────────────────────────────────

const HOUSE_AD_ENABLED = process.env.NEXT_PUBLIC_ENABLE_HOUSE_ADS === "true"

export function RecommendedMatches() {
  const [matches, setMatches] = useState<UpcomingMatch[]>([])
  const [loading, setLoading] = useState(true)
  const { tier } = useSubscription()

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const favs  = await getFavourites()
        const teams = favs.filter((f) => f.entity_type === "team").slice(0, 5)
        if (!teams.length) { setLoading(false); return }

        const results = await Promise.allSettled(
          teams.map((t) =>
            getNextEventsByTeam(t.entity_id).then((events) =>
              events.slice(0, 2).map((e) => ({
                idEvent:          e.idEvent,
                strHomeTeam:      e.strHomeTeam,
                strAwayTeam:      e.strAwayTeam,
                strHomeTeamBadge: e.strHomeTeamBadge,
                strAwayTeamBadge: e.strAwayTeamBadge,
                dateEvent:        e.dateEvent,
                strTime:          e.strTime,
                strLeague:        e.strLeague,
              }))
            )
          )
        )

        const rawMatches = results
          .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
          .filter((m) => m.idEvent && m.strHomeTeam)
          .filter((m, i, arr) => arr.findIndex((x) => x.idEvent === m.idEvent) === i)

        const scored: UpcomingMatch[] = rawMatches.map((m) => {
          const { score, reason, followedName } = deriveMatchScore(m, favs)
          return { ...m, score, reason, followedName }
        })

        scored.sort((a, b) => b.score - a.score)
        setMatches(scored.slice(0, 6))
      } catch {
        // fail silently — empty state shown
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

  if (!matches.length) return null

  return (
    <div className="border-b border-border bg-card p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Upcoming — Your Teams</h3>
        <Star className="h-4 w-4 text-primary" />
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-3 pb-2">
          {matches.map((match) => {
            const matchDate = new Date(
              `${match.dateEvent}T${match.strTime || "00:00"}Z`
            )
            const isToday =
              match.dateEvent === new Date().toISOString().split("T")[0]
            const dateLabel = isToday
              ? matchDate.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : matchDate.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })

            return (
              <Link
                key={match.idEvent}
                href={`/match/${match.idEvent}`}
                onClick={() => triggerHaptic("selection")}
                className="group shrink-0 w-44 rounded-lg border border-border bg-background p-3 transition-all hover:border-primary hover:shadow-md active:scale-95"
              >
                {/* Reason badge */}
                <p className="mb-2 truncate rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                  {match.reason}
                </p>

                <div className="flex items-center gap-2 mb-1.5">
                  {match.strHomeTeamBadge && (
                    <img
                      src={match.strHomeTeamBadge}
                      alt=""
                      className="h-5 w-5 object-contain"
                    />
                  )}
                  <p className="text-xs font-semibold truncate flex-1">
                    {match.strHomeTeam}
                  </p>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  {match.strAwayTeamBadge && (
                    <img
                      src={match.strAwayTeamBadge}
                      alt=""
                      className="h-5 w-5 object-contain"
                    />
                  )}
                  <p className="text-xs font-semibold truncate flex-1">
                    {match.strAwayTeam}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {dateLabel}
                  </span>
                  {match.strLeague && (
                    <span className="text-[10px] text-primary truncate max-w-[70px]">
                      {match.strLeague}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}

          {/* Native venue promo card — fills dead space for free tier */}
          {HOUSE_AD_ENABLED && tier === "bronze" && (
            <Link
              href="/venues"
              onClick={() => triggerHaptic("selection")}
              className="group shrink-0 w-44 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 transition-all hover:border-primary hover:bg-primary/10 active:scale-95"
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
          )}
        </div>
      </div>
    </div>
  )
}
