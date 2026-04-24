"use client"

// PWA manager — SW registration, online status tracking, update detection,
// and fixtures cache helpers.
// useOnlineStatus()    → consumed by components/offline-banner.tsx
// useUpdateAvailable() → consumed by components/platform/UpdatePrompt.tsx

import React from "react"

interface CachedFixtures {
  data: any[]
  timestamp: number
  expiresAt: number
}

class PWAManager {
  private readonly CACHE_KEY = "sports_fixtures_cache"
  private readonly CACHE_DURATION = 15 * 60 * 1000 // 15 minutes
  private onlineStatus = true
  private listeners: Set<(online: boolean) => void> = new Set()

  constructor() {
    if (typeof window !== "undefined") {
      this.onlineStatus = navigator.onLine
      this.setupListeners()
    }
  }

  private setupListeners() {
    window.addEventListener("online",  this.handleOnline)
    window.addEventListener("offline", this.handleOffline)
  }

  private handleOnline = () => {
    this.onlineStatus = true
    this.notifyListeners(true)
  }

  private handleOffline = () => {
    this.onlineStatus = false
    this.notifyListeners(false)
  }

  public isOnline(): boolean {
    return this.onlineStatus
  }

  public onStatusChange(callback: (online: boolean) => void) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notifyListeners(online: boolean) {
    this.listeners.forEach((listener) => listener(online))
  }

  // Cache fixtures data in localStorage for offline use
  public cacheFixtures(data: any[]): void {
    try {
      const cached: CachedFixtures = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION,
      }
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cached))
    } catch {
      // Storage quota exceeded or private browsing — fail silently
    }
  }

  // Return cached fixtures if still within expiry window
  public getCachedFixtures(): any[] | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY)
      if (!cached) return null

      const parsed: CachedFixtures = JSON.parse(cached)
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(this.CACHE_KEY)
        return null
      }

      return parsed.data
    } catch {
      return null
    }
  }

  public clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY)
  }
}

export const pwaManager = new PWAManager()

// React hook for online status — consumed by components/offline-banner.tsx
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = React.useState(
    typeof window !== "undefined" ? pwaManager.isOnline() : true,
  )

  React.useEffect(() => {
    const unsub = pwaManager.onStatusChange(setIsOnline)
    return () => { unsub() }
  }, [])

  return isOnline
}

// ── Service Worker registration ───────────────────────────────────────────────

/**
 * Registers /sw.js as the service worker.
 * Safe to call multiple times — the browser deduplicates registrations.
 * Dispatches "sf:sw-update-available" on window when a new SW is waiting.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined") return null
  if (!("serviceWorker" in navigator)) return null

  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" })

    // Listen for an update on the current registration
    reg.addEventListener("updatefound", () => {
      const newWorker = reg.installing
      if (!newWorker) return
      newWorker.addEventListener("statechange", () => {
        if (
          newWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          // A new SW is waiting — notify any mounted UpdatePrompt components
          window.dispatchEvent(new CustomEvent("sf:sw-update-available"))
        }
      })
    })

    // Reload the page when the SW takes control after skipWaiting
    let refreshing = false
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    })

    return reg
  } catch (err) {
    console.error("[PWA] SW registration failed:", err)
    return null
  }
}

// ── Update available hook ─────────────────────────────────────────────────────

/**
 * Returns true when a new service worker is waiting to take control.
 * Consumed by components/platform/UpdatePrompt.tsx.
 */
export function useUpdateAvailable(): boolean {
  const [available, setAvailable] = React.useState(false)

  React.useEffect(() => {
    const handler = () => setAvailable(true)
    window.addEventListener("sf:sw-update-available", handler)
    return () => window.removeEventListener("sf:sw-update-available", handler)
  }, [])

  return available
}
