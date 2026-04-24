"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import type { TickerFeedResponse } from "@/types/ticker"
import { DEFAULT_TICKER_CONFIG } from "@/types/ticker"

interface UseTickerFeedOptions {
  sport?: string
  channel?: "primary" | "secondary" | "all"
  autoRefresh?: boolean
}

interface UseTickerFeedResult {
  data: TickerFeedResponse | null
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useTickerFeed(options: UseTickerFeedOptions = {}): UseTickerFeedResult {
  const { sport = "soccer", channel = "all", autoRefresh = true } = options

  const [data, setData] = useState<TickerFeedResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchFeed = useCallback(async () => {
    const params = new URLSearchParams({ sport })
    if (channel !== "all") params.set("channel", channel)

    try {
      const res = await fetch(`/api/ticker/feed?${params.toString()}`, {
        cache: "no-store",
      })
      if (!res.ok) throw new Error(`Ticker feed error: ${res.status}`)
      const json: TickerFeedResponse = await res.json()
      if (isMountedRef.current) {
        setData(json)
        setError(null)
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err?.message || "Failed to load ticker feed")
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [sport, channel])

  // Initial mount: fetch once and set the mounted flag
  useEffect(() => {
    isMountedRef.current = true
    setIsLoading(true)
    fetchFeed()
    return () => {
      isMountedRef.current = false
    }
  }, [fetchFeed])

  // Separate effect for the auto-refresh interval.
  // Re-runs whenever autoRefresh, fetchFeed, or the server-returned refreshSeconds
  // changes — so operator config changes take effect without a deploy.
  // Bug fix: previously read data?.config?.refreshSeconds from state captured at
  // mount time (always null on first render), meaning the interval always used the
  // fallback and never updated to the server-configured value.
  const refreshSeconds = data?.config?.refreshSeconds ?? DEFAULT_TICKER_CONFIG.refreshSeconds ?? 30
  useEffect(() => {
    if (!autoRefresh) return
    intervalRef.current = setInterval(fetchFeed, refreshSeconds * 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchFeed, autoRefresh, refreshSeconds])

  return { data, isLoading, error, refresh: fetchFeed }
}
