// Section 09 — Cache Strategy By Data Type
// Every data class in the app maps to exactly one cache policy.
// Service worker runtime caching and client-side SWR config should both
// respect these policies so they are consistent across layers.

import type { CachePolicy } from "@/types/pwa"

// ---
// Policy table — add new data classes here when new routes are introduced.
// Rules:
//   - live data  → network_first (ticker, scores, match-center)
//   - account    → network_first or network_only (never cache sensitive data cache-first)
//   - content    → stale_while_revalidate (news, venue discovery, commercial)
//   - static     → cache_first (app shell, icons, fonts, static assets)
// ---

export const CACHE_POLICY = {
  // Static shell — cache-first is safe because these are hashed in production
  app_shell:              "cache_first",
  static_assets:          "cache_first",

  // Content — slight lag is acceptable; background revalidation is fine
  homepage_news:          "stale_while_revalidate",
  venue_discovery:        "stale_while_revalidate",
  premium_commercial:     "stale_while_revalidate",
  entitlements:           "stale_while_revalidate",
  browse_fixtures:        "stale_while_revalidate",

  // Live data — must never serve meaningfully stale data as current
  ticker_feed:            "network_first",
  match_center_live:      "network_first",
  livescores:             "network_first",
  notifications_history:  "network_first",

  // Account / security — must not be cached or served stale
  profile_overview:       "network_first",
  account_actions:        "network_only",
  push_subscription:      "network_only",
  consent_writes:         "network_only",
  password_change:        "network_only",
  delete_account:         "network_only",
} satisfies Record<string, CachePolicy>

// Helper — look up the policy for a given URL pathname.
// Returns "network_first" as a safe default for unknown routes.
export function getPolicyForPath(pathname: string): CachePolicy {
  if (pathname.startsWith("/api/ticker"))       return CACHE_POLICY.ticker_feed
  if (pathname.startsWith("/api/livescores"))   return CACHE_POLICY.livescores
  if (pathname.startsWith("/api/match-center")) return CACHE_POLICY.match_center_live
  if (pathname.startsWith("/api/news"))         return CACHE_POLICY.homepage_news
  if (pathname.startsWith("/api/venues"))       return CACHE_POLICY.venue_discovery
  if (pathname.startsWith("/api/commercial"))   return CACHE_POLICY.premium_commercial
  if (pathname.startsWith("/api/entitlements")) return CACHE_POLICY.entitlements
  if (pathname.startsWith("/api/account"))      return CACHE_POLICY.account_actions
  if (pathname.startsWith("/api/push"))         return CACHE_POLICY.push_subscription
  if (pathname.startsWith("/_next/static"))     return CACHE_POLICY.static_assets
  if (pathname.startsWith("/_next/image"))      return CACHE_POLICY.static_assets
  // Unknown API routes — default to network_first (safest non-live default)
  if (pathname.startsWith("/api/"))             return CACHE_POLICY.profile_overview
  // Everything else is assumed to be app-shell
  return CACHE_POLICY.app_shell
}

// SWR revalidation intervals keyed on cache policy
export const SWR_REVALIDATE_MS: Record<CachePolicy, number> = {
  network_only:           0,
  network_first:          30_000,       // 30 s — live data
  stale_while_revalidate: 5 * 60_000,   // 5 min — content
  cache_first:            60 * 60_000,  // 1 hr — static
}
