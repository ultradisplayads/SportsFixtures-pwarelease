"use client"

// hooks/use-network-status.ts
// Section 09 — Canonical network status hook.
// Wraps pwa-manager's useOnlineStatus() and extends it with:
//   - connection type detection (if available)
//   - a "reconnected" flash state for components that want to react to
//     going back online
// Components must use this hook instead of reading navigator.onLine directly.

import { useEffect, useState } from "react"
import { useOnlineStatus } from "@/lib/pwa-manager"
import type { NetworkState } from "@/types/platform"

export type NetworkStatusResult = {
  /** Canonical three-state network indicator */
  networkState: NetworkState
  /** True when the browser reports online */
  isOnline: boolean
  /** True for the 3 s immediately after reconnecting */
  justReconnected: boolean
  /** Effective connection type if the Network Information API is available */
  connectionType: string | null
}

export function useNetworkStatus(): NetworkStatusResult {
  const isOnline = useOnlineStatus()
  const [justReconnected, setJustReconnected] = useState(false)
  const [connectionType, setConnectionType] = useState<string | null>(null)
  const [prevOnline, setPrevOnline] = useState(isOnline)

  useEffect(() => {
    // Detect effective connection type (Chrome/Android only)
    const conn = (navigator as any)?.connection
    if (conn) {
      setConnectionType(conn.effectiveType ?? null)
      const onChange = () => setConnectionType(conn.effectiveType ?? null)
      conn.addEventListener("change", onChange)
      return () => conn.removeEventListener("change", onChange)
    }
  }, [])

  useEffect(() => {
    if (isOnline && !prevOnline) {
      // Transition from offline → online
      setJustReconnected(true)
      const t = setTimeout(() => setJustReconnected(false), 3000)
      return () => clearTimeout(t)
    }
    setPrevOnline(isOnline)
  }, [isOnline, prevOnline])

  const networkState: NetworkState = isOnline ? "online" : "offline"

  return { networkState, isOnline, justReconnected, connectionType }
}
