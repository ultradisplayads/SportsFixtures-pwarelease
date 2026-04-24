"use client"

// hooks/use-share-actions.ts
// Section 10 — Web Share API hook with clipboard fallback.
// Components call share() with a SharePayload; the hook handles browser
// capability detection, the Web Share API call, and the clipboard fallback.
// Never call navigator.share() directly in a component.

import { useCallback, useState } from "react"
import type { SharePayload, ShareResult } from "@/types/platform"

export type UseShareActionsResult = {
  /** True when the Web Share API is available on this device */
  canShare: boolean
  /** True while a share operation is in progress */
  sharing: boolean
  /** Result of the last share call, or null if never called */
  lastResult: ShareResult | null
  /** Trigger a share — falls back to clipboard if Web Share is unavailable */
  share: (payload: SharePayload) => Promise<ShareResult>
}

export function useShareActions(): UseShareActionsResult {
  const [sharing, setSharing] = useState(false)
  const [lastResult, setLastResult] = useState<ShareResult | null>(null)

  const canShare =
    typeof navigator !== "undefined" && "share" in navigator

  const share = useCallback(
    async (payload: SharePayload): Promise<ShareResult> => {
      setSharing(true)
      let result: ShareResult

      try {
        if (canShare) {
          await navigator.share({
            title: payload.title,
            text: payload.text,
            url: payload.url,
          })
          result = { outcome: "shared" }
        } else {
          // Clipboard fallback
          await navigator.clipboard.writeText(payload.url)
          result = { outcome: "copied", fallback: true }
        }
      } catch (error) {
        // navigator.share() throws DOMException "AbortError" when dismissed —
        // treat as a non-error outcome so the UI does not show an error state.
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          result = { outcome: "copied", fallback: true }
        } else {
          result = { outcome: "error", error }
        }
      } finally {
        setSharing(false)
      }

      setLastResult(result)
      return result
    },
    [canShare],
  )

  return { canShare, sharing, lastResult, share }
}
