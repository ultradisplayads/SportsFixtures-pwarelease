// ─────────────────────────────────────────────────────────────────────────────
// Section 02 — Push Permission & Registration
// Centralized. Never call Notification.requestPermission from random places.
// ─────────────────────────────────────────────────────────────────────────────

export type PushSupportState =
  | "supported"   // browser supports push and SW
  | "unsupported" // browser does not support push

export type PushPermissionState = NotificationPermission | "unsupported"

/**
 * Returns the current push permission state without triggering a prompt.
 */
export async function getPushPermissionState(): Promise<PushPermissionState> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported"
  return Notification.permission
}

/**
 * Requests push permission. Only call this in response to a user gesture.
 * Returns "unsupported" if the browser does not support the Notifications API.
 */
export async function requestPushPermission(): Promise<PushPermissionState> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported"
  return Notification.requestPermission()
}

/**
 * Converts a URL-safe base64 VAPID key to a Uint8Array suitable for
 * PushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

/**
 * Retrieves the VAPID public key from the server so it does not need
 * to be exposed as a NEXT_PUBLIC_ env var.
 */
async function fetchVapidPublicKey(): Promise<string> {
  const res = await fetch("/api/push/vapid-key")
  if (!res.ok) throw new Error("Failed to fetch VAPID public key")
  const { publicKey } = await res.json()
  return publicKey
}

/**
 * Gets or creates the push subscription and persists it to the database.
 * Uses the existing /api/push/subscribe endpoint.
 * Returns the PushSubscription on success.
 */
export async function registerPushSubscription(): Promise<PushSubscription> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push is not supported on this device")
  }

  const registration = await navigator.serviceWorker.ready

  // Return existing subscription if already registered
  const existing = await registration.pushManager.getSubscription()
  if (existing) return existing

  const vapidPublicKey = await fetchVapidPublicKey()
  const convertedKey = urlBase64ToUint8Array(vapidPublicKey)

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedKey,
  })

  const subJson = subscription.toJSON()

  // Persist to DB via existing subscribe endpoint
  const deviceToken = getDeviceToken()
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: subJson.endpoint,
      keys: subJson.keys,
      deviceToken,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      country: Intl.DateTimeFormat().resolvedOptions().locale?.split("-")[1] ?? null,
    }),
  })

  return subscription
}

/**
 * Unsubscribes from push and marks the subscription inactive in the DB.
 */
export async function unregisterPushSubscription(): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return

  const registration = await navigator.serviceWorker.ready
  const sub = await registration.pushManager.getSubscription()
  if (!sub) return

  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  })

  await sub.unsubscribe()
}

/**
 * Returns the stable device token (creates one if it does not exist).
 */
function getDeviceToken(): string {
  if (typeof window === "undefined") return ""
  let token = localStorage.getItem("sf_device_token")
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem("sf_device_token", token)
  }
  return token
}
