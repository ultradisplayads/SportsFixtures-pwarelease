"use client"

// Simple in-memory stale-while-revalidate cache for client-side entity data.
// Entries are stored in a Map keyed by `${type}:${id}`.
// stale = true means the data is older than TTL but still usable while refreshing.

const DEFAULT_TTL_MS = 60_000 // 1 minute

interface CacheEntry<T> {
  data: T
  cachedAt: number
  ttl: number
}

export interface CacheResult<T> {
  data: T
  stale: boolean
}

const store = new Map<string, CacheEntry<any>>()

export function cacheSet<T>(type: string, id: string, data: T, ttl = DEFAULT_TTL_MS): void {
  store.set(`${type}:${id}`, { data, cachedAt: Date.now(), ttl })
}

export function cacheGet<T>(type: string, id: string): CacheResult<T> | null {
  const entry = store.get(`${type}:${id}`) as CacheEntry<T> | undefined
  if (!entry) return null
  const age = Date.now() - entry.cachedAt
  return { data: entry.data, stale: age > entry.ttl }
}

export function cacheClear(type?: string): void {
  if (!type) { store.clear(); return }
  for (const key of store.keys()) {
    if (key.startsWith(`${type}:`)) store.delete(key)
  }
}
