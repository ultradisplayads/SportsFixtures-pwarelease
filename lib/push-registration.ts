// ─────────────────────────────────────────────────────────────────────────────
// Section 02 — Push Permission & Registration
// Centralized. Never call Notification.requestPermission from random places.
// ─────────────────────────────────────────────────────────────────────────────

export type PushSupportState =
  | "supported"   // browser supports push and SW
  | "unsupported" // browser does not support push

export type PushPermissionState = NotificationPermission | "unsupported"

type PushSyncOptions = {
  endpoint: string
  keys?: PushSubscriptionJSON["keys"]
  method?: "POST" | "PATCH"
}

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
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const output = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
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

function readJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback))
  } catch {
    return fallback
  }
}

async function syncPushSubscription({ endpoint, keys, method = "POST" }: PushSyncOptions) {
  const favourites = readJson<Array<{ entity_type: string; entity_id: string }>>("sf_favourites_cache", [])
  const prefs = readJson<Record<string, any>>("sf_notification_prefs_v1", {})
  const location = readJson<{ latitude?: number; longitude?: number; country?: string } | null>("userLocation", null)

  await fetch("/api/push/subscribe", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint,
      keys,
      deviceToken: getDeviceToken(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      country: location?.country || Intl.DateTimeFormat().resolvedOptions().locale?.split("-")[1] || null,
      lat: location?.latitude ?? null,
      lng: location?.longitude ?? null,
      preferences: {
        matchStart: prefs.enabled_categories?.includes("kickoff") ?? true,
        goals: prefs.enabled_categories?.includes("goal") ?? true,
        halftime: prefs.enabled_categories?.includes("half_time") ?? true,
        fulltime: prefs.enabled_categories?.includes("full_time") ?? true,
        cards: (prefs.enabled_categories?.includes("red_card") || prefs.enabled_categories?.includes("yellow_card")) ?? true,
        lineups: prefs.enabled_categories?.includes("lineups") ?? true,
        venueOffers: prefs.allow_venue_offers ?? true,
        advertising: true,
      },
      followedTeams: favourites.filter((fav) => fav.entity_type === "team").map((fav) => fav.entity_id),
      followedLeagues: favourites
        .filter((fav) => fav.entity_type === "league" || fav.entity_type === "competition")
        .map((fav) => fav.entity_id),
      reminderOffsets: prefs.default_reminder_offsets || ["24h", "8h", "1h", "5m"],
      categories: prefs.enabled_categories || [
        "goal",
        "kickoff",
        "match_reminder",
        "lineups",
        "predicted_lineups",
        "half_time",
        "full_time",
        "red_card",
        "yellow_card",
        "substitution",
        "venue_recommendation",
        "venue_offer",
        "partner_offer",
        "geofence_offer",
        "breaking_news",
        "transfer_news",
      ],
    }),
  })
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
  if (existing) {
    const existingJson = existing.toJSON()
    await syncPushSubscription({
      endpoint: existingJson.endpoint || existing.endpoint,
      keys: existingJson.keys,
      method: "PATCH",
    })
    return existing
  }

  const vapidPublicKey = await fetchVapidPublicKey()
  const convertedKey = urlBase64ToUint8Array(vapidPublicKey)

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedKey,
  })

  const subJson = subscription.toJSON()

  await syncPushSubscription({
    endpoint: subJson.endpoint || subscription.endpoint,
    keys: subJson.keys,
    method: "POST",
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
