// lib/offline-cache.ts
// Section 09 — Typed helpers for reading from the service worker caches in
// client components. These functions run in the browser only; they are safe
// to call from useEffect / event handlers but must never be called server-side.

export const CACHE_NAMES = {
  shell:  "sf-shell-v1",
  data:   "sf-data-v1",
  images: "sf-images-v1",
} as const

export type CacheName = (typeof CACHE_NAMES)[keyof typeof CACHE_NAMES]

// ── Existence checks ─────────────────────────────────────────────────────────

/** Returns true if the Cache Storage API is available in this context. */
export function isCacheStorageAvailable(): boolean {
  return typeof caches !== "undefined"
}

// ── Read helpers ─────────────────────────────────────────────────────────────

/**
 * Returns a cached Response for the given URL, or null if not cached.
 * Searches all managed caches in priority order: data → shell → images.
 */
export async function getCachedResponse(url: string): Promise<Response | null> {
  if (!isCacheStorageAvailable()) return null
  for (const name of [CACHE_NAMES.data, CACHE_NAMES.shell, CACHE_NAMES.images]) {
    try {
      const cache = await caches.open(name)
      const match = await cache.match(url)
      if (match) return match
    } catch {
      // Cache may have been evicted — continue
    }
  }
  return null
}

/**
 * Returns parsed JSON from the data cache for the given API URL, or null.
 * Useful for rendering stale data when the network is unavailable.
 */
export async function getCachedJSON<T = unknown>(url: string): Promise<T | null> {
  const res = await getCachedResponse(url)
  if (!res) return null
  try {
    return (await res.json()) as T
  } catch {
    return null
  }
}

// ── Write helpers ─────────────────────────────────────────────────────────────

/**
 * Manually stores a JSON-serialisable value in the data cache under the given
 * URL key. Used to pre-warm the cache from the main thread (e.g. after a
 * successful API fetch).
 */
export async function putCachedJSON(url: string, data: unknown): Promise<void> {
  if (!isCacheStorageAvailable()) return
  try {
    const cache = await caches.open(CACHE_NAMES.data)
    const body  = JSON.stringify(data)
    const res   = new Response(body, {
      headers: {
        "Content-Type":  "application/json",
        "X-Cached-At":   new Date().toISOString(),
      },
    })
    await cache.put(url, res)
  } catch {
    // Quota exceeded or private browsing — fail silently
  }
}

// ── Delete helpers ────────────────────────────────────────────────────────────

/** Removes a single entry from all managed caches. */
export async function deleteCachedURL(url: string): Promise<void> {
  if (!isCacheStorageAvailable()) return
  for (const name of Object.values(CACHE_NAMES)) {
    try {
      const cache = await caches.open(name)
      await cache.delete(url)
    } catch {
      // Ignore
    }
  }
}

/** Deletes all managed SF caches. Called on logout / account deletion. */
export async function clearAllCaches(): Promise<void> {
  if (!isCacheStorageAvailable()) return
  const keys = await caches.keys()
  await Promise.all(
    keys.filter((k) => k.startsWith("sf-")).map((k) => caches.delete(k)),
  )
}

// ── Cache size ────────────────────────────────────────────────────────────────

/**
 * Returns the approximate total size of all SF caches in bytes.
 * Uses StorageManager.estimate() where available, falls back to 0.
 */
export async function estimateCacheSize(): Promise<number> {
  if (!isCacheStorageAvailable()) return 0
  try {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const { usage } = await navigator.storage.estimate()
      return usage ?? 0
    }
  } catch {
    // Not available in this context
  }
  return 0
}
