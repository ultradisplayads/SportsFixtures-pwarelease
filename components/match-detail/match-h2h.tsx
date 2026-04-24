"use client"

import { useEffect, useState } from "react"
import { getHeadToHead, type H2HMatch } from "@/app/actions/sports-api"
import { MatchDetailSkeleton } from "@/components/skeleton-loader"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

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

  const calculateStats = () => {
    if (h2hMatches.length === 0) {
      return { homeWins: 0, awayWins: 0, draws: 0 }
    }

    const homeTeamName = h2hMatches[0]?.strHomeTeam || ""
    const awayTeamName = h2hMatches[0]?.strAwayTeam || ""

    let homeWins = 0
    let awayWins = 0
    let draws = 0

    h2hMatches.forEach((match) => {
      const result = getMatchResult(match, homeTeamName)
      if (result === "win") homeWins++
      else if (result === "loss") awayWins++
      else draws++
    })

    return { homeWins, awayWins, draws }
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

  return (
    <div className="space-y-4 p-4">
      {/* Overall Stats */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-4 font-semibold">Overall Record (Last 5 Meetings)</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-green-500/10 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-green-500">
              <TrendingUp className="h-4 w-4" />
            </div>
            <p className="mt-1 text-2xl font-bold">{stats.homeWins}</p>
            <p className="text-xs text-muted-foreground">Home Wins</p>
          </div>
          <div className="rounded-lg bg-muted p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Minus className="h-4 w-4" />
            </div>
            <p className="mt-1 text-2xl font-bold">{stats.draws}</p>
            <p className="text-xs text-muted-foreground">Draws</p>
          </div>
          <div className="rounded-lg bg-blue-500/10 p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-blue-500">
              <TrendingDown className="h-4 w-4" />
            </div>
            <p className="mt-1 text-2xl font-bold">{stats.awayWins}</p>
            <p className="text-xs text-muted-foreground">Away Wins</p>
          </div>
        </div>
      </div>

      {/* Previous Meetings */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold">Previous Meetings</h3>
        <div className="space-y-3">
          {h2hMatches.map((match, index) => {
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
