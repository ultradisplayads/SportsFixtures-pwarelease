// lib/sw-messages.ts
// Section 09 — Typed Service Worker message builders.
// All code that needs to post a message to the SW must use these helpers —
// never post raw objects directly — so message types stay in sync with sw.js.

import type { SWMessageType, SWMessage } from "@/types/platform"

export { }

// ---------------------------------------------------------------------------
// Typed message builder
// ---------------------------------------------------------------------------

function buildMessage<T extends SWMessageType, P = undefined>(
  type: T,
  payload?: P,
): SWMessage<T, P> {
  return payload !== undefined ? { type, payload } : { type } as SWMessage<T, P>
}

// ---------------------------------------------------------------------------
// Message senders
// ---------------------------------------------------------------------------

/**
 * Posts a message to the active service worker.
 * No-ops silently when the SW is not available.
 */
export function postSWMessage<T extends SWMessageType>(
  message: SWMessage<T>,
): void {
  if (typeof navigator === "undefined") return
  if (!("serviceWorker" in navigator)) return
  navigator.serviceWorker.controller?.postMessage(message)
}

/**
 * Tells the waiting service worker to activate immediately (skip waiting).
 * The SW will reload the page via the controllerchange handler in
 * ServiceWorkerRegistration.tsx once it takes control.
 */
export function sendSkipWaiting(): void {
  postSWMessage(buildMessage("SKIP_WAITING"))
}

/**
 * Asks the SW to pre-cache a list of URLs.
 * Used by route-based prefetching to warm the shell cache.
 */
export function sendCacheUrls(urls: string[]): void {
  postSWMessage(buildMessage("CACHE_URLS", urls))
}

/**
 * Asks the SW to clear all managed caches.
 * Used on logout / account deletion to remove stale user data.
 */
export function sendClearCache(): void {
  postSWMessage(buildMessage("CLEAR_CACHE"))
}

/**
 * Asks the SW to prefetch and cache a route URL.
 * Used when hovering over a link in a list to warm the cache.
 */
export function sendPrefetchRoute(href: string): void {
  postSWMessage(buildMessage("PREFETCH_ROUTE", href))
}

// ---------------------------------------------------------------------------
// Exported message type constants — mirrors SWMessageType union
// ---------------------------------------------------------------------------

export const SW_MESSAGE_TYPES = {
  SKIP_WAITING: "SKIP_WAITING",
  CACHE_URLS: "CACHE_URLS",
  CLEAR_CACHE: "CLEAR_CACHE",
  GET_CACHE_KEYS: "GET_CACHE_KEYS",
  PREFETCH_ROUTE: "PREFETCH_ROUTE",
} as const satisfies Record<SWMessageType, SWMessageType>
