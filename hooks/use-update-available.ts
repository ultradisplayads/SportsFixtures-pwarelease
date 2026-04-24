"use client"

// Section 09 — Update Detection Hook
// Monitors the service worker registration for new waiting workers and
// exposes a controlled activation path via activateUpdate().
// The existing ServiceWorkerRegistration component handles the toast prompt;
// this hook provides the normalized UpdateState for components/pwa/* banners.

import { useEffect, useState } from "react"
import type { UpdateState } from "@/types/pwa"

export function useUpdateAvailable() {
  const [updateState, setUpdateState] = useState<UpdateState>("idle")
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    let cancelled = false

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (cancelled || !registration) return

      // A worker is already waiting (e.g. app was reopened after a deploy)
      if (registration.waiting) {
        setWaitingWorker(registration.waiting)
        setUpdateState("available")
      }

      registration.addEventListener("updatefound", () => {
        const worker = registration.installing
        if (!worker || cancelled) return
        setUpdateState("checking")

        worker.addEventListener("statechange", () => {
          if (cancelled) return
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingWorker(worker)
            setUpdateState("available")
          }
        })
      })
    })

    // After the SW controller changes (SKIP_WAITING was accepted), mark updated
    const handleControllerChange = () => {
      if (!cancelled) setUpdateState("updated")
    }
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange)

    return () => {
      cancelled = true
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange)
    }
  }, [])

  function activateUpdate() {
    if (!waitingWorker) return
    setUpdateState("activating")
    waitingWorker.postMessage({ type: "SKIP_WAITING" })
  }

  return { updateState, activateUpdate }
}
