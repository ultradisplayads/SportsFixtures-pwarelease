"use client"

// hooks/use-control-plane.ts
// Section 12 — Control-Plane React Hook
//
// Fetches the normalized operator configuration snapshot.
// The frontend reads exactly this hook — no individual config documents.
// Exposes feature flag and module config helpers directly to avoid
// requiring consumers to import lib/feature-flags or lib/control-plane separately.

import { useEffect, useState, useCallback } from "react"
import type { ControlPlaneSnapshot, FeatureFlagKey } from "@/types/control-plane"
import { EMPTY_SNAPSHOT } from "@/lib/control-plane"
import { isFeatureEnabled } from "@/lib/feature-flags"
import { getEnabledHomepageModules } from "@/lib/control-plane"

export type UseControlPlaneResult = {
  data: ControlPlaneSnapshot | null
  isLoading: boolean
  error: string | null
  /** Shorthand: check if a feature flag is enabled */
  isEnabled: (key: FeatureFlagKey) => boolean
  /** Ordered, enabled homepage modules for rendering */
  enabledModules: ReturnType<typeof getEnabledHomepageModules>
  /** Refetch the snapshot on demand (e.g. after admin save) */
  refetch: () => void
}

export function useControlPlane(): UseControlPlaneResult {
  const [data, setData] = useState<ControlPlaneSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/control-plane", { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to load control plane")
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "Failed to load control plane")
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

  const isEnabled = useCallback(
    (key: FeatureFlagKey) => isFeatureEnabled(data?.featureFlags, key),
    [data],
  )

  const enabledModules = getEnabledHomepageModules(data?.homepageModules)

  return { data, isLoading, error, isEnabled, enabledModules, refetch }
}
