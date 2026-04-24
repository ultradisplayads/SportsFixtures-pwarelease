"use client"

import { useEffect, useState } from "react"
import { gamificationManager, type UserStats } from "@/lib/gamification-manager"
import { Trophy, Target, Flame } from "lucide-react"

export function GamificationStats() {
  const [stats, setStats] = useState<UserStats | null>(null)

  useEffect(() => {
    setStats(gamificationManager.getUserStats())
  }, [])

  if (!stats) return null

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">{stats.rank}</h3>
          <p className="text-sm text-muted-foreground">Level {stats.level}</p>
        </div>
        <div className="text-4xl">{stats.badges[stats.badges.length - 1] || "🆕"}</div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <Trophy className="mx-auto mb-1 h-5 w-5 text-primary" />
          <div className="text-lg font-bold">{stats.totalPoints}</div>
          <div className="text-xs text-muted-foreground">Points</div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <Target className="mx-auto mb-1 h-5 w-5 text-green-500" />
          <div className="text-lg font-bold">{stats.accuracy.toFixed(0)}%</div>
          <div className="text-xs text-muted-foreground">Accuracy</div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <Flame className="mx-auto mb-1 h-5 w-5 text-orange-500" />
          <div className="text-lg font-bold">{stats.streak}</div>
          <div className="text-xs text-muted-foreground">Streak</div>
        </div>
      </div>

      <div className="rounded-lg bg-muted/30 p-3">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted-foreground">Progress to Level {stats.level + 1}</span>
          <span className="font-medium">{stats.totalPoints % 100}/100</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-gradient-to-r from-primary to-blue-400 transition-all"
            style={{ width: `${stats.totalPoints % 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
