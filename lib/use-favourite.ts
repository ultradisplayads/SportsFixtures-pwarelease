"use client"

import { useState, useEffect } from "react"
import { addFavourite, removeFavourite, isFavourite, type Favourite } from "./favourites-api"
import { triggerHaptic } from "./haptic-feedback"

export function useFavourite(
  entity_type: Favourite["entity_type"],
  entity_id: string,
  meta?: Pick<Favourite, "entity_name" | "entity_logo" | "entity_meta">
) {
  const [favourited, setFavourited] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setFavourited(isFavourite(entity_type, entity_id))
  }, [entity_type, entity_id])

  const toggle = async () => {
    triggerHaptic("medium")
    setLoading(true)
    if (favourited) {
      setFavourited(false) // optimistic
      await removeFavourite(entity_type, entity_id)
    } else {
      setFavourited(true) // optimistic
      await addFavourite({
        entity_type,
        entity_id,
        entity_name: meta?.entity_name,
        entity_logo: meta?.entity_logo,
        entity_meta: meta?.entity_meta,
      })
    }
    setLoading(false)
  }

  return { favourited, toggle, loading }
}
