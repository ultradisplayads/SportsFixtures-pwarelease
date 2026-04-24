"use client"

import { useEffect, useState, useRef } from "react"
import type { CommercialFeedResponse, CommercialCard, CommercialItemType } from "@/types/monetization"

interface UseCommercialFeedParams {
  positionKey?: string
  type?: CommercialItemType
  limit?: number
}

export function useCommercialFeed(params?: UseCommercialFeedParams) {
  const [data, setData]         = useState<CommercialFeedResponse | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const cancelRef               = useRef(false)

  // Stable key to avoid re-running on object reference changes
  const positionKey = params?.positionKey
  const typeFilter  = params?.type
  const limit       = params?.limit

  useEffect(() => {
    cancelRef.current = false
    setLoading(true)
    setError(null)

    const qs = new URLSearchParams()
    if (positionKey) qs.set("positionKey", positionKey)

    fetch(`/api/commercial/feed?${qs}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load commercial feed")
        return res.json() as Promise<CommercialFeedResponse>
      })
      .then((json) => {
        if (!cancelRef.current) setData(json)
      })
      .catch((err) => {
        if (!cancelRef.current)
          setError(err?.message ?? "Failed to load commercial feed")
      })
      .finally(() => {
        if (!cancelRef.current) setLoading(false)
      })

    return () => {
      cancelRef.current = true
    }
  }, [positionKey])

  let items: CommercialCard[] = data?.items ?? []
  if (typeFilter) items = items.filter((i) => i.type === typeFilter)
  if (limit)      items = items.slice(0, limit)

  return { data, isLoading, error, items, generatedAt: data?.generatedAt }
}
