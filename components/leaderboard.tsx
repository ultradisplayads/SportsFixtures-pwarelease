"use client"

import { useMemo } from "react"
import { Trophy } from "lucide-react"
import { gamificationManager } from "@/lib/gamification-manager"

export function Leaderboard() {
  const stats = useMemo(() => gamificationManager.getUserStats(), [])

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Leaderboard</h3>
          <p className="text-xs text-muted-foreground">
            Your local progress is live. Synced community rankings can be turned on when the backend leaderboard is ready.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-muted/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">You</p>
            <p className="text-xs text-muted-foreground">Local account progress</p>
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
            <p className="text-[11px] text-muted-foreground">Accuracy</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-lg font-bold">{stats.streak}</p>
            <p className="text-[11px] text-muted-foreground">Streak</p>
          </div>
        </div>
      </div>
    </div>
  )
}
