/**
 * Custom analytics — 15 typed events
 * Sends to /api/analytics (no-op if endpoint missing) + console in dev
 */

type AnalyticsEvent =
  | { event: "search"; query: string; results: number }
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

function getDeviceToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("sf_device_token")
}

async function track(payload: AnalyticsEvent) {
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", payload)
  }

  const base = { ...payload, ts: Date.now() }

  // Legacy in-memory route (kept for backwards compat)
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(base),
    keepalive: true,
  }).catch(() => {})

  // DB-backed route — maps event name to analytics_events.event_type
  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType: payload.event,
      deviceToken: getDeviceToken(),
      page: typeof window !== "undefined" ? window.location.pathname : null,
      meta: base,
    }),
    keepalive: true,
  }).catch(() => {})
}

export const analytics = {
  search: (query: string, results: number) => track({ event: "search", query, results }),
  favouriteAdd: (teamId: string, teamName: string) => track({ event: "favourite_add", teamId, teamName }),
  favouriteRemove: (teamId: string, teamName: string) => track({ event: "favourite_remove", teamId, teamName }),
  liveView: (matchId: string, sport: string) => track({ event: "live_view", matchId, sport }),
  matchView: (matchId: string, leagueId?: string) => track({ event: "match_view", matchId, leagueId }),
  signIn: (method: "email" | "google" | "facebook" | "apple" | "zoho_otp") => track({ event: "sign_in", method }),
  signUp: (method: "email" | "google" | "facebook" | "apple" | "zoho_otp") => track({ event: "sign_up", method }),
  onboardingComplete: (teamsFollowed: number) => track({ event: "onboarding_complete", teamsFollowed }),
  installPromptShown: (platform: "android" | "ios") => track({ event: "install_prompt_shown", platform }),
  installPromptAccepted: () => track({ event: "install_prompt_accepted" }),
  installPromptDismissed: () => track({ event: "install_prompt_dismissed" }),
  pushSubscribe: () => track({ event: "push_subscribe" }),
  pushUnsubscribe: () => track({ event: "push_unsubscribe" }),
  tvGuideView: (sport?: string) => track({ event: "tv_guide_view", sport }),
  premiumView: (source?: string) => track({ event: "premium_view", source }),
}
