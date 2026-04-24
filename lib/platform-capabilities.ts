// Section 10 — Platform Capability Matrix
// Pure function — no React imports, safe to call from hooks and server code.
//
// Rules:
// - Components must NOT directly test navigator.* or window.* APIs
// - All capability checks must go through this function
// - Native shells will later pass their own capabilities via the same interface

import type { PlatformCapabilityMatrix } from "@/types/native-handoff"

/**
 * Derives the current platform capability matrix from raw environment signals.
 * Call this once inside a hook (e.g. usePlatformTarget) and pass the result
 * down — do not call it on every render.
 */
export function getPlatformCapabilities(input: {
  isStandalone: boolean
  hasServiceWorker: boolean
  hasPushManager: boolean
  hasShareApi?: boolean
}): PlatformCapabilityMatrix {
  return {
    // BeforeInstallPromptEvent is available — Chrome/Edge desktop + Android
    installPrompt: input.hasServiceWorker,

    // Both SW and PushManager must be present for browser push to work
    browserPush: input.hasServiceWorker && input.hasPushManager,

    // Placeholder — becomes true when a native push SDK is injected by the shell
    nativePushReady: false,

    // navigator.share (Web Share API) or native bridge
    shareIntentReady: input.hasShareApi ?? false,

    // Always true — the deep-link contract is baked into the codebase
    deepLinkReady: true,

    // True when running in installed / standalone display mode
    standaloneShellReady: input.isStandalone,
  }
}

/**
 * Reads raw browser signals and returns the capability matrix.
 * Must only be called in a browser context (inside useEffect or a client hook).
 */
export function readBrowserCapabilities(): PlatformCapabilityMatrix {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return getPlatformCapabilities({
      isStandalone: false,
      hasServiceWorker: false,
      hasPushManager: false,
      hasShareApi: false,
    })
  }

  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    (navigator as any).standalone === true

  return getPlatformCapabilities({
    isStandalone,
    hasServiceWorker: "serviceWorker" in navigator,
    hasPushManager: "PushManager" in window,
    hasShareApi: "share" in navigator,
  })
}
