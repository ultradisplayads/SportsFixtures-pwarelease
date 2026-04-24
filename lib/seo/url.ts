import { FALLBACK_SEO_SETTINGS } from "@/lib/seo/config"

const SITE_URL = FALLBACK_SEO_SETTINGS.canonicalSiteUrl

export function absoluteUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`
  return `${SITE_URL}${clean}`
}

export function canonicalUrl(path: string): string {
  return absoluteUrl(normalizePublicPath(path))
}

export function normalizePublicPath(path: string): string {
  if (path !== "/" && path.endsWith("/")) return path.slice(0, -1)
  return path
}

export function stripTrackingParams(url: URL): URL {
  const TRACKING_PARAMS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "gclid",
    "fbclid",
    "msclkid",
    "ttclid",
  ]
  TRACKING_PARAMS.forEach((key) => url.searchParams.delete(key))
  return url
}
