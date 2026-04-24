"use client"

// hooks/use-live-score-animation.ts
// Section 15.C — Score change detection and pulse animation state.
//
// Extracted from the inline logic in live-ticker.tsx (PrimaryTickerRail).
// Rules:
//   - Pulse fires ONLY on real score changes (headline diff against prev snapshot).
//   - Pulse clears automatically after pulseDurationMs to prevent stale animation.
//   - Never pulse on first mount — there is no "previous" snapshot to compare.
//   - Returns a stable Set<string> of item IDs currently pulsing, plus the
//     snapshot updater so callers can feed fresh items each render.

import { useEffect, useRef, useState } from "react"
import type { TickerItem } from "@/types/ticker"

// Map<itemId, lastSeenHeadline>
type ScoreSnapshot = Map<string, string>

function detectScoreChanges(
  prev: ScoreSnapshot,
  next: TickerItem[],
): Set<string> {
  const changed = new Set<string>()
  for (const item of next) {
    if (!item.id) continue
    const prevHeadline = prev.get(item.id)
    // Only flag as changed if we've seen this item before (avoid first-mount pulse)
    if (prevHeadline !== undefined && prevHeadline !== item.headline) {
      changed.add(item.id)
    }
  }
  return changed
}

interface UseLiveScoreAnimationOptions {
  /** How long (ms) the pulse stays active before clearing. Default: 1500. */
  pulseDurationMs?: number
}

interface UseLiveScoreAnimationResult {
  /** Set of item IDs that should currently show the pulse ring. */
  pulsingIds: Set<string>
}

/**
 * Per-item score animation hook for use inside AnimatedLiveScoreItem.
 * Pulses whenever homeScore or awayScore changes between renders.
 * Returns `pulsing: true` for pulseDurationMs after a score change.
 */
export function useItemScoreAnimation(
  homeScore: number | string | null | undefined,
  awayScore: number | string | null | undefined,
  { pulseDurationMs = 1500 }: UseLiveScoreAnimationOptions = {},
): { pulsing: boolean } {
  const prevRef = useRef<{ home: typeof homeScore; away: typeof awayScore }>({
    home: homeScore,
    away: awayScore,
  })
  const [pulsing, setPulsing] = useState(false)

  useEffect(() => {
    const prev = prevRef.current
    const changed =
      prev.home !== undefined && // skip first mount
      (prev.home !== homeScore || prev.away !== awayScore)

    prevRef.current = { home: homeScore, away: awayScore }
    if (!changed) return

    setPulsing(true)
    const t = setTimeout(() => setPulsing(false), pulseDurationMs)
    return () => clearTimeout(t)
  }, [homeScore, awayScore, pulseDurationMs])

  return { pulsing }
}

export function useLiveScoreAnimation(
  items: TickerItem[],
  { pulseDurationMs = 1500 }: UseLiveScoreAnimationOptions = {},
): UseLiveScoreAnimationResult {
  const prevSnapshotRef = useRef<ScoreSnapshot>(new Map())
  const [pulsingIds, setPulsingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const changed = detectScoreChanges(prevSnapshotRef.current, items)

    // Always update the snapshot so next render has an accurate baseline
    const next: ScoreSnapshot = new Map()
    for (const item of items) {
      if (item.id) next.set(item.id, item.headline)
    }
    prevSnapshotRef.current = next

    if (changed.size === 0) return

    setPulsingIds(changed)
    const t = setTimeout(() => setPulsingIds(new Set()), pulseDurationMs)
    return () => clearTimeout(t)
  }, [items, pulseDurationMs])

  return { pulsingIds }
}
