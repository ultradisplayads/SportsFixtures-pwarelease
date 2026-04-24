"use client"

// components/ticker/secondary-ticker.tsx
// Section 15.A — Secondary ticker rail (breaking news / TV / promos).
//
// Extracted from SecondaryTickerRail in live-ticker.tsx.
// Rotates through items with a fade transition every 5 seconds.
// Returns null when there are no items — the parent shell decides
// whether to render this rail at all.

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import type { TickerItem } from "@/types/ticker"
import { TickerItemRenderer } from "@/components/ticker/ticker-item-renderer"

// ── Rotating index hook ───────────────────────────────────────────────────────

function useRotatingIndex(
  total: number,
  intervalMs: number,
): [number, Dispatch<SetStateAction<number>>] {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (total < 2) return
    const t = setInterval(() => setIdx((i) => (i + 1) % total), intervalMs)
    return () => clearInterval(t)
  }, [total, intervalMs])

  return [idx, setIdx]
}

// ── Component ─────────────────────────────────────────────────────────────────

interface SecondaryTickerProps {
  items: TickerItem[]
}

export function SecondaryTicker({ items }: SecondaryTickerProps) {
  const [idx] = useRotatingIndex(items.length, 5000)
  const [visible, setVisible] = useState(true)
  const prevIdxRef = useRef(idx)

  // Fade out → swap → fade in on index change
  useEffect(() => {
    if (idx === prevIdxRef.current) return
    setVisible(false)
    const t = setTimeout(() => {
      prevIdxRef.current = idx
      setVisible(true)
    }, 200)
    return () => clearTimeout(t)
  }, [idx])

  if (items.length === 0) return null

  const current = items[prevIdxRef.current] ?? items[0]

  return (
    <div className="flex min-h-[36px] items-center gap-2 border-b border-border bg-card px-3 py-2">
      <div
        className="min-w-0 flex-1 transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <TickerItemRenderer item={current} index={0} totalItems={1} />
      </div>
      {items.length > 1 && (
        <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
          {idx + 1}/{items.length}
        </span>
      )}
    </div>
  )
}
