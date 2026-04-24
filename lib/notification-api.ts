// ─────────────────────────────────────────────────────────────────────────────
// Section 02 — Notification API Layer
// All fetch calls go through here. Never bury them in random components.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  AlertCategory,
  NotificationItem,
  NotificationPreferenceProfile,
  NotificationSubscription,
  ReminderOffset,
} from "@/types/notifications"

const PREFS_CACHE_KEY = "sf_notification_prefs_v1"
const SUBS_CACHE_KEY  = "sf_notification_subscriptions_v1"

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(value))
}

// ── Local cache reads (synchronous, used for SSR-safe initial state) ──────────

export function getCachedNotificationPrefs(): NotificationPreferenceProfile | null {
  return readJson<NotificationPreferenceProfile | null>(PREFS_CACHE_KEY, null)
}

export function getCachedNotificationSubscriptions(): NotificationSubscription[] {
  return readJson<NotificationSubscription[]>(SUBS_CACHE_KEY, [])
}

// ── Preferences ───────────────────────────────────────────────────────────────

export async function fetchNotificationPrefs(): Promise<NotificationPreferenceProfile> {
  const res = await fetch("/api/notifications/preferences", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch notification preferences")
  const data = await res.json()
  writeJson(PREFS_CACHE_KEY, data)
  return data
}

export async function saveNotificationPrefs(
  patch: Partial<NotificationPreferenceProfile>,
): Promise<NotificationPreferenceProfile> {
  const res = await fetch("/api/notifications/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error("Failed to save notification preferences")
  const data = await res.json()
  writeJson(PREFS_CACHE_KEY, data)
  return data
}

// ── Per-entity subscriptions ──────────────────────────────────────────────────

export async function fetchNotificationSubscriptions(): Promise<NotificationSubscription[]> {
  const res = await fetch("/api/notifications/subscriptions", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch notification subscriptions")
  const data = await res.json()
  const items = Array.isArray(data?.items) ? data.items : []
  writeJson(SUBS_CACHE_KEY, items)
  return items
}

export async function upsertNotificationSubscription(
  subscription: NotificationSubscription,
): Promise<NotificationSubscription[]> {
  const res = await fetch("/api/notifications/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription),
  })
  if (!res.ok) throw new Error("Failed to save subscription")
  const data = await res.json()
  const items = Array.isArray(data?.items) ? data.items : []
  writeJson(SUBS_CACHE_KEY, items)
  return items
}

export async function removeNotificationSubscription(
  entityType: string,
  entityId: string,
): Promise<NotificationSubscription[]> {
  const res = await fetch(
    `/api/notifications/subscriptions?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`,
    { method: "DELETE" },
  )
  if (!res.ok) throw new Error("Failed to remove subscription")
  const data = await res.json()
  const items = Array.isArray(data?.items) ? data.items : []
  writeJson(SUBS_CACHE_KEY, items)
  return items
}

// ── Notification history ──────────────────────────────────────────────────────

export async function fetchNotificationHistory(): Promise<NotificationItem[]> {
  const res = await fetch("/api/notifications/history", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch notification history")
  const data = await res.json()
  return Array.isArray(data?.items) ? data.items : []
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await fetch(`/api/notifications/history/${id}/read`, {
    method: "POST",
  })
  if (!res.ok) throw new Error("Failed to mark notification read")
}
