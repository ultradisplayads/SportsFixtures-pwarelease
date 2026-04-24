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

  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase shrink-0 ${badgeClass}`}
      aria-label={minute}
    >
      {minute}
    </span>
  )
}
