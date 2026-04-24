"use client"

// components/ticker/ticker-item-renderer.tsx
// Section 15 — Normalised ticker item renderer.
//
// Delegates all score badge rendering to TickerScoreDisplay and all
// breaking/tv display to TickerBreakingItem. Tap handling goes through
// useTickerItemTap so haptic + navigation are never scattered inline.

import Link from "next/link"
import type { TickerItem } from "@/types/ticker"
import { AnimatedLiveScoreItem } from "@/components/ticker/animated-live-score-item"
import { TickerBreakingItem } from "@/components/ticker/ticker-breaking-item"
import { useTickerItemTap } from "@/hooks/use-ticker-item-tap"

const SCORE_TYPES = new Set(["live_score", "match_event", "kickoff", "result"])
const SECONDARY_TYPES = new Set(["breaking_news", "tv_now", "promo", "venue_message", "sponsor"])

interface TickerItemRendererProps {
  item: TickerItem
  /** Position within the current rail. Used to omit the separator on the last item. */
  index?: number
  /** Total items in the current rail. Used to omit the separator on the last item. */
  totalItems?: number
  /**
   * Section 15.C: true only when this item's score changed in the latest feed
   * refresh. The score badge will briefly pulse. Never set this on items whose
   * score did not change — fake pulse effects degrade trust.
   */
  scorePulsing?: boolean
}

export function TickerItemRenderer({ item, index = 0, totalItems = 1, scorePulsing = false }: TickerItemRendererProps) {
  const { handleTap } = useTickerItemTap()
  const href = item.href ?? "#"
  const isLastItem = index === totalItems - 1
  const isScoreType = SCORE_TYPES.has(item.type)
  const isSecondaryType = SECONDARY_TYPES.has(item.type)

  const inner = (
    <span
      className="flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm hover:bg-primary/80 transition-colors cursor-pointer"
      onClick={() => handleTap(item)}
    >
      {/* Score/status badge — AnimatedLiveScoreItem handles pulse internally
          and can also accept the external scorePulsing override from the parent. */}
      {isScoreType && (
        <AnimatedLiveScoreItem item={item} scorePulsing={scorePulsing || undefined} />
      )}

      {/* Breaking news / TV / promo display */}
      {isSecondaryType ? (
        <TickerBreakingItem item={item} />
      ) : (
        <>
          {/* Headline */}
          <span className={`font-semibold ${item.type === "result" ? "opacity-70" : ""}`}>
            {item.headline}
          </span>

          {/* Label / league — not shown for secondary types (TickerBreakingItem handles it) */}
          {item.label && (
            <span className="text-xs opacity-60">{item.label}</span>
          )}
        </>
      )}

      {/* Separator dot — not on the last item before the seamless loop join */}
      {!isLastItem && <span className="text-xs opacity-30" aria-hidden="true">•</span>}
    </span>
  )

  // Items with no valid href render as plain spans (no nav, no a11y link noise)
  if (href === "#") return inner

  return (
    <Link href={href} className="flex shrink-0 items-center" prefetch={false}>
      {inner}
    </Link>
  )
}
