import { normalizePublicPath, stripTrackingParams } from "@/lib/seo/url"

/**
 * Canonical decision order:
 * 1. private / utility → noindex
 * 2. thin / incomplete → noindex
 * 3. alias → redirect to canonical
 * 4. legacy path → redirect to canonical
 * 5. otherwise → canonical public entity path
 */

const PRIVATE_PREFIXES = [
  "/api/",
  "/account",
  "/profile",
  "/settings",
  "/alerts",
  "/push",
  "/auth",
  "/admin",
  "/private",
  "/search",
]

export function isPrivateRoute(path: string): boolean {
  return PRIVATE_PREFIXES.some((prefix) => path.startsWith(prefix))
}

export function buildCanonicalPath(path: string): string {
  // Strip tracking params from path if it contains a query string
  if (path.includes("?")) {
    const url = new URL(path, "https://sportsfixtures.net")
    stripTrackingParams(url)
    return normalizePublicPath(url.pathname + (url.search ? url.search : ""))
  }
  return normalizePublicPath(path)
}

/** Params that should never appear in canonical URLs */
export const DISALLOWED_CANONICAL_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "sort",
  "filter",
  "page",
  "tab",
  "ref",
]
