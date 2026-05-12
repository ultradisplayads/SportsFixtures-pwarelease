"use client"

import { useEffect, useState } from "react"
import { getHeadToHead, type H2HMatch } from "@/app/actions/sports-api"
import { MatchDetailSkeleton } from "@/components/skeleton-loader"
import { Check, ChevronDown, Minus, X } from "lucide-react"

type H2HFilter = "all" | "home" | "competition"

export function MatchH2H({
  homeTeamId,
  awayTeamId,
  leagueId,
}: {
  homeTeamId: string
  awayTeamId: string
  leagueId: string
}) {
  const [h2hMatches, setH2hMatches] = useState<H2HMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<H2HFilter>("all")
  const [showMoreStreaks, setShowMoreStreaks] = useState(false)

  useEffect(() => {
    loadH2H()
  }, [homeTeamId, awayTeamId, leagueId])

  const loadH2H = async () => {
    setLoading(true)
    const matches = await getHeadToHead(homeTeamId, awayTeamId, leagueId)
    setH2hMatches(matches)
    setLoading(false)
  }

  const getMatchResult = (match: H2HMatch, teamName: string) => {
    const isHome = match.strHomeTeam === teamName
    const homeScore = Number.parseInt(match.intHomeScore || "0")
    const awayScore = Number.parseInt(match.intAwayScore || "0")

    if (homeScore === awayScore) return "draw"
    if (isHome) {
      return homeScore > awayScore ? "win" : "loss"
    } else {
      return awayScore > homeScore ? "win" : "loss"
    }
  }

  const filteredMatches = h2hMatches.filter((match) => {
    if (filter === "home") return match.strHomeTeam === h2hMatches[0]?.strHomeTeam
    if (filter === "competition") return !leagueId || String((match as any).idLeague || "") === String(leagueId)
    return true
  })

  const calculateStats = (matches = filteredMatches) => {
    if (matches.length === 0) {
      return { homeWins: 0, awayWins: 0, draws: 0 }
    }

    const homeTeamName = h2hMatches[0]?.strHomeTeam || ""

    let homeWins = 0
    let awayWins = 0
    let draws = 0

    matches.forEach((match) => {
      const result = getMatchResult(match, homeTeamName)
      if (result === "win") homeWins++
      else if (result === "loss") awayWins++
      else draws++
    })

    return { homeWins, awayWins, draws }
  }

  const buildStreaks = () => {
    const matches = filteredMatches
    const homeTeamName = h2hMatches[0]?.strHomeTeam || ""
    const awayTeamName = h2hMatches[0]?.strAwayTeam || ""
    const total = matches.length
    const lowScoring = matches.filter((match) => Number(match.intHomeScore || 0) + Number(match.intAwayScore || 0) < 3).length
    const homeNoWins = matches.every((match) => getMatchResult(match, homeTeamName) !== "win")
    const awayNoWins = matches.every((match) => getMatchResult(match, awayTeamName) !== "win")
    const homeWithoutCleanSheet = matches.filter((match) => Number(match.intAwayScore || 0) > 0).length
    const awayWithoutCleanSheet = matches.filter((match) => Number(match.intHomeScore || 0) > 0).length

    return [
      {
        label: "Fewer than 2.5 goals",
        value: total ? `${lowScoring}/${total}` : "-",
        ok: total ? lowScoring / total >= 0.6 : false,
      },
      {
        label: `${homeTeamName || "Home"} no wins`,
        value: homeNoWins ? String(total) : "No",
        ok: homeNoWins,
      },
      {
        label: `${awayTeamName || "Away"} no wins`,
        value: awayNoWins ? String(total) : "No",
        ok: awayNoWins,
      },
      {
        label: `${homeTeamName || "Home"} without clean sheet`,
        value: String(homeWithoutCleanSheet),
        ok: homeWithoutCleanSheet >= Math.max(2, Math.floor(total * 0.6)),
      },
      {
        label: `${awayTeamName || "Away"} without clean sheet`,
        value: String(awayWithoutCleanSheet),
        ok: awayWithoutCleanSheet >= Math.max(2, Math.floor(total * 0.6)),
      },
    ]
  }

  if (loading) {
    return (
      <div className="p-4">
        <MatchDetailSkeleton />
      </div>
    )
  }

  if (h2hMatches.length === 0) {
    return (
      <div className="p-4">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No previous meetings found</p>
        </div>
      </div>
    )
  }

  const stats = calculateStats()
  const homeTeamName = h2hMatches[0]?.strHomeTeam || ""
  const awayTeamName = h2hMatches[0]?.strAwayTeam || ""
  const total = Math.max(1, stats.homeWins + stats.awayWins + stats.draws)
  const streaks = buildStreaks()
  const visibleStreaks = showMoreStreaks ? streaks : streaks.slice(0, 3)

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Head to Head streaks</h3>
        <div className="divide-y divide-border">
          {visibleStreaks.map((streak) => (
            <div key={streak.label} className="flex items-center justify-between gap-3 py-3">
              <p className="text-sm font-semibold">{streak.label}</p>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold tabular-nums">{streak.value}</span>
                {streak.ok ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-destructive" />}
              </div>
            </div>
          ))}
        </div>
        {streaks.length > 3 && (
          <button
            type="button"
            onClick={() => setShowMoreStreaks((value) => !value)}
            className="mt-2 flex w-full items-center justify-center gap-1 text-sm font-semibold text-muted-foreground"
          >
            {showMoreStreaks ? "See less" : "See more"}
            <ChevronDown className={`h-4 w-4 transition-transform ${showMoreStreaks ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl bg-background p-1">
          {[
            { id: "all" as H2HFilter, label: "H2H" },
            { id: "home" as H2HFilter, label: homeTeamName || "Home" },
            { id: "competition" as H2HFilter, label: "This competition" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`truncate rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                filter === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-muted-foreground">Head To Head</p>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">All</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">{homeTeamName}</span>
            <span className="text-muted-foreground">Total matches ({filteredMatches.length})</span>
            <span className="font-semibold text-right">{awayTeamName}</span>
          </div>
          <div className="grid h-2 overflow-hidden rounded-full bg-muted" style={{ gridTemplateColumns: `${stats.homeWins || 0}fr ${stats.draws || 0}fr ${stats.awayWins || 0}fr` }}>
            <span className="bg-primary" />
            <span className="bg-muted-foreground/40" />
            <span className="bg-yellow-500" />
          </div>
          <div className="grid grid-cols-3 text-xs">
            <span className="font-semibold text-primary">{stats.homeWins} win {Math.round((stats.homeWins / total) * 100)}%</span>
            <span className="text-center font-semibold text-muted-foreground">{stats.draws} draw {Math.round((stats.draws / total) * 100)}%</span>
            <span className="text-right font-semibold text-yellow-600">{stats.awayWins} win {Math.round((stats.awayWins / total) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Previous Meetings */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold">Previous Meetings</h3>
        <div className="space-y-3">
          {filteredMatches.map((match, index) => {
            const result = getMatchResult(match, homeTeamName)
            return (
              <div key={index} className="rounded-lg border border-border bg-background p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{match.strSeason}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(match.dateEvent).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{match.strHomeTeam}</p>
                  </div>
                  <div className="px-3">
                    <p className="font-mono text-sm font-bold">
                      {match.intHomeScore} - {match.intAwayScore}
                    </p>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-sm font-medium">{match.strAwayTeam}</p>
                  </div>
                </div>
                <div className="mt-2 flex justify-center">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      result === "win"
                        ? "bg-green-500/20 text-green-500"
                        : result === "loss"
                          ? "bg-blue-500/20 text-blue-500"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {result === "win" ? "Home Win" : result === "loss" ? "Away Win" : "Draw"}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
