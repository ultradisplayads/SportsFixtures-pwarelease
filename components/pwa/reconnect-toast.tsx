"use client"

// Section 09 — Reconnect Toast
// Shown briefly after the network comes back online.
// Auto-dismisses after 3 seconds — the parent (AppShellGuard) controls visibility.

import { Wifi } from "lucide-react"
import { useEffect } from "react"

interface ReconnectToastProps {
  visible: boolean
  onDismiss: () => void
}

export function ReconnectToast({ visible, onDismiss }: ReconnectToastProps) {
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(onDismiss, 3_000)
    return () => clearTimeout(timer)
  }, [visible, onDismiss])

  if (!visible) return null

  return (
    <div className="mx-4 mb-3 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
        <Wifi className="h-4 w-4 shrink-0 text-emerald-400" />
        <p className="text-sm text-emerald-100">{"Back online. Refreshing live data\u2026"}</p>
      </div>
    </div>
  )
}
