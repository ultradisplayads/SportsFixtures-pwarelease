"use client"

// components/ticker/ticker-breaking-item.tsx
// Section 15 — Breaking news + TV now item display for the secondary ticker rail.
//
// Renders the type-specific label (Breaking / TV) and headline.
// Does not own tap logic — parent calls useTickerItemTap.

import { Tv } from "lucide-react"
import type { TickerItem } from "@/types/ticker"

interface TickerBreakingItemProps {
  item: TickerItem
}

const MAX_HEADLINE_CHARS = 64

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

function clampHeadline(headline: string): string {
  if (headline.length <= MAX_HEADLINE_CHARS) return headline
  return `${headline.slice(0, MAX_HEADLINE_CHARS - 1).trimEnd()}…`
}

export function TickerBreakingItem({ item }: TickerBreakingItemProps) {
  if (item.type === "breaking_news") {
    const headline = clampHeadline(cleanHeadline(item.headline, item.label))
    return (
      <span className="flex min-w-0 w-full items-center gap-2">
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.65)]" aria-hidden="true" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-red-400">Breaking</span>
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{headline}</span>
        {item.label && (
          <span className="max-w-[8rem] shrink-0 truncate text-xs opacity-60">{item.label}</span>
        )}
      </span>
    )
  }

  if (item.type === "tv_now") {
    const headline = clampHeadline(item.headline)
    return (
      <span className="flex min-w-0 w-full items-center gap-2">
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-live shadow-[0_0_8px_rgba(34,197,94,0.65)]" aria-hidden="true" />
          <Tv className="h-3 w-3 text-live" aria-hidden="true" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-live">Live</span>
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{headline}</span>
        {item.label && (
          <span className="max-w-[8rem] shrink-0 truncate text-xs opacity-60">{item.label}</span>
        )}
      </span>
    )
  }

  // Fallback for secondary non-breaking items (promos, venue messages, sponsors)
  const headline = clampHeadline(item.headline)
  return (
    <span className="flex min-w-0 w-full items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{headline}</span>
      {item.label && (
        <span className="max-w-[8rem] shrink-0 truncate text-xs opacity-60">{item.label}</span>
      )}
    </span>
  )
}
