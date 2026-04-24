"use client"

import { useState, useEffect } from "react"
import { X, Download } from "lucide-react"
import { triggerHaptic } from "@/lib/haptic-feedback"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already installed or previously dismissed
    if (localStorage.getItem("sf_install_dismissed")) return
    if (window.matchMedia("(display-mode: standalone)").matches) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Delay showing the banner so it doesn't appear immediately
      setTimeout(() => setShowBanner(true), 3000)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    triggerHaptic("medium")
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setShowBanner(false)
      localStorage.setItem("sf_install_dismissed", "1")
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    triggerHaptic("light")
    setDismissed(true)
    setShowBanner(false)
    localStorage.setItem("sf_install_dismissed", "1")
  }

  if (!showBanner || dismissed) return null

  return (
    <div className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Install Sports Fixtures</p>
          <p className="text-xs text-muted-foreground">Add to home screen for the best experience</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
