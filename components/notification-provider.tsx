"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { getDeviceToken } from "@/lib/favourites-api"

/** Explicit app brand icon for OS notifications — not a sports entity fallback. */
const APP_BRAND_ICON = "/logo.png"

// ── Types ─────────────────────────────────────────────────────────────────────
export interface PushPreferences {
  matchStart: boolean
  goals: boolean
  halftime: boolean
  fulltime: boolean
  cards: boolean
  lineups: boolean
  venueOffers: boolean
  advertising: boolean
}

interface NotificationContextType {
  permission: NotificationPermission
  isSubscribed: boolean
  isRegistering: boolean
  preferences: PushPreferences
  requestPermission: () => Promise<boolean>
  unsubscribe: () => Promise<void>
  updatePreferences: (prefs: Partial<PushPreferences>) => Promise<void>
  sendLocalNotification: (title: string, options?: NotificationOptions) => void
}

// ── Default prefs ─────────────────────────────────────────────────────────────
const DEFAULT_PREFS: PushPreferences = {
  matchStart: true,
  goals: true,
  halftime: false,
  fulltime: true,
  cards: false,
  lineups: false,
  venueOffers: false,
  advertising: false,
}

// ── Context ───────────────────────────────────────────────────────────────────
const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [preferences, setPreferences] = useState<PushPreferences>(DEFAULT_PREFS)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  // Load current permission state
  useEffect(() => {
    if (typeof window === "undefined") return
    if ("Notification" in window) setPermission(Notification.permission)

    // Load saved prefs
    try {
      const saved = localStorage.getItem("sf_push_prefs")
      if (saved) setPreferences(JSON.parse(saved))
    } catch { /* ignore */ }

    // Check existing subscription
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub)
        })
      })
    }

    // Capture geolocation for targeted notifications
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setLocation(loc)
          localStorage.setItem("userLocation", JSON.stringify(loc))
        },
        () => { /* permission denied — no location */ },
      )
    }
  }, [])

  // ── Subscribe to Web Push ─────────────────────────────────────────────────
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[push] Web Push not supported")
      return false
    }

    setIsRegistering(true)
    try {
      const notifPerm = await Notification.requestPermission()
      setPermission(notifPerm)
      if (notifPerm !== "granted") return false

      const reg = await navigator.serviceWorker.ready

      // Fetch the VAPID public key from the server — avoids needing NEXT_PUBLIC_ prefix
      const keyRes = await fetch("/api/push/vapid-key")
      if (!keyRes.ok) {
        console.warn("[push] Failed to fetch VAPID public key")
        return false
      }
      const { publicKey: vapidKey } = await keyRes.json()

      // Convert VAPID public key from base64url to Uint8Array
      const keyBytes = Uint8Array.from(
        atob(vapidKey.replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0),
      )

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes,
      })

      const subJson = sub.toJSON()

      // Persist to DB
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
          deviceToken: getDeviceToken(),
          lat: location?.lat ?? null,
          lng: location?.lng ?? null,
          country: Intl.DateTimeFormat().resolvedOptions().locale?.split("-")[1] ?? null,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          preferences,
          followedTeams: JSON.parse(localStorage.getItem("followed_teams") || "[]"),
          followedLeagues: JSON.parse(localStorage.getItem("followed_leagues") || "[]"),
          tier: JSON.parse(localStorage.getItem("sf_subscription_v2") || "{}").tier || "bronze",
        }),
      })

      setIsSubscribed(true)
      return true
    } catch (err) {
      console.error("[push] subscription error:", err)
      return false
    } finally {
      setIsRegistering(false)
    }
  }, [location, preferences])

  // ── Unsubscribe ───────────────────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setIsSubscribed(false)
    } catch (err) {
      console.error("[push] unsubscribe error:", err)
    }
  }, [])

  // ── Update preferences (local + DB) ──────────────────────────────────────
  const updatePreferences = useCallback(async (partial: Partial<PushPreferences>) => {
    const merged = { ...preferences, ...partial }
    setPreferences(merged)
    localStorage.setItem("sf_push_prefs", JSON.stringify(merged))

    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.toJSON().endpoint, preferences: merged }),
        })
      }
    } catch { /* offline — will sync next time */ }
  }, [preferences])

  // ── Local-only notification (no push) ────────────────────────────────────
  const sendLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === "granted") {
      new Notification(title, { icon: APP_BRAND_ICON, badge: APP_BRAND_ICON, ...options })
    }
  }, [permission])

  return (
    <NotificationContext.Provider
      value={{
        permission,
        isSubscribed,
        isRegistering,
        preferences,
        requestPermission,
        unsubscribe,
        updatePreferences,
        sendLocalNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

/**
 * usePushProvider — access the push subscription + local notification context.
 * Named separately from hooks/use-notifications.ts (which handles DB-backed history).
 */
export function usePushProvider() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error("usePushProvider must be used within NotificationProvider")
  return ctx
}

// Backwards-compatible alias for any remaining callsites
/** @deprecated Use usePushProvider instead */
export { usePushProvider as useNotifications }
