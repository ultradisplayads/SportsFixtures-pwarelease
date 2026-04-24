// Environment variable validation — called once at startup in layout.tsx
// Logs warnings for missing vars so devs spot issues early.
// Does NOT throw — the app should still run in degraded mode.

const REQUIRED_SERVER_VARS = [
  "DATABASE_URL",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "SPORTSDB_API_KEY",
] as const

const OPTIONAL_SERVER_VARS = [
  "SF_API_URL",
  "SF_API_TOKEN",
  "PUSH_SECRET",
  "STATUS_API_TOKEN",
  // API-Football.com (also api-sports.com) — unlocks fixtures, results, lineups,
  // standings, stats, predictions, injuries. Without it these data classes fall
  // back to TheSportsDB where available.
  "API_FOOTBALL_KEY",
] as const

export function validateEnv(): void {
  if (typeof window !== "undefined") return // client-side — skip

  const missing: string[] = []
  const degraded: string[] = []

  for (const key of REQUIRED_SERVER_VARS) {
    if (!process.env[key]) missing.push(key)
  }

  for (const key of OPTIONAL_SERVER_VARS) {
    if (!process.env[key]) degraded.push(key)
  }

  if (missing.length > 0) {
    console.warn(`[SF] Missing required env vars: ${missing.join(", ")}`)
  }

  if (degraded.length > 0) {
    console.info(`[SF] Optional env vars not set (degraded mode): ${degraded.join(", ")}`)
  }
}
