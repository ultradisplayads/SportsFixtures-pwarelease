"use client"

// Section 09 — Normalized Platform Status Hook
// Single shared source of truth for PWA runtime state.
// Components must NOT independently read navigator.onLine or
// matchMedia("display-mode: standalone") — they must consume this hook.

import { useEffect, useState } from "react"
import { deriveStandaloneMode } from "@/lib/pwa"
import type { PlatformStatus } from "@/types/pwa"

function deriveInitialNetwork(): PlatformStatus["network"] {
  if (typeof navigator === "undefined") return "unknown"
  return navigator.onLine ? "online" : "offline"
}

export function usePlatformStatus() {
  const [status, setStatus] = useState<PlatformStatus>({
    network: deriveInitialNetwork(),
    install: "unknown",
    update: "idle",
    isStandalone: typeof window !== "undefined" ? deriveStandaloneMode() : false,
    lastSyncAt: null,
  })

  useEffect(() => {
    // Recheck standalone now that window is available
    setStatus((prev) => ({ ...prev, isStandalone: deriveStandaloneMode() }))

    function goOnline() {
      setStatus((prev) => ({ ...prev, network: "online", lastSyncAt: new Date().toISOString() }))
    }
    function goOffline() {
      setStatus((prev) => ({ ...prev, network: "offline" }))
    }

    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)
    return () => {
      window.removeEventListener("online", goOnline)
      window.removeEventListener("offline", goOffline)
    }
  }, [])

  return { status, setStatus }
}
