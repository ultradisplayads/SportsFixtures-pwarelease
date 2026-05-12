"use client"

import { useEffect, useState } from "react"
import { Info, Target, Trophy } from "lucide-react"
import {
  gamificationManager,
  PREDICTION_POINTS,
  WEEKLY_PREDICTION_LIMIT,
  type UserStats,
} from "@/lib/gamification-manager"

export function Leaderboard() {
  const [stats, setStats] = useState<UserStats>(() => gamificationManager.getUserStats())

  useEffect(() => {
    const refresh = () => setStats(gamificationManager.getUserStats())
    window.addEventListener("sf:gamification:update", refresh)
    window.addEventListener("storage", refresh)
    return () => {
      window.removeEventListener("sf:gamification:update", refresh)
      window.removeEventListener("storage", refresh)
    }
  }, [])

  const remaining = Math.max(0, WEEKLY_PREDICTION_LIMIT - stats.weeklyPredictionsUsed)

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Leaderboard</h3>
          <p className="text-xs text-muted-foreground">
            Free weekly score predictions. Just for fun, no gambling.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-muted/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">You</p>
            <p className="text-xs text-muted-foreground">{remaining} of {WEEKLY_PREDICTION_LIMIT} picks left this week</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{stats.totalPoints}</p>
            <p className="text-xs text-muted-foreground">points</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-lg font-bold">{stats.predictionsCount}</p>
            <p className="text-[11px] text-muted-foreground">Predictions</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-lg font-bold">{Number.isFinite(stats.accuracy) ? Math.round(stats.accuracy) : 0}%</p>
            <p className="text-[11px] text-muted-foreground">Exact accuracy</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-lg font-bold">{stats.streak}</p>
            <p className="text-[11px] text-muted-foreground">Points streak</p>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
        <div className="mb-2 flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <p className="text-sm font-bold">How scoring works</p>
        </div>
        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <span><Target className="mr-1 inline h-3 w-3" />Submit a pick: +{PREDICTION_POINTS.submit}</span>
          <span>Exact score: +{PREDICTION_POINTS.exactScore}</span>
          <span>Correct winner/draw: +{PREDICTION_POINTS.correctOutcome}</span>
          <span>Correct goal difference: +{PREDICTION_POINTS.correctGoalDifference}</span>
          <span>Each team score right: +{PREDICTION_POINTS.oneTeamScore}</span>
          <span>Limit: {WEEKLY_PREDICTION_LIMIT} picks per person per week</span>
        </div>
      </div>
    </div>
  )
}
