"use client"

// components/platform/UpdatePrompt.tsx
// Section 09 — Shows a non-intrusive toast when a new SW version is waiting.
// The user taps "Update" → sendSkipWaiting() → controllerchange → page reloads.

import { useUpdateAvailable } from "@/lib/pwa-manager"
import { sendSkipWaiting }    from "@/lib/sw-messages"
import { RefreshCw }          from "lucide-react"

export function UpdatePrompt() {
  const updateAvailable = useUpdateAvailable()

  if (!updateAvailable) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 px-4 w-full max-w-sm"
    >
      <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-card px-4 py-3 shadow-lg">
        <RefreshCw className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="flex-1 text-sm font-medium">A new version is available.</p>
        <button
          onClick={sendSkipWaiting}
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 active:opacity-80"
        >
          Update
        </button>
      </div>
    </div>
  )
}
