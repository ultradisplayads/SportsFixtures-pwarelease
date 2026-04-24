"use client"

// Section 09 — Install Banner
// Controlled by the parent (AppShellGuard) which decides when to show it.
// Does not manage its own install prompt state — that lives in useInstallPrompt.

import { Download, X } from "lucide-react"
import { triggerHaptic } from "@/lib/haptic-feedback"

interface InstallBannerProps {
  visible: boolean
  onInstall: () => void
  onDismiss: () => void
}

export function InstallBanner({ visible, onInstall, onDismiss }: InstallBannerProps) {
  if (!visible) return null

  return (
    <div className="mx-4 mb-3 animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-md">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install Sports Fixtures</p>
          <p className="text-xs text-muted-foreground">
            Faster access, offline support, and app-style navigation.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => { triggerHaptic("medium"); onInstall() }}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Install
          </button>
          <button
            onClick={() => { triggerHaptic("light"); onDismiss() }}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
