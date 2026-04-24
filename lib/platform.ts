// lib/platform.ts
// Section 09 — Canonical platform utility barrel.
// Re-exports from lib/pwa.ts and adds capability detection helpers.
// Pure functions — no React, safe in server and SW contexts.

export {
  resolveAppShellRouteIntent,
  deriveStandaloneMode,
  intentToHref,
  resolveNotificationClickUrl,
} from "@/lib/pwa"

import type { PlatformCapabilities } from "@/types/platform"

// ---------------------------------------------------------------------------
// Capability detection
// ---------------------------------------------------------------------------

/**
 * Detects which PWA platform APIs are available at runtime.
 * Must be called in a browser context (after mount).
 * Returns all-false on the server.
 */
export function detectPlatformCapabilities(): PlatformCapabilities {
  if (typeof window === "undefined") {
    return {
      serviceWorker: false,
      push: false,
      share: false,
      installPrompt: false,
      standalone: false,
      online: true,
    }
  }

  return {
    serviceWorker: "serviceWorker" in navigator && window.isSecureContext,
    push: "serviceWorker" in navigator && "PushManager" in window,
    share: "share" in navigator,
    // installPrompt can only be confirmed when the event fires — default false
    installPrompt: false,
    standalone:
      window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
      (window.navigator as any)?.standalone === true,
    online: navigator.onLine,
  }
}

/**
 * Returns true when the app is running as an installed PWA.
 * Wraps deriveStandaloneMode() from lib/pwa.ts for convenience.
 */
export { deriveStandaloneMode as isStandaloneMode } from "@/lib/pwa"

// ---------------------------------------------------------------------------
// Safe-area / notch helpers
// ---------------------------------------------------------------------------

/**
 * Returns the CSS env() value for the given safe-area inset.
 * Used by AppShellSafeArea to avoid notch/home-indicator overlap.
 */
export function safeAreaInset(
  edge: "top" | "bottom" | "left" | "right",
): string {
  return `env(safe-area-inset-${edge}, 0px)`
}
