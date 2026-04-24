// lib/external-links.ts
// Section 10 — External URL helpers.
// Centralises how the app opens external URLs so the behaviour can be
// controlled in one place (e.g. in-app browser in a native wrapper).

import { externalOpenToIntent, intentHref } from "@/lib/deep-links"

// ---------------------------------------------------------------------------
// External URL opener
// ---------------------------------------------------------------------------

/**
 * Opens an external URL safely.
 *
 * Rules:
 *  - https:// URLs are opened in a new tab with noopener/noreferrer
 *  - http:// URLs are blocked (logged as a warning)
 *  - Same-origin SF URLs are treated as deep links and use router.push() when
 *    a `navigate` callback is supplied, otherwise they fall back to new-tab
 *
 * @param href        The URL to open
 * @param navigate    Optional router.push / Next.js router callback for
 *                    same-origin URLs; if omitted, window.open is used
 */
export function openExternalUrl(
  href: string,
  navigate?: (path: string) => void,
): void {
  if (typeof window === "undefined") return

  const intent = externalOpenToIntent(href)

  if (!intent.valid) {
    console.warn("[platform] Blocked attempt to open invalid external URL:", href)
    return
  }

  // Same-origin internal URL — route within the app when possible
  if (intent.source === "share_target" && navigate) {
    navigate(intentHref(intent))
    return
  }

  window.open(href, "_blank", "noopener,noreferrer")
}

// ---------------------------------------------------------------------------
// In-app browser (future native wrapper hook point)
// ---------------------------------------------------------------------------

/**
 * Opens a URL in the in-app browser.
 * In the browser PWA this is identical to openExternalUrl().
 * In a future native wrapper this function will be intercepted to launch
 * the native WKWebView/CustomTabsIntent instead.
 */
export function openInAppBrowser(href: string): void {
  if (typeof window === "undefined") return
  if (!href || !href.startsWith("https://")) {
    console.warn("[platform] openInAppBrowser: only https:// URLs are supported")
    return
  }
  window.open(href, "_blank", "noopener,noreferrer")
}

// ---------------------------------------------------------------------------
// Mailto / tel helpers
// ---------------------------------------------------------------------------

export function openMailto(email: string, subject?: string): void {
  if (typeof window === "undefined") return
  const params = subject ? `?subject=${encodeURIComponent(subject)}` : ""
  window.location.href = `mailto:${email}${params}`
}

export function openTel(number: string): void {
  if (typeof window === "undefined") return
  window.location.href = `tel:${number}`
}
