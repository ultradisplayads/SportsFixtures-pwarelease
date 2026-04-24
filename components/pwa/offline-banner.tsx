"use client"

// Section 09 — Normalized Offline Banner (components/pwa/)
// This is the Section 09 normalized version, consumed by AppShellGuard.
// The existing components/offline-banner.tsx is preserved and unchanged.

import { WifiOff } from "lucide-react"

interface OfflineBannerProps {
  visible: boolean
}

export function OfflineBanner({ visible }: OfflineBannerProps) {
  if (!visible) return null

  return (
    <div className="mx-4 mb-3 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
        <WifiOff className="h-4 w-4 shrink-0 text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-200">{"You're offline"}</p>
          <p className="text-xs text-amber-100/70">
            Some live data and actions may be temporarily unavailable.
          </p>
        </div>
      </div>
    </div>
  )
}
