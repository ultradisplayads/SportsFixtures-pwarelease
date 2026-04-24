"use client"

// Section 09 — App Resume / Background Behavior Hook
// Fires a callback when the app regains visibility after being backgrounded.
// Used by live surfaces (ticker, livescores, match-center) to request a fresh
// data fetch on resume without hard-refreshing the entire navigation state.

import { useEffect, useRef } from "react"

interface UseAppResumeOptions {
  /** Called when the page becomes visible again after being hidden. */
  onResume?: () => void
  /**
   * Minimum milliseconds the app must have been hidden before onResume fires.
   * Prevents false triggers from brief tab switches.
   * Default: 30_000 (30 seconds).
   */
  minHiddenMs?: number
}

export function useAppResume({
  onResume,
  minHiddenMs = 30_000,
}: UseAppResumeOptions = {}) {
  const hiddenAtRef = useRef<number | null>(null)

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now()
        return
      }

      // Page became visible again
      if (document.visibilityState === "visible") {
        const hiddenAt = hiddenAtRef.current
        hiddenAtRef.current = null

        if (hiddenAt !== null) {
          const hiddenMs = Date.now() - hiddenAt
          if (hiddenMs >= minHiddenMs && onResume) {
            onResume()
          }
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [onResume, minHiddenMs])
}
