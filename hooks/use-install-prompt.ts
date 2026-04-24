"use client"

// Section 09 — Normalized Install Prompt Hook
// Encapsulates the beforeinstallprompt lifecycle so components never touch
// the deferred event directly. After dismissal the state is persisted to
// sessionStorage so the banner is not re-shown in the same session.

import { useEffect, useState } from "react"
import type { InstallState } from "@/types/pwa"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installState, setInstallState] = useState<InstallState>("unknown")

  useEffect(() => {
    // Already installed — no prompt needed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstallState("installed")
      return
    }
    // Dismissed in a previous session — respect it
    if (localStorage.getItem("sf_install_dismissed")) {
      setInstallState("dismissed")
      return
    }

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setInstallState("available")
    }

    function onInstalled() {
      setInstallState("installed")
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  async function promptInstall(): Promise<{ outcome: string }> {
    if (!deferredPrompt) return { outcome: "unavailable" }
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    const outcome = choice?.outcome ?? "dismissed"
    if (outcome === "accepted") {
      setInstallState("installed")
    } else {
      setInstallState("dismissed")
      localStorage.setItem("sf_install_dismissed", "1")
    }
    setDeferredPrompt(null)
    return { outcome }
  }

  function dismissInstall() {
    setInstallState("dismissed")
    localStorage.setItem("sf_install_dismissed", "1")
  }

  return { installState, promptInstall, dismissInstall }
}
