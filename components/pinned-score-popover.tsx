"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell, ChevronRight, Pin, X } from "lucide-react"
import { SmartImage } from "@/components/assets/smart-image"
import {
  getPinnedScores,
  onPinnedScoresChange,
  unpinScore,
  updatePinnedScoresFromMatches,
  type PinnedScore,
} from "@/lib/pinned-scores"

const POLL_INTERVAL = 30_000

function statusClass(item: PinnedScore) {
  if (item.isLive) return "bg-green-500 text-white"
  if (item.status.toUpperCase() === "FT") return "bg-muted text-muted-foreground"
  return "bg-primary/10 text-primary"
}

export function PinnedScorePopover() {
  const [items, setItems] = useState<PinnedScore[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setItems(getPinnedScores())
    return onPinnedScoresChange(setItems)
  }, [])

  useEffect(() => {
    if (!items.length) return
    const refresh = async () => {
      try {
        const res = await fetch("/api/live", { cache: "no-store" })
        if (!res.ok) return
        const json = await res.json()
        const rows = Array.isArray(json.matches) ? json.matches : []
        updatePinnedScoresFromMatches(
          rows.map((row: any) => ({
            id: String(row.id),
            home: row.homeTeam,
            away: row.awayTeam,
            homeLogo: row.homeLogo,
            awayLogo: row.awayLogo,
            score:
              row.homeScore == null && row.awayScore == null
                ? "- - -"
                : `${row.homeScore ?? "-"} - ${row.awayScore ?? "-"}`,
            status: row.progress || "LIVE",
            isLive: true,
          })),
        )
      } catch {
        // keep the last pinned scores visible
      }
    }
    refresh()
    const timer = window.setInterval(refresh, POLL_INTERVAL)
    return () => window.clearInterval(timer)
  }, [items.length])

  if (!items.length) return null

  const liveCount = items.filter((item) => item.isLive).length
  const visibleItems = expanded ? items : items.slice(0, 1)

  return (
    <div className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-0 right-0 z-50 mx-auto w-full max-w-screen-sm px-3 md:max-w-screen-md">
      <div className="overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-xl">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex w-full items-center gap-3 border-b border-border bg-primary/10 px-3 py-2 text-left"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Pin className="h-4 w-4 fill-current" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-black">Pinned scores</span>
            <span className="block truncate text-xs text-muted-foreground">
              {items.length} pinned · {liveCount} live · updates every 30s
            </span>
          </span>
          <Bell className="h-4 w-4 text-primary" />
        </button>

        <div className="divide-y divide-border">
          {visibleItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2 px-3 py-2">
              <Link href={`/match/${item.id}`} className="min-w-0 flex flex-1 items-center gap-2">
                <SmartImage kind="team_badge" src={item.homeLogo} fallbackLabel={item.home} alt="" className="h-7 w-7 object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{item.home} vs {item.away}</p>
                  <p className="text-[10px] text-muted-foreground">Pinned to your home screen</p>
                </div>
                <SmartImage kind="team_badge" src={item.awayLogo} fallbackLabel={item.away} alt="" className="h-7 w-7 object-contain" />
                <span className="font-mono text-sm font-black">{item.score}</span>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${statusClass(item)}`}>
                  {item.status}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <button
                type="button"
                onClick={() => unpinScore(item.id)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Remove pinned score for ${item.home} vs ${item.away}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {!expanded && items.length > 1 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-full bg-muted/50 px-3 py-2 text-xs font-bold text-primary"
          >
            Show {items.length - 1} more pinned scores
          </button>
        )}
      </div>
    </div>
  )
}
