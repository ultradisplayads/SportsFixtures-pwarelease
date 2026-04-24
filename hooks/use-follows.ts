"use client"

/**
 * hooks/use-follows.ts
 *
 * Shared client-side follow state.
 *
 * All follow-aware components should consume this hook rather than calling
 * favourites-api directly. It gives:
 *  - Instant reads from localStorage cache (no flash of wrong state)
 *  - Optimistic writes with rollback on failure
 *  - Cross-component sync via the "sf:favourites-change" CustomEvent
 *  - Grouped access helpers for templates
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  getFavourites,
  getCachedFavourites,
  isFavourite,
  toggleFavourite,
  type Favourite,
  type EntityType,
} from "@/lib/favourites-api"

const FOLLOWS_EVENT = "sf:favourites-change"

export function useFollows() {
  // Seed from cache synchronously so there is no flash of wrong follow state
  const [items, setItems] = useState<Favourite[]>(() => getCachedFavourites())
  const [isHydrating, setIsHydrating] = useState(false)
  const [hydrateError, setHydrateError] = useState<string | null>(null)

  // Load fresh data from server once on mount
  const hydrate = useCallback(async () => {
    setIsHydrating(true)
    setHydrateError(null)
    try {
      const fresh = await getFavourites()
      setItems(fresh)
    } catch {
      setHydrateError("Could not refresh follows")
      // keep showing cache — do not blank the UI
    } finally {
      setIsHydrating(false)
    }
  }, [])

  useEffect(() => {
    hydrate()
  }, [hydrate])

  // Keep in sync when other components (or tabs) dispatch the change event
  useEffect(() => {
    const onChange = () => setItems(getCachedFavourites())
    window.addEventListener(FOLLOWS_EVENT, onChange)
    return () => window.removeEventListener(FOLLOWS_EVENT, onChange)
  }, [])

  /** Returns true if the entity is currently followed */
  const has = useCallback(
    (type: EntityType, entityId: string) =>
      items.some((x) => x.entity_type === type && x.entity_id === entityId),
    [items]
  )

  /** Grouped access to followed entities by category */
  const grouped = useMemo(
    () => ({
      teams: items.filter((x) => x.entity_type === "team"),
      competitions: items.filter(
        (x) => x.entity_type === "competition" || x.entity_type === "league"
      ),
      players: items.filter((x) => x.entity_type === "player"),
      venues: items.filter((x) => x.entity_type === "venue"),
    }),
    [items]
  )

  /**
   * toggle — optimistically updates local state, calls API, rolls back on error.
   * Returns true if now following, false if now unfollowed.
   */
  const toggle = useCallback(
    async (item: Favourite): Promise<boolean> => {
      const currentlyActive = isFavourite(item.entity_type, item.entity_id)

      // Optimistic update
      setItems((prev) => {
        if (currentlyActive) {
          return prev.filter(
            (x) =>
              !(x.entity_type === item.entity_type && x.entity_id === item.entity_id)
          )
        }
        return [item, ...prev]
      })

      try {
        const nowActive = await toggleFavourite(item)
        // Re-read cache after server confirms to stay in sync
        setItems(getCachedFavourites())
        window.dispatchEvent(new Event(FOLLOWS_EVENT))
        return nowActive
      } catch (err) {
        // Rollback to last known good state from cache
        setItems(getCachedFavourites())
        throw err
      }
    },
    []
  )

  return {
    /** All followed items */
    items,
    /** Grouped by entity type */
    grouped,
    /** Test if a specific entity is followed */
    has,
    /** Optimistic toggle — throws on network failure */
    toggle,
    /** Re-fetch from server */
    hydrate,
    /** True while initial server fetch is in flight */
    isHydrating,
    /** Non-null if hydration failed (stale cache is still shown) */
    hydrateError,
  }
}

export type UseFollowsReturn = ReturnType<typeof useFollows>
