// lib/service-worker-rules.ts
// Canonical list of API prefixes that must NEVER be served from SW cache.
// Imported by tooling and used as reference for public/sw.js rules.

export const LIVE_SENSITIVE_API_PREFIXES = [
  "/api/results",
  "/api/ticker",
  "/api/live",
  "/api/fixtures",
  "/api/nearby/venues",
  "/api/venue-checkins",
  "/api/venue-watchers",
]
