"use client"

// components/platform/install-prompt-card.tsx
// Section 09 — Card-style install prompt.
// Larger, more prominent variant than components/pwa/install-banner.tsx.
// Use on empty states, onboarding screens, and settings pages.
// Does not manage its own state — consumes useInstallPrompt().

import { Download, X, Smartphone } from "lucide-react"
import { useInstallPrompt } from "@/hooks/use-install-prompt"

interface InstallPromptCardProps {
  /** Override the heading text */
  title?: string
  /** Override the body text */
  description?: string
  className?: string
}

export function InstallPromptCard({
  title = "Install Sports Fixtures",
  description = "Get faster access, offline support, and a full app experience.",
  className = "",
}: InstallPromptCardProps) {
  const { installState, promptInstall, dismissInstall } = useInstallPrompt()

  if (installState !== "available") return null

  return (
    <div
      className={[
        "rounded-2xl border border-border bg-card p-5 shadow-sm",
        className,
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Smartphone className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => promptInstall()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Install
            </button>
            <button
              onClick={dismissInstall}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={dismissInstall}
          className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
