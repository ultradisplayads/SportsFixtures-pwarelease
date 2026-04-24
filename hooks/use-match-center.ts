"use client"
// ── hooks/use-match-center.ts ─────────────────────────────────────────────────
//
// Centralised match-center state hook.
// All match-center tabs must consume data from this hook,
// not from independent ad-hoc fetches.
//
// Supports:
//   • one-shot load on mount
//   • configurable live-polling interval (disabled by default)
//   • manual refresh via refresh()
//   • graceful degradation — partial/unavailable envelopes do not throw

import { useState, useEffect, useRef, useCallback } from "react"
import type { MatchCenterResponse } from "@/types/match-center"

const DEFAULT_POLL_INTERVAL_MS = 0 // disabled; callers can set e.g. 30_000 for live events

export interface UseMatchCenterResult {
  data: MatchCenterResponse | null
  isLoading: boolean
  error: string | null
  refresh: () => void
  lastFetchedAt: string | null
}

export function useMatchCenter(
  eventId: string | undefined,
  options?: {
    /** Set a positive ms value to enable live polling. 0 = disabled. */
    pollIntervalMs?: number
  }
): UseMatchCenterResult {
  const [data, setData] = useState<MatchCenterResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null)
  const cancelledRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const pollInterval = options?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS

  const run = useCallback(
    async (silent = false) => {
      if (!eventId || !/^\d+$/.test(eventId)) return
      if (!silent) setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/match-center/${eventId}`, {
          cache: "no-store",
        })
        if (!res.ok) throw new Error(`Match center request failed (${res.status})`)
        const json: MatchCenterResponse = await res.json()
        if (!cancelledRef.current) {
          setData(json)
          setLastFetchedAt(new Date().toISOString())
        }
      } catch (err: any) {
        if (!cancelledRef.current) {
          setError(err?.message || "Failed to load match center data")
        }
      } finally {
        if (!cancelledRef.current) {
          setIsLoading(false)
        }
      }
    },
    [eventId]
  )

  // Initial fetch
  useEffect(() => {
    cancelledRef.current = false
    run(false)

    // Live polling if configured
    if (pollInterval > 0) {
      intervalRef.current = setInterval(() => run(true), pollInterval)
    }

    return () => {
      cancelledRef.current = true
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [run, pollInterval])

  const refresh = useCallback(() => {
    run(false)
  }, [run])

  return { data, isLoading, error, refresh, lastFetchedAt }
}
