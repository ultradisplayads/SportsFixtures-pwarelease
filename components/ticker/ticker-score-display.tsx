"use client"

// components/ticker/ticker-score-display.tsx
// Section 15 — Score chip for live/result/kickoff ticker items.
//
// Consumes ticker-score-formatter.ts exclusively — no raw formatting here.

import type { TickerItem } from "@/types/ticker"
import {
  formatTickerMinute,
  tickerMinuteBadgeClass,
} from "@/lib/ticker-score-formatter"

interface TickerScoreDisplayProps {
  item: TickerItem
}

export function TickerScoreDisplay({ item }: TickerScoreDisplayProps) {
  const minuteStr = item.minute != null ? String(item.minute) : null
  const minute = formatTickerMinute(minuteStr, item.type)
  const badgeClass = tickerMinuteBadgeClass(minuteStr, item.type)
  const isLive = item.type === "live_score" || item.type === "match_event"

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${badgeClass}`}
      aria-label={minute}
    >
      {isLive && (
        <span className="h-1.5 w-1.5 rounded-full bg-live shadow-[0_0_6px_rgba(34,197,94,0.75)]" aria-hidden="true" />
      )}
      {minute}
    </span>
  )
}
