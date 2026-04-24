"use client"

// components/ticker/ticker-breaking-item.tsx
// Section 15 — Breaking news + TV now item display for the secondary ticker rail.
//
// Renders the type-specific label (Breaking / TV) and headline.
// Does not own tap logic — parent calls useTickerItemTap.

import { Zap, Tv } from "lucide-react"
import type { TickerItem } from "@/types/ticker"

interface TickerBreakingItemProps {
  item: TickerItem
}

/**
 * Strip a trailing " - <source>" suffix from a headline when the source label
 * is already shown separately. Many RSS feeds embed the publication name at the
 * end of the title (e.g. "Trade Rumours - Daily Norseman"). Without this, the
 * source appears twice in the ticker.
 */
function cleanHeadline(headline: string, label?: string | null): string {
  if (!label) return headline
  const suffix = ` - ${label}`
  if (headline.endsWith(suffix)) return headline.slice(0, -suffix.length)
  // Also handle em-dash variants
  const emSuffix = ` — ${label}`
  if (headline.endsWith(emSuffix)) return headline.slice(0, -emSuffix.length)
  return headline
}

export function TickerBreakingItem({ item }: TickerBreakingItemProps) {
  if (item.type === "breaking_news") {
    const headline = cleanHeadline(item.headline, item.label)
    return (
      <span className="flex items-center gap-2 min-w-0">
        <span className="flex items-center gap-1 shrink-0">
          <Zap className="h-3 w-3 text-red-400" aria-hidden="true" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-red-400">Breaking</span>
        </span>
        <span className="truncate text-sm font-medium">{headline}</span>
        {item.label && (
          <span className="shrink-0 text-xs opacity-60">{item.label}</span>
        )}
      </span>
    )
  }

  if (item.type === "tv_now") {
    return (
      <span className="flex items-center gap-2 min-w-0">
        <span className="flex items-center gap-1 shrink-0">
          <Tv className="h-3 w-3 text-blue-400" aria-hidden="true" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-blue-400">TV</span>
        </span>
        <span className="truncate text-sm font-medium">{item.headline}</span>
        {item.label && (
          <span className="shrink-0 text-xs opacity-60">{item.label}</span>
        )}
      </span>
    )
  }

  // Fallback for secondary non-breaking items (promos, venue messages, sponsors)
  return (
    <span className="flex items-center gap-2 min-w-0">
      <span className="truncate text-sm font-medium">{item.headline}</span>
      {item.label && (
        <span className="shrink-0 text-xs opacity-60">{item.label}</span>
      )}
    </span>
  )
}
