"use client"

// hooks/use-ticker-item-tap.ts
// Section 15 — Ticker item tap handler.
//
// Encapsulates haptic feedback + router navigation for a tapped ticker item.
// All ticker item components call this instead of scattering haptic + router calls.

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { triggerHaptic } from "@/lib/haptic-feedback"
import type { TickerItem } from "@/types/ticker"

interface UseTickerItemTapOptions {
  /** Called after haptic but before navigation. Return false to cancel navigation. */
  onBeforeNavigate?: (item: TickerItem) => boolean | void
}

interface UseTickerItemTapResult {
  handleTap: (item: TickerItem) => void
}

export function useTickerItemTap(options: UseTickerItemTapOptions = {}): UseTickerItemTapResult {
  const router = useRouter()
  const { onBeforeNavigate } = options

  const handleTap = useCallback(
    (item: TickerItem) => {
      triggerHaptic("light")

      if (onBeforeNavigate) {
        const shouldNavigate = onBeforeNavigate(item)
        if (shouldNavigate === false) return
      }

      if (!item.href || item.href === "#") return
      router.push(item.href)
    },
    [router, onBeforeNavigate],
  )

  return { handleTap }
}
