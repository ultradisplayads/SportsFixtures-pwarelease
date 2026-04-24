"use client"

// components/admin/control-plane-error-state.tsx
// Section 12 — Error state for admin panels when the control-plane snapshot
// failed to load. Shows the error message and the safe-defaults notice.

import { AlertCircle } from "lucide-react"

type Props = {
  error: string | null
}

export function ControlPlaneErrorState({ error }: Props) {
  if (!error) return null
  return (
    <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-destructive">
          Control plane unavailable
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {error} — displaying safe defaults below.
        </p>
      </div>
    </div>
  )
}
