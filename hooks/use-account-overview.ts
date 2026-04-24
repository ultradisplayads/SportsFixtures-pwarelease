"use client"

// hooks/use-account-overview.ts
// Fetches the NormalizedEnvelope<AccountOverviewResponse> from /api/account/overview
// and unwraps .data for consumers.
// Works for both signed-in and anonymous/device-based users.
// Exposes a refresh() function so forms can invalidate after a successful save.

import { useEffect, useState, useCallback, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import type { AccountOverviewResponse } from "@/types/account"
import type { NormalizedEnvelope, DataFreshness, DataAvailability } from "@/types/contracts"

export function useAccountOverview() {
  const { user, isAnonymous, deviceToken } = useAuth()
  const [data, setData] = useState<AccountOverviewResponse | null>(null)
  const [freshness, setFreshness] = useState<DataFreshness>("unknown")
  const [availability, setAvailability] = useState<DataAvailability>("unavailable")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cancelRef = useRef(false)

  const load = useCallback(async () => {
    cancelRef.current = false
    setIsLoading(true)
    setError(null)

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (user?.jwt) headers["Authorization"] = `Bearer ${user.jwt}`
      if (deviceToken) headers["x-device-token"] = deviceToken

      const res = await fetch("/api/account/overview", {
        headers,
        cache: "no-store",
      })
      if (!res.ok) throw new Error("Failed to load account overview")

      // Unwrap normalized envelope
      const envelope: NormalizedEnvelope<AccountOverviewResponse> = await res.json()
      if (!cancelRef.current) {
        setData(envelope.data ?? null)
        setFreshness(envelope.freshness)
        setAvailability(envelope.availability)
        if (envelope.unavailableReason) setError(envelope.unavailableReason)
      }
    } catch (err: any) {
      if (!cancelRef.current) {
        setError(err?.message ?? "Failed to load account overview")
        setAvailability("unavailable")
      }
    } finally {
      if (!cancelRef.current) setIsLoading(false)
    }
  }, [user?.jwt, deviceToken])

  useEffect(() => {
    load()
    return () => { cancelRef.current = true }
  }, [load])

  return {
    data,
    freshness,
    availability,
    isLoading,
    error,
    refresh: load,
    // Convenience shortcuts — unchanged from before
    profile: data?.profile ?? null,
    security: data?.security ?? null,
    preferences: data?.preferences ?? null,
    consent: data?.consent ?? null,
    deletion: data?.deletion ?? null,
    isAnonymous,
  }
}
