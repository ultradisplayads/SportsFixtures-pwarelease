// lib/pwa-packaging.ts
// Section 09 — PWA install / packaging helpers.
// Wraps the beforeinstallprompt event, standalone detection, and the Web Share
// API in typed, tree-shakeable helpers. All functions are browser-only.

import type { SharePayload, ShareResult, PlatformCapabilities } from "@/types/platform"

// ── Capability detection ──────────────────────────────────────────────────────

/**
 * Detects current platform capabilities at call time.
 * Call from useEffect — never during SSR.
 */
export function detectCapabilities(): PlatformCapabilities {
  if (typeof window === "undefined") {
    return {
      serviceWorker: false,
      push:          false,
      share:         false,
      installPrompt: false,
      standalone:    false,
      online:        true,
    }
  }
  return {
    serviceWorker: "serviceWorker" in navigator,
    push:          "PushManager"   in window,
    share:         "share"         in navigator,
    installPrompt: "BeforeInstallPromptEvent" in window || _hasDeferredPrompt(),
    standalone:    isStandalone(),
    online:        navigator.onLine,
  }
}

// ── Standalone detection ──────────────────────────────────────────────────────

/** Returns true when the app is running in installed / standalone display mode. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  )
}

// ── Install prompt ────────────────────────────────────────────────────────────

let _deferredPrompt: any = null

function _hasDeferredPrompt() {
  return _deferredPrompt !== null
}

/**
 * Call once in a top-level useEffect to capture the beforeinstallprompt event.
 * Returns a cleanup function.
 */
export function captureDeferredInstallPrompt(): () => void {
  const handler = (e: Event) => {
    e.preventDefault()
    _deferredPrompt = e
    window.dispatchEvent(new CustomEvent("sf:install-available"))
  }
  window.addEventListener("beforeinstallprompt", handler)
  return () => window.removeEventListener("beforeinstallprompt", handler)
}

/**
 * Triggers the native A2HS install prompt if one has been captured.
 * Returns "accepted", "dismissed", or "unavailable".
 */
export async function triggerInstallPrompt(): Promise<"accepted" | "dismissed" | "unavailable"> {
  if (!_deferredPrompt) return "unavailable"
  try {
    _deferredPrompt.prompt()
    const { outcome } = await _deferredPrompt.userChoice
    _deferredPrompt = null
    return outcome === "accepted" ? "accepted" : "dismissed"
  } catch {
    _deferredPrompt = null
    return "unavailable"
  }
}

// ── Web Share API ─────────────────────────────────────────────────────────────

/**
 * Shares content using the Web Share API with a clipboard fallback.
 * Never throws — all outcomes are returned as a discriminated union.
 */
export async function shareContent(payload: SharePayload): Promise<ShareResult> {
  if (typeof navigator === "undefined") return { outcome: "error", error: "SSR" }

  if ("share" in navigator) {
    try {
      await navigator.share(payload)
      return { outcome: "shared" }
    } catch (err: unknown) {
      // User cancelled — AbortError is not a real error
      if (err instanceof DOMException && err.name === "AbortError") {
        return { outcome: "error", error: err }
      }
      // Fall through to clipboard fallback
    }
  }

  // Clipboard fallback
  try {
    await navigator.clipboard.writeText(payload.url)
    return { outcome: "copied", fallback: true }
  } catch (err) {
    return { outcome: "error", error: err }
  }
}

// ── Notification permission ───────────────────────────────────────────────────

/**
 * Requests notification permission and returns the resulting state.
 * Returns "denied" immediately if the API is unavailable.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied"
  if (Notification.permission === "granted") return "granted"
  return Notification.requestPermission()
}
