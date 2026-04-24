"use client"

// hooks/use-sw-updates.ts
// Section 09 — Service Worker update state hook.
// Extracts SW update detection from ServiceWorkerRegistration.tsx so
// components can react to update availability without an imperative toast.
// The ServiceWorkerRegistration component handles the actual SW registration;
// this hook only reads the resulting update state.

import { useEffect, useState, useRef, useCallback } from "react"
import type { UpdateState } from "@/types/platform"
import { sendSkipWaiting } from "@/lib/sw-messages"

export type UseSWUpdatesResult = {
  updateState: UpdateState
  /** Call to activate the waiting SW. Triggers a page reload via controllerchange. */
  activateUpdate: () => void
}

export function useSWUpdates(): UseSWUpdatesResult {
  const [updateState, setUpdateState] = useState<UpdateState>("idle")
  const waitingWorkerRef = useRef<ServiceWorker | null>(null)

  useEffect(() => {
    if (typeof navigator === "undefined") return
    if (!("serviceWorker" in navigator)) return

    let cancelled = false

    const onUpdateFound = (registration: ServiceWorkerRegistration) => {
      const newWorker = registration.installing
      if (!newWorker) return

      newWorker.addEventListener("statechange", () => {
        if (cancelled) return
        if (
          newWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          waitingWorkerRef.current = newWorker
          setUpdateState("available")
        }
      })
    }

    const observe = (registration: ServiceWorkerRegistration) => {
      // Already waiting when we arrive
      if (registration.waiting && navigator.serviceWorker.controller) {
        waitingWorkerRef.current = registration.waiting
        setUpdateState("available")
      }
      registration.addEventListener("updatefound", () =>
        onUpdateFound(registration),
      )
    }

    navigator.serviceWorker.getRegistration("/").then((reg) => {
      if (cancelled || !reg) return
      observe(reg)
    })

    return () => {
      cancelled = true
    }
  }, [])

  const activateUpdate = useCallback(() => {
    if (!waitingWorkerRef.current) return
    setUpdateState("activating")
    sendSkipWaiting()
    // Page reload is triggered by the controllerchange handler in
    // ServiceWorkerRegistration.tsx — we do not reload here.
  }, [])

  return { updateState, activateUpdate }
}
