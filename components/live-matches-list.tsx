"use client"

import { TrendingUp, ChevronRight, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { FixtureCardSkeleton } from "@/components/skeleton-loader"
import { SmartImage } from "@/components/assets/smart-image"
import { formatTimeWithTimezones, formatInPlayTime } from "@/lib/date-utils"
import type { LiveMatchRow } from "@/app/api/live/route"

const POLL_INTERVAL = 30_000

/** Derive a display score string matching the home fixture card format ("1 - 0", "- - -"). */
function scoreDisplay(home: number | null, away: number | null): string {
  if (home == null && away == null) return "- - -"
  return `${home ?? "-"} - ${away ?? "-"}`
}

export function LiveMatchesList() {
  const [matches, setMatches] = useState<LiveMatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const load = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true)
    try {
      const res = await fetch("/api/live", { cache: "no-store" })
      if (res.ok) {
        const json = await res.json()
        setMatches(json.matches ?? [])
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
        {lastUpdated && (
          <p className="text-[10px] text-muted-foreground/50 text-right pr-1">
            Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </PullToRefresh>
  )
}

function MatchCard({ match }: { match: LiveMatchRow }) {
  const inPlay = formatInPlayTime(match.progress)

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

  return (
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
          <Link
            href={`/tv?eventId=${match.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <span>TV Guide</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </Link>
  )
}
