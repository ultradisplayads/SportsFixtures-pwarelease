/**
 * lib/personalization-prefs.ts
 *
 * Lightweight client-side preference helpers for personalization toggles
 * that do not yet require server persistence (location consent, etc.).
 *
 * All functions are SSR-safe (guard on typeof window).
 */

// ── Location consent ──────────────────────────────────────────────────────────

const LOCATION_CONSENT_KEY = "sf_location_recommendations_enabled"

/**
 * Returns true if the user has opted in to location-based recommendations.
 * This is a personalization preference — it does NOT trigger a browser
 * geolocation permission prompt by itself. That happens separately and
 * contextually when a location-aware feature is first used.
 */
export function getSavedLocationConsent(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(LOCATION_CONSENT_KEY) === "true"
}

export function setSavedLocationConsent(value: boolean): void {
  if (typeof window === "undefined") return
  localStorage.setItem(LOCATION_CONSENT_KEY, value ? "true" : "false")
  // Broadcast so other components can react without a full page reload
  window.dispatchEvent(
    new CustomEvent("sf:location-consent-change", { detail: { enabled: value } })
  )
}
