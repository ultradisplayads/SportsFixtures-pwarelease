"use client"

/**
 * Product analytics for the PWA.
 * Sends compact behavioural events to Strapi via /api/analytics/event and keeps a
 * small local retry queue so offline sessions still become useful BI data.
 */

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
type AnalyticsMeta = Record<string, JsonValue | undefined>

type TrackOptions = {
  page?: string
  entityType?: string
  entityId?: string
  userId?: string
}

type AnalyticsEvent =
  | { event: "search"; query: string; results: number; source?: string }
  | { event: "favourite_add"; teamId: string; teamName: string }
  | { event: "favourite_remove"; teamId: string; teamName: string }
  | { event: "live_view"; matchId: string; sport: string }
  | { event: "match_view"; matchId: string; leagueId?: string }
  | { event: "sign_in"; method: "email" | "google" | "facebook" | "apple" | "zoho_otp" }
  | { event: "sign_up"; method: "email" | "google" | "facebook" | "apple" | "zoho_otp" }
  | { event: "onboarding_complete"; teamsFollowed: number }
  | { event: "install_prompt_shown"; platform: "android" | "ios" }
  | { event: "install_prompt_accepted" }
  | { event: "install_prompt_dismissed" }
  | { event: "push_subscribe" }
  | { event: "push_unsubscribe" }
  | { event: "tv_guide_view"; sport?: string }
  | { event: "premium_view"; source?: string }

const QUEUE_KEY = "sf_analytics_queue_v1"
const DEVICE_TOKEN_KEY = "sf_device_token"
const MAX_QUEUE = 100

function getDeviceToken(): string | null {
  if (typeof window === "undefined") return null

  let token = localStorage.getItem(DEVICE_TOKEN_KEY)
  if (!token && "crypto" in window && typeof window.crypto.randomUUID === "function") {
    token = window.crypto.randomUUID()
    localStorage.setItem(DEVICE_TOKEN_KEY, token)
  }
  return token
}

function getPage(): string | null {
  if (typeof window === "undefined") return null
  return `${window.location.pathname}${window.location.search}`
}

function readQueue(): unknown[] {
  if (typeof window === "undefined") return []
  try {
    const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]")
    return Array.isArray(queue) ? queue : []
  } catch {
    return []
  }
}

function writeQueue(queue: unknown[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE)))
  } catch {
    // Ignore quota/private browsing issues.
  }
}

function enqueue(payload: unknown) {
  writeQueue([...readQueue(), payload])
}

async function send(payload: unknown): Promise<boolean> {
  try {
    const res = await fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    })
    return res.ok
  } catch {
    return false
  }
}

function normaliseMeta(meta: AnalyticsMeta): Record<string, JsonValue> {
  return Object.fromEntries(
    Object.entries(meta).filter((entry): entry is [string, JsonValue] => entry[1] !== undefined),
  )
}

async function trackEvent(eventType: string, meta: AnalyticsMeta = {}, options: TrackOptions = {}) {
  const payload = {
    eventType,
    deviceToken: getDeviceToken(),
    userId: options.userId ?? null,
    page: options.page ?? getPage(),
    entityType: options.entityType ?? null,
    entityId: options.entityId ?? null,
    meta: {
      ...normaliseMeta(meta),
      ts: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", payload)
  }

  const ok = await send(payload)
  if (!ok) enqueue(payload)
}

async function flush() {
  const queue = readQueue()
  if (queue.length === 0) return

  const remaining: unknown[] = []
  for (const payload of queue) {
    const ok = await send(payload)
    if (!ok) remaining.push(payload)
  }
  writeQueue(remaining)
}

export const analytics = {
  track: trackEvent,
  flush,
  pageView: (page: string, meta: AnalyticsMeta = {}) => trackEvent("page_view", meta, { page }),
  dwell: (page: string, durationMs: number, meta: AnalyticsMeta = {}) =>
    trackEvent("page_dwell", { ...meta, durationMs, durationSeconds: Math.round(durationMs / 1000) }, { page }),
  navigationClick: (href: string, meta: AnalyticsMeta = {}) => trackEvent("navigation_click", { ...meta, href }),
  search: (query: string, results: number, source = "global") => trackEvent("search", { query, results, source }),
  standingsSearch: (query: string, results: number, filters: AnalyticsMeta = {}) =>
    trackEvent("standings_search", { query, results, ...filters }, { entityType: "competition" }),
  filter: (name: string, value: string | null, source: string, results?: number) =>
    trackEvent("filter_change", { name, value, source, results }),
  venueCheckIn: (venueId: string, eventId?: string, checkedIn = true) =>
    trackEvent("venue_checkin", { checkedIn, eventId }, { entityType: "venue", entityId: venueId, page: getPage() ?? undefined }),
  favouriteAdd: (teamId: string, teamName: string) => trackEvent("favourite_add", { teamId, teamName }, { entityType: "team", entityId: teamId }),
  favouriteRemove: (teamId: string, teamName: string) => trackEvent("favourite_remove", { teamId, teamName }, { entityType: "team", entityId: teamId }),
  liveView: (matchId: string, sport: string) => trackEvent("live_view", { sport }, { entityType: "match", entityId: matchId }),
  matchView: (matchId: string, leagueId?: string) => trackEvent("match_view", { leagueId }, { entityType: "match", entityId: matchId }),
  signIn: (method: "email" | "google" | "facebook" | "apple" | "zoho_otp") => trackEvent("sign_in", { method }),
  signUp: (method: "email" | "google" | "facebook" | "apple" | "zoho_otp") => trackEvent("sign_up", { method }),
  onboardingComplete: (teamsFollowed: number) => trackEvent("onboarding_complete", { teamsFollowed }),
  installPromptShown: (platform: "android" | "ios") => trackEvent("install_prompt_shown", { platform }),
  installPromptAccepted: () => trackEvent("install_prompt_accepted"),
  installPromptDismissed: () => trackEvent("install_prompt_dismissed"),
  pushSubscribe: () => trackEvent("push_subscribe"),
  pushUnsubscribe: () => trackEvent("push_unsubscribe"),
  tvGuideView: (sport?: string) => trackEvent("tv_guide_view", { sport }),
  premiumView: (source?: string) => trackEvent("premium_view", { source }),
}
