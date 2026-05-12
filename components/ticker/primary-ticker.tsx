"use client"

// components/ticker/primary-ticker.tsx
// Section 15.A — Primary ticker rail (live scores / results / kickoffs).
//
// Extracted from PrimaryTickerRail in live-ticker.tsx.
// Uses:
//   - TickerMarqueeTrack for the rAF-driven scroll animation
//   - useLiveScoreAnimation for score-change pulse detection (Section 15.C)
//   - AnimatedLiveScoreItem for the per-item pulse wrapper
//   - TickerItemRenderer for rendering each item's content

import type { TickerItem, TickerConfig } from "@/types/ticker"
import { useEffect, useRef } from "react"
import { TickerItemRenderer } from "@/components/ticker/ticker-item-renderer"
import { TickerEmptyState } from "@/components/ticker/ticker-empty-state"
import { TickerMarqueeTrack } from "@/components/ticker/ticker-marquee-track"
import { useLiveScoreAnimation } from "@/hooks/use-live-score-animation"
import { coloursForTeam, dispatchGoalCelebration } from "@/lib/goal-celebration"

interface PrimaryTickerProps {
  items: TickerItem[]
  config: TickerConfig
}

export function PrimaryTicker({ items, config }: PrimaryTickerProps) {
  // Section 15.C — detect real score changes; pulse only on genuine updates
  const { pulsingIds } = useLiveScoreAnimation(items)
  const scoreSnapshotRef = useRef<Map<string, { home: number | null; away: number | null }>>(new Map())

  useEffect(() => {
    const previous = scoreSnapshotRef.current
    const next = new Map<string, { home: number | null; away: number | null }>()

    for (const item of items) {
      if (item.type !== "live_score" && item.type !== "match_event") continue
      const homeScore = item.homeScore ?? (item.scoreHome != null ? Number(item.scoreHome) : null)
      const awayScore = item.awayScore ?? (item.scoreAway != null ? Number(item.scoreAway) : null)
      next.set(item.id, { home: homeScore, away: awayScore })

      const old = previous.get(item.id)
      if (!old || homeScore == null || awayScore == null) continue

      const homeScored = old.home != null && homeScore > old.home
      const awayScored = old.away != null && awayScore > old.away
      if (!homeScored && !awayScored) continue

      const scoringTeam = homeScored
        ? item.homeTeam || item.teamHome || "Home"
        : item.awayTeam || item.teamAway || "Away"
      const opponentTeam = homeScored
        ? item.awayTeam || item.teamAway || "Away"
        : item.homeTeam || item.teamHome || "Home"
      const [primaryColor, secondaryColor] = coloursForTeam(scoringTeam)

      dispatchGoalCelebration({
        matchId: item.eventId || item.id,
        teamName: scoringTeam,
        opponentName: opponentTeam,
        homeTeam: item.homeTeam || item.teamHome || "Home",
        awayTeam: item.awayTeam || item.teamAway || "Away",
        score: `${homeScore} - ${awayScore}`,
        mood: "neutral",
        primaryColor,
        secondaryColor,
      })
    }

    scoreSnapshotRef.current = next
  }, [items])

  if (items.length === 0) {
    if (config.emptyMode === "hide") return null
    return (
      <div className="relative overflow-hidden border-b border-border bg-primary text-primary-foreground">
        <div className="flex">
          <TickerEmptyState config={config} channel="primary" />
        </div>
      </div>
    )
  }

  // Triple the items so the marquee loop is seamless
  const looped = [...items, ...items, ...items]

  return (
    <TickerMarqueeTrack
      itemCount={items.length}
      className="relative overflow-hidden border-b border-border bg-primary text-primary-foreground"
    >
      {looped.map((item, index) => (
        <TickerItemRenderer
          key={`${item.id}-${index}`}
          item={item}
          index={index % items.length}
          totalItems={items.length}
          scorePulsing={pulsingIds.has(item.id ?? "")}
        />
      ))}
    </TickerMarqueeTrack>
  )
}
