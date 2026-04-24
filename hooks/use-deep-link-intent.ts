"use client"

// hooks/use-deep-link-intent.ts
// Section 10 — Resolves the current page pathname to a typed DeepLinkIntent.
// Used by components that need to know which entity the current page represents
// (e.g. share sheet title, back-navigation label, notification payload builder).

import { useMemo } from "react"
import { usePathname } from "next/navigation"
import { hrefToDeepLinkIntent } from "@/lib/navigation-intents"
import type { DeepLinkIntent } from "@/types/navigation-intent"

export type UseDeepLinkIntentResult = {
  intent: DeepLinkIntent
  /** Resolved href for the current page (equal to pathname normally) */
  href: string
}

/**
 * Returns the DeepLinkIntent for the current Next.js route.
 * Pass an explicit `href` to resolve an arbitrary path instead.
 */
export function useDeepLinkIntent(href?: string): UseDeepLinkIntentResult {
  const pathname = usePathname()
  const resolved = href ?? pathname ?? "/"

  const intent = useMemo(
    () => hrefToDeepLinkIntent(resolved),
    [resolved],
  )

  return { intent, href: resolved }
}
