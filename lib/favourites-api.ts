// Client-side favourites API wrapper
// Uses device_token (stable UUID in localStorage) as the key — no login required
// Syncs to Neon DB on every change, with localStorage as an optimistic cache

export function getDeviceToken(): string {
  if (typeof window === "undefined") return ""
  let t = localStorage.getItem("sf_device_token")
  if (!t) {
    t = crypto.randomUUID()
    localStorage.setItem("sf_device_token", t)
  }
  return t
}

/**
 * EntityType covers every supported follow category.
 * "competition" is a user-facing alias that maps to "league" in the DB.
 * The API route uses ON CONFLICT so both values are safe to persist.
 */
export type EntityType = "team" | "league" | "competition" | "player" | "venue"

export interface Favourite {
  entity_type: EntityType
  entity_id: string
  entity_name?: string
  entity_logo?: string
  entity_meta?: Record<string, string>
  created_at?: string
}

const CACHE_KEY = "sf_favourites_cache"

function readCache(): Favourite[] {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]")
  } catch {
    return []
  }
}

function writeCache(favs: Favourite[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(favs))
  } catch {}
}

/**
 * getCachedFavourites — public alias to read the local cache synchronously.
 * Used by use-follows.ts for instant hydration without a network round-trip.
 */
export function getCachedFavourites(): Favourite[] {
  return readCache()
}

async function apiCall(method: string, body?: object): Promise<Response> {
  return fetch("/api/favourites", {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-device-token": getDeviceToken(),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

export async function getFavourites(): Promise<Favourite[]> {
  const cached = readCache()

  try {
    const res = await apiCall("GET")
    if (res.ok) {
      const data = await res.json()
      const server: Favourite[] = data.favourites || []
      writeCache(server)
      return server
    }
  } catch {
    // offline — return cache
  }
  return cached
}

export async function addFavourite(fav: Omit<Favourite, "created_at">): Promise<boolean> {
  const current = readCache()
  const exists = current.some(
    (f) => f.entity_type === fav.entity_type && f.entity_id === fav.entity_id
  )
  if (!exists) {
    writeCache([{ ...fav, created_at: new Date().toISOString() }, ...current])
  }

  try {
    const res = await apiCall("POST", fav)
    return res.ok
  } catch {
    return false
  }
}

export async function removeFavourite(entity_type: string, entity_id: string): Promise<boolean> {
  const current = readCache()
  writeCache(current.filter((f) => !(f.entity_type === entity_type && f.entity_id === entity_id)))

  try {
    const res = await apiCall("DELETE", { entity_type, entity_id })
    return res.ok
  } catch {
    return false
  }
}

export function isFavourite(entity_type: string, entity_id: string): boolean {
  const current = readCache()
  return current.some((f) => f.entity_type === entity_type && f.entity_id === entity_id)
}

/**
 * toggleFavourite — add if not present, remove if present.
 * Returns true if now following, false if now unfollowed.
 */
export async function toggleFavourite(fav: Omit<Favourite, "created_at">): Promise<boolean> {
  const already = isFavourite(fav.entity_type, fav.entity_id)
  if (already) {
    await removeFavourite(fav.entity_type, fav.entity_id)
    return false
  } else {
    await addFavourite(fav)
    return true
  }
}

/**
 * getFavouritesByType — convenience filter on cached favourites.
 */
export function getFavouritesByType(entity_type: EntityType): Favourite[] {
  return readCache().filter((f) => f.entity_type === entity_type)
}
