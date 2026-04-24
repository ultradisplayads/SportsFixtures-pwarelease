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
import { TickerItemRenderer } from "@/components/ticker/ticker-item-renderer"
import { TickerEmptyState } from "@/components/ticker/ticker-empty-state"
import { TickerMarqueeTrack } from "@/components/ticker/ticker-marquee-track"
import { useLiveScoreAnimation } from "@/hooks/use-live-score-animation"

interface PrimaryTickerProps {
  items: TickerItem[]
  config: TickerConfig
}

export function PrimaryTicker({ items, config }: PrimaryTickerProps) {
  // Section 15.C — detect real score changes; pulse only on genuine updates
  const { pulsingIds } = useLiveScoreAnimation(items)

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
