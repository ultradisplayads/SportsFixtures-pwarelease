// ─────────────────────────────────────────────────────────────────────────────
// lib/notification-manager.ts
//
// Section 02 — Thin local delivery adapter only.
//
// This module is NOT a source of truth for notification history, preferences,
// or subscriptions. Those live exclusively in the DB-backed model via
// hooks/use-notifications.ts and the /api/notifications/* routes.
//
// This file retains only:
//   - browser-native Notification API dispatching (client-side fallback)
//   - vibration patterns and local UI helpers
//
// Reminder scheduling and per-match reminder logic must be done via the
// unified NotificationSubscription model (useNotifications → subscribe).
// ─────────────────────────────────────────────────────────────────────────────

export type LocalDeliveryType =
  | "match_start"
  | "goal"
  | "half_time"
  | "full_time"
  | "red_card"
  | "match_reminder"

export interface LocalDeliveryPayload {
  id: string
  type: LocalDeliveryType
  title: string
  body: string
  url?: string
  data?: Record<string, unknown>
}

/**
 * Vibration patterns for different delivery types.
 * Used as a supplementary haptic cue when sending local Notification API toasts.
 */
const VIBRATION_PATTERNS: Record<LocalDeliveryType, number[]> = {
  match_start:   [200, 100, 200],
  goal:          [100, 50, 100, 50, 100],
  half_time:     [200],
  full_time:     [300, 100, 300],
  red_card:      [150],
  match_reminder:[100, 100, 100],
}

/**
 * sendLocalDelivery — fire a browser Notification for an in-session event.
 *
 * This is an adapter-level helper only. It does NOT add to notification
 * history (that happens via the DB-backed API route). Call this only for
 * immediate client-side feedback when you already know the history has been
 * persisted elsewhere.
 */
export async function sendLocalDelivery(payload: LocalDeliveryPayload): Promise<void> {
  if (typeof window === "undefined") return
  if (!("Notification" in window)) return
  if (Notification.permission !== "granted") return

  // Cast to `any` — `vibrate` is a valid non-standard extension supported by
  // Chrome/Android but not included in TypeScript's built-in NotificationOptions.
  const options = {
    body: payload.body,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: `${payload.type}-${payload.id}`,
    data: { url: payload.url, ...payload.data },
    vibrate: VIBRATION_PATTERNS[payload.type] ?? [200],
  } as NotificationOptions

  try {
    // Prefer service worker registration for richer notification support
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.showNotification(payload.title, options)
        return
      }
    }
    new Notification(payload.title, options)
  } catch {
    // Silently ignore — local delivery is best-effort only
  }
}
