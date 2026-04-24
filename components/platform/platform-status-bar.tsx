"use client"

// components/platform/platform-status-bar.tsx
// Section 09 — Dev/debug status bar showing live PWA platform state.
// Only renders when NEXT_PUBLIC_ENABLE_DEV_PANEL="true".
// Shows: network state, standalone mode, SW update state, install state.

import { useNetworkStatus } from "@/hooks/use-network-status"
import { usePlatformStatus } from "@/hooks/use-platform-status"
import { useSWUpdates } from "@/hooks/use-sw-updates"

const enabled = process.env.NEXT_PUBLIC_ENABLE_DEV_PANEL === "true"

export function PlatformStatusBar() {
  const { networkState } = useNetworkStatus()
  const { status } = usePlatformStatus()
  const { updateState } = useSWUpdates()

  if (!enabled) return null

  const pill = (label: string, value: string, ok: boolean) => (
    <span
      key={label}
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium",
        ok ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400",
      ].join(" ")}
    >
      <span className="opacity-60">{label}:</span>
      {value}
    </span>
  )

  return (
    <div
      aria-hidden="true"
      className="fixed bottom-0 left-0 right-0 z-[9999] flex flex-wrap items-center gap-1.5 border-t border-border/40 bg-background/95 px-3 py-1.5 backdrop-blur"
    >
      {pill("net", networkState, networkState === "online")}
      {pill("standalone", String(status.isStandalone), status.isStandalone)}
      {pill("install", status.install, status.install === "installed")}
      {pill("sw", updateState, updateState === "idle")}
    </div>
  )
}
