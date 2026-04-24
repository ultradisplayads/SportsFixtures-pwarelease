"use client"

// hooks/use-tournament-mode.ts
// Section 14 — Tournament Mode React Hook
//
// Fetches and exposes normalized tournament mode state + resolved surface decisions.
// Components must consume this hook rather than calling /api/tournament-mode directly.
//
// Pattern mirrors use-control-plane.ts: single fetch, safe defaults, no throw.

import { useEffect, useState, useCallback } from "react"
import type { TournamentModeApiResponse, TournamentModeState, TournamentSurfaceDecision } from "@/types/tournament-mode"
import { TOURNAMENT_MODE_OFF } from "@/lib/tournament-mode"
import { resolveTournamentSurfaceDecision } from "@/lib/tournament-surface"

export type UseTournamentModeResult = {
  /** Raw normalized state from the API. */
  state: TournamentModeState
  /** Fully resolved surface decisions — use these in components, not raw state. */
  surface: TournamentSurfaceDecision
  isLoading: boolean
  error: string | null
  /** Refetch on demand (e.g. after admin changes). */
  refetch: () => void
}

export function useTournamentMode(): UseTournamentModeResult {
  const [data, setData] = useState<TournamentModeApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/tournament-mode", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load tournament mode")
        const json: TournamentModeApiResponse = await res.json()
        if (!cancelled) setData(json)
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Failed to load tournament mode")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [tick])

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  const state = data?.state ?? TOURNAMENT_MODE_OFF
  const surface = resolveTournamentSurfaceDecision(state)

  return { state, surface, isLoading, error, refetch }
}
