"use client"

import { useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"

const UPDATE_CHECK_INTERVAL = 30 * 60 * 1000

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return
    if (!window.isSecureContext && window.location.hostname !== "localhost") return

    const hostname = window.location.hostname
    const isPreviewHost = hostname.includes("vusercontent.net") || hostname.endsWith(".vercel.app")
    if (isPreviewHost) return

    let registrationRef: ServiceWorkerRegistration | null = null
    let updateTimer: number | undefined
    let reloading = false
    let updateToastShown = false

    const promptForUpdate = (worker: ServiceWorker) => {
      if (updateToastShown) return
      updateToastShown = true
      // Notify UpdatePrompt banner component (components/platform/UpdatePrompt.tsx)
      window.dispatchEvent(new CustomEvent("sf:sw-update-available"))
      toast({
        title: "Update available",
        description: "A new version of Sports Fixtures is ready.",
        duration: 120000,
        action: (
          <ToastAction
            altText="Reload app"
            onClick={() => {
              worker.postMessage({ type: "SKIP_WAITING" })
            }}
          >
            Reload
          </ToastAction>
        ),
      })
    }

    const runUpdateCheck = () => {
      registrationRef?.update().catch(() => undefined)
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })
        registrationRef = registration

        if (registration.waiting) {
          promptForUpdate(registration.waiting)
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              promptForUpdate(newWorker)
            }
          })
        })

        updateTimer = window.setInterval(runUpdateCheck, UPDATE_CHECK_INTERVAL)
      } catch (error) {
        console.error("Service Worker registration failed:", error)
      }
    }

    const handleControllerChange = () => {
      if (reloading) return
      reloading = true
      window.location.reload()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        runUpdateCheck()
      }
    }

    const handleOnline = () => runUpdateCheck()

    registerSW()
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange)
    window.addEventListener("online", handleOnline)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange)
      window.removeEventListener("online", handleOnline)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      if (updateTimer) window.clearInterval(updateTimer)
      registrationRef = null
    }
  }, [])

  return null
}
