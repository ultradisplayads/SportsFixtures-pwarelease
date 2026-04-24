"use client"

// components/platform/update-available-card.tsx
// Section 09 — Update available UI card.
// Consumes useSWUpdates() and surfaces an inline card when a new SW is waiting.
// Distinct from the toast in ServiceWorkerRegistration.tsx — use this on
// settings / profile pages where an inline call-to-action is more appropriate.

import { RefreshCw, X } from "lucide-react"
import { useState } from "react"
import { useSWUpdates } from "@/hooks/use-sw-updates"

interface UpdateAvailableCardProps {
  className?: string
}

export function UpdateAvailableCard({ className = "" }: UpdateAvailableCardProps) {
  const { updateState, activateUpdate } = useSWUpdates()
  const [dismissed, setDismissed] = useState(false)

  if (updateState !== "available" || dismissed) return null

  return (
    <div
      role="status"
      className={[
        "flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm",
        className,
      ].join(" ")}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <RefreshCw className="h-4 w-4 text-primary" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Update available</p>
        <p className="text-xs text-muted-foreground">A new version is ready to install.</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={activateUpdate}
          disabled={updateState === "activating" as any}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          Reload
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Dismiss update prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
