"use client"

/**
 * hooks/use-notifications.ts
 *
 * Single shared client-side store for the entire notification system.
 *
 * Provides:
 *   - history        NotificationHistoryItem[]  — in-app inbox (from DB)
 *   - unreadCount    number                     — badge value
 *   - preferences    NotificationPreferences    — user prefs (from DB)
 *   - subscriptions  NotificationSubscription[] — per-entity subs (from DB)
 *   - pushGranted    boolean | null             — browser permission state
 *   - markRead(id)                              — optimistic + server sync
 *   - markAllRead()                             — clear badge
 *   - updatePreferences(partial)                — optimistic + server sync
 *   - subscribe(entity)                         — add entity alert
 *   - unsubscribe(entityType, entityId)         — remove entity alert
 *   - hydrate()                                 — force re-fetch from server
 *
 * Architecture: uses a module-level shared cache so multiple component
 * instances share state without prop drilling or a context provider.
 * Re-renders are triggered via a `sf:notifications-change` CustomEvent.
 */

import { useState, useEffect, useCallback, useRef } from "react"
import type {
  NotificationHistoryItem,
  NotificationPreferences,
  NotificationSubscription,
  SubscribeEntityParams,
} from "@/types/notifications"
import { getDeviceToken } from "@/lib/favourites-api"
import { triggerHaptic } from "@/lib/haptic-feedback"

// ── Module-level shared cache ──────────────────────────────────────────────────

const CHANGE_EVENT = "sf:notifications-change"

interface NotifCache {
  history: NotificationHistoryItem[]
  preferences: NotificationPreferences | null
  subscriptions: NotificationSubscription[]
  loaded: boolean
  loading: boolean
}

const cache: NotifCache = {
  history: [],
  preferences: null,
  subscriptions: [],
  loaded: false,
  loading: false,
}

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
  }
}

// ── Default preferences factory ────────────────────────────────────────────────

function defaultPreferences(): NotificationPreferences {
  return {
    push_enabled: false,
    in_app_enabled: true,
    global_mute: false,
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    default_reminder_offsets: ["1h", "15m"],
    enabled_categories: ["match_reminder", "kickoff", "goal", "full_time"],
    disabled_categories: [],
    tier1_enabled: true,
    tier2_enabled: true,
    tier3_enabled: false,
    allow_breaking_news: false,
    allow_venue_offers: false,
    allow_transfer_news: false,
  }
}

// ── Server fetch helpers ────────────────────────────────────────────────────────

async function fetchHistory(token: string): Promise<NotificationHistoryItem[]> {
  try {
    const res = await fetch(`/api/notifications/history?limit=50`, {
      headers: { "x-device-token": token },
    })
    if (!res.ok) return []
    const j = await res.json()
    return Array.isArray(j.history) ? j.history : []
  } catch {
    return []
  }
}

async function fetchPreferences(token: string): Promise<NotificationPreferences | null> {
  try {
    const res = await fetch(`/api/notifications/preferences`, {
      headers: { "x-device-token": token },
    })
    if (!res.ok) return null
    const j = await res.json()
    return j.preferences ?? null
  } catch {
    return null
  }
}

async function fetchSubscriptions(token: string): Promise<NotificationSubscription[]> {
  try {
    const res = await fetch(`/api/notifications/subscriptions`, {
      headers: { "x-device-token": token },
    })
    if (!res.ok) return []
    const j = await res.json()
    return Array.isArray(j.subscriptions) ? j.subscriptions : []
  } catch {
    return []
  }
}

// ── Hydrate (shared, guarded) ──────────────────────────────────────────────────

async function hydrateCacheFromServer(): Promise<void> {
  if (cache.loading) return
  cache.loading = true
  emit()

  try {
    const token = getDeviceToken()
    const [history, preferences, subscriptions] = await Promise.all([
      fetchHistory(token),
      fetchPreferences(token),
      fetchSubscriptions(token),
    ])

    cache.history = history
    cache.preferences = preferences ?? defaultPreferences()
    cache.subscriptions = subscriptions
    cache.loaded = true
  } catch {
    if (!cache.loaded) {
      cache.preferences = defaultPreferences()
      cache.loaded = true
    }
  } finally {
    cache.loading = false
    emit()
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const [, forceUpdate] = useState(0)
  const mounted = useRef(true)

  const rerender = useCallback(() => {
    if (mounted.current) forceUpdate((n) => n + 1)
  }, [])

  useEffect(() => {
    mounted.current = true
    window.addEventListener(CHANGE_EVENT, rerender)

    if (!cache.loaded && !cache.loading) {
      hydrateCacheFromServer()
    }

    return () => {
      mounted.current = false
      window.removeEventListener(CHANGE_EVENT, rerender)
    }
  }, [rerender])

  // Push permission state
  const [pushGranted, setPushGranted] = useState<boolean | null>(null)
  useEffect(() => {
    if ("Notification" in window) {
      setPushGranted(Notification.permission === "granted")
      const interval = setInterval(() => {
        setPushGranted(Notification.permission === "granted")
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [])

  // Derived values
  const unreadCount = cache.history.filter((h) => !h.read).length
  const prefs = cache.preferences ?? defaultPreferences()

  // ── Actions ───────────────────────────────────────────────────────────────────

  const markRead = useCallback(async (id: number) => {
    const item = cache.history.find((h) => h.id === id)
    if (!item || item.read) return
    // Optimistic
    item.read = true
    emit()
    try {
      const token = getDeviceToken()
      await fetch(`/api/notifications/history/${id}/read`, {
        method: "POST",
        headers: { "x-device-token": token },
      })
    } catch {
      // Roll back
      item.read = false
      emit()
    }
  }, [])

  const markAllRead = useCallback(async () => {
    const unread = cache.history.filter((h) => !h.read)
    if (!unread.length) return
    triggerHaptic("selection")
    // Optimistic
    unread.forEach((h) => { h.read = true })
    emit()
    try {
      const token = getDeviceToken()
      await Promise.all(
        unread.map((h) =>
          fetch(`/api/notifications/history/${h.id}/read`, {
            method: "POST",
            headers: { "x-device-token": token },
          })
        )
      )
    } catch {
      // Roll back
      unread.forEach((h) => { h.read = false })
      emit()
    }
  }, [])

  const updatePreferences = useCallback(async (patch: Partial<NotificationPreferences>) => {
    const prev = { ...prefs }
    // Optimistic
    cache.preferences = { ...prefs, ...patch }
    emit()
    try {
      const token = getDeviceToken()
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "content-type": "application/json", "x-device-token": token },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error("failed")
      const j = await res.json()
      cache.preferences = j.preferences ?? cache.preferences
      emit()
    } catch {
      cache.preferences = prev
      emit()
    }
  }, [prefs])

  const subscribe = useCallback(async (params: SubscribeEntityParams) => {
    const token = getDeviceToken()
    // Optimistic add
    const existing = cache.subscriptions.findIndex(
      (s) => s.entity_type === params.entity_type && s.entity_id === params.entity_id
    )
    if (existing !== -1) return // already subscribed
    const optimistic: NotificationSubscription = {
      id: -Date.now(),
      device_token: token,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      entity_name: params.entity_name,
      categories: params.categories ?? ["match_reminder", "kickoff", "full_time"],
      reminder_offsets: params.reminder_offsets ?? ["1h", "15m"],
      tier: params.tier ?? "tier2",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    cache.subscriptions = [...cache.subscriptions, optimistic]
    emit()
    try {
      const res = await fetch("/api/notifications/subscriptions", {
        method: "POST",
        headers: { "content-type": "application/json", "x-device-token": token },
        body: JSON.stringify(params),
      })
      if (!res.ok) throw new Error("failed")
      const j = await res.json()
      // Replace optimistic with real record
      cache.subscriptions = cache.subscriptions.map((s) =>
        s.id === optimistic.id ? j.subscription : s
      )
      emit()
    } catch {
      cache.subscriptions = cache.subscriptions.filter((s) => s.id !== optimistic.id)
      emit()
    }
  }, [])

  const unsubscribe = useCallback(async (entityType: string, entityId: string) => {
    const prev = [...cache.subscriptions]
    cache.subscriptions = cache.subscriptions.filter(
      (s) => !(s.entity_type === entityType && s.entity_id === entityId)
    )
    emit()
    try {
      const token = getDeviceToken()
      await fetch(
        `/api/notifications/subscriptions?entity_type=${entityType}&entity_id=${entityId}`,
        { method: "DELETE", headers: { "x-device-token": token } }
      )
    } catch {
      cache.subscriptions = prev
      emit()
    }
  }, [])

  const hydrate = useCallback(() => {
    cache.loaded = false
    hydrateCacheFromServer()
  }, [])

  return {
    // ── State ──────────────────────────────────────────────────────────────────
    history:         cache.history,
    unreadCount,
    preferences:     prefs,
    subscriptions:   cache.subscriptions,
    pushGranted,
    loading:         cache.loading,
    isHydrating:     cache.loading,
    loaded:          cache.loaded,
    error:           null as string | null,

    // ── Actions ────────────────────────────────────────────────────────────────
    markRead,
    markAllRead,
    updatePreferences,
    subscribe,
    unsubscribe,
    hydrate,

    // ── Canonical aliases (used by ReminderButton, spec pattern) ───────────────
    /** Alias for subscribe — upserts a NotificationSubscription. */
    upsertSubscription: subscribe,
    /** Alias for unsubscribe — removes a subscription by entityType + entityId. */
    removeSubscription: unsubscribe,
  }
}
