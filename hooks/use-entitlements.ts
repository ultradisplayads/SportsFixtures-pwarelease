"use client"

import { useEffect, useState, useRef } from "react"
import type { EntitlementsResponse, EntitlementKey, ModuleGate } from "@/types/monetization"
import type { NormalizedEnvelope } from "@/types/contracts"
import { resolveModuleGate } from "@/lib/monetization"

export function useEntitlements() {
  const [data, setData]         = useState<EntitlementsResponse | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const cancelRef               = useRef(false)

  useEffect(() => {
    cancelRef.current = false
    setLoading(true)
    setError(null)

    fetch("/api/entitlements", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load entitlements")
        return res.json() as Promise<NormalizedEnvelope<EntitlementsResponse>>
      })
      .then((envelope) => {
        // Unwrap the normalized envelope — consumers see EntitlementsResponse only
        if (!cancelRef.current) setData(envelope.data ?? null)
      })
      .catch((err) => {
        if (!cancelRef.current)
          setError(err?.message ?? "Failed to load entitlements")
      })
      .finally(() => {
        if (!cancelRef.current) setLoading(false)
      })

    return () => {
      cancelRef.current = true
    }
  }, [])

  // Convenience: resolve a single gate ad-hoc without the full gate list
  function getGate(
    moduleKey: string,
    requiredEntitlement?: EntitlementKey,
  ): ModuleGate {
    return resolveModuleGate({
      moduleKey,
      requiredEntitlement,
      profile: data?.profile ?? null,
    })
  }

  // Convenience: look up a gate from the pre-built gate list
  function findGate(moduleKey: string): ModuleGate | undefined {
    return data?.gates.find((g) => g.moduleKey === moduleKey)
  }

  const profile  = data?.profile ?? null
  const gates    = data?.gates   ?? []
  const plans    = data?.plans   ?? []
  const tier     = profile?.membershipTier ?? "free"
  const isPremium =
    tier !== "free" && tier !== "bronze"

  return { data, isLoading, error, profile, gates, plans, tier, isPremium, getGate, findGate }
}
