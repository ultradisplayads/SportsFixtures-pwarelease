"use client"

// Thin hook wrapper around favourites-api for components that need
// synchronous access to the cached favourite list.

import { useState, useEffect } from "react"
import { getFavourites, type Favourite } from "@/lib/favourites-api"

export function useFavourites(): { favourites: Favourite[]; loading: boolean } {
  // Seed instantly from localStorage cache, then revalidate async
  const [favourites, setFavourites] = useState<Favourite[]>(() => {
    if (typeof window === "undefined") return []
    try {
      return JSON.parse(localStorage.getItem("sf_favourites_cache") || "[]")
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFavourites()
      .then(setFavourites)
      .catch(() => {/* keep cached value */})
      .finally(() => setLoading(false))
  }, [])

  return { favourites, loading }
}
