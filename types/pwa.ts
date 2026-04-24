// Section 09 — PWA Platform Types
// Single canonical source for all PWA runtime state shapes

export type NetworkState = "online" | "offline" | "unknown"

export type InstallState =
  | "unsupported"
  | "available"
  | "dismissed"
  | "installed"
  | "unknown"

export type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "activating"
  | "updated"
  | "error"

export type CachePolicy =
  | "network_first"
  | "stale_while_revalidate"
  | "cache_first"
  | "network_only"

export type PlatformStatus = {
  network: NetworkState
  install: InstallState
  update: UpdateState
  isStandalone: boolean
  lastSyncAt: string | null
}

export type AppShellRouteIntent = {
  href: string
  source: "push" | "external" | "share_target" | "internal"
  valid: boolean
  fallbackHref: string | null
}

// Allowed internal route prefixes — deep links must match one of these to be
// considered valid. Add new top-level routes here as the product grows.
export const VALID_ROUTE_PREFIXES = [
  "/",
  "/match/",
  "/team/",
  "/competition/",
  "/news/",
  "/venues",
  "/venues/",
  "/profile",
  "/settings",
  "/premium",
  "/browse",
  "/notifications",
  "/privacy",
] as const
