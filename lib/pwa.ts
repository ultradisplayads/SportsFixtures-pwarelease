// Section 09/10 — PWA Platform Utilities
// Pure functions — no React imports, safe to call from service worker context too.

import type { AppShellRouteIntent } from "@/types/pwa"
import { VALID_ROUTE_PREFIXES } from "@/types/pwa"
import { pushPayloadToIntent, intentHref } from "@/lib/deep-links"

// ---------------------------------------------------------------------------
// Deep-link validation
// ---------------------------------------------------------------------------

/**
 * Validates a deep-link href from any external source (push click, share
 * target, external browser open) and returns a typed route intent.
 *
 * Rules:
 * - Must be a non-empty string starting with "/"
 * - Must match one of the VALID_ROUTE_PREFIXES allowlist entries
 * - Falls back to "/" if invalid so the app never lands on a blank page
 */
export function resolveAppShellRouteIntent(
  href: string,
  source: AppShellRouteIntent["source"],
): AppShellRouteIntent {
  if (typeof href !== "string" || !href.startsWith("/")) {
    return { href, source, valid: false, fallbackHref: "/" }
  }

  const isValid = VALID_ROUTE_PREFIXES.some(
    (prefix) => href === prefix || href.startsWith(prefix),
  )

  return {
    href,
    source,
    valid: isValid,
    fallbackHref: isValid ? null : "/",
  }
}

// ---------------------------------------------------------------------------
// Standalone / installed mode detection
// ---------------------------------------------------------------------------

/** Returns true when the app is running in installed/standalone display mode. */
export function deriveStandaloneMode(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    (window.navigator as any)?.standalone === true
  )
}

// ---------------------------------------------------------------------------
// Safe navigation target
// ---------------------------------------------------------------------------

/**
 * Given an intent, returns the href to navigate to.
 * Falls back to fallbackHref when the intent is invalid.
 */
export function intentToHref(intent: AppShellRouteIntent): string {
  return intent.valid ? intent.href : (intent.fallbackHref ?? "/")
}

// ---------------------------------------------------------------------------
// Push notification click routing
// ---------------------------------------------------------------------------

/**
 * Extracts and validates the target URL from a push notification's data
 * payload. Returns a safe AppShellRouteIntent regardless of payload shape.
 *
 * Delegates to pushPayloadToIntent (lib/deep-links.ts) which handles both
 * legacy url/href payloads and the new normalized intent.* shape introduced
 * in Section 10 for native handoff compatibility.
 */
export function resolveNotificationClickUrl(
  data: Record<string, any> | null | undefined,
): AppShellRouteIntent {
  const openIntent = pushPayloadToIntent(data)
  const href = intentHref(openIntent)
  return resolveAppShellRouteIntent(href, "push")
}
