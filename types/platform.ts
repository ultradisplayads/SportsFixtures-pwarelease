// types/platform.ts
// Section 09 — Canonical platform type aliases.
// All new code must import platform types from here, not from types/pwa.ts directly.
// types/pwa.ts remains the source of truth; this module is the public API surface.

export type {
  NetworkState,
  InstallState,
  UpdateState,
  CachePolicy,
  PlatformStatus,
  AppShellRouteIntent,
} from "@/types/pwa"

export { VALID_ROUTE_PREFIXES } from "@/types/pwa"

// ---------------------------------------------------------------------------
// Platform capability detection result
// ---------------------------------------------------------------------------

export type PlatformCapabilities = {
  /** ServiceWorker API is available and the context is secure */
  serviceWorker: boolean
  /** Web Push / PushManager available */
  push: boolean
  /** Web Share API available */
  share: boolean
  /** beforeinstallprompt fires on this browser (Chrome/Edge on Android/Desktop) */
  installPrompt: boolean
  /** App is currently running in standalone / installed display mode */
  standalone: boolean
  /** navigator.onLine at the time of detection */
  online: boolean
}

// ---------------------------------------------------------------------------
// Web Share API payload
// ---------------------------------------------------------------------------

export type SharePayload = {
  title: string
  text?: string
  url: string
}

export type ShareResult =
  | { outcome: "shared" }
  | { outcome: "copied"; fallback: true }
  | { outcome: "error"; error: unknown }

// ---------------------------------------------------------------------------
// Service Worker message types — mirrors lib/sw-messages.ts constants
// ---------------------------------------------------------------------------

export type SWMessageType =
  | "SKIP_WAITING"
  | "CACHE_URLS"
  | "CLEAR_CACHE"
  | "GET_CACHE_KEYS"
  | "PREFETCH_ROUTE"

export type SWMessage<T extends SWMessageType = SWMessageType, P = unknown> = {
  type: T
  payload?: P
}
