"use client"

// components/platform/offline-banner.tsx
// Section 09 — Canonical offline/reconnected banner.
// Uses useNetworkStatus() — the single source of truth for network state.
// The existing components/offline-banner.tsx (which reads from pwa-manager)
// remains for backward compatibility; new surfaces should import from here.

import { WifiOff, Wifi } from "lucide-react"
import { useNetworkStatus } from "@/hooks/use-network-status"

export function OfflineBanner() {
  const { isOnline, justReconnected } = useNetworkStatus()

  // Hidden when online and not in the brief reconnect flash window
  if (isOnline && !justReconnected) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        "fixed left-0 right-0 top-0 z-50 px-4 py-2 text-center text-sm font-medium transition-colors",
        isOnline
          ? "bg-[hsl(var(--success,142_71%_45%))] text-white"
          : "bg-destructive text-destructive-foreground",
      ].join(" ")}
    >
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" aria-hidden="true" />
            <span>Back online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" aria-hidden="true" />
            <span>{"You're offline — showing cached content"}</span>
          </>
        )}
      </div>
    </div>
  )
}
