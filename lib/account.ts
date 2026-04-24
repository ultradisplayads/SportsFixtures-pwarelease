// lib/account.ts
// Account rules engine — single source of logic for all account/profile surfaces.
// Import from here; never scatter account logic across random components.

import type {
  AccountMode,
  ConsentKey,
  SessionSecurityState,
  UserProfileSummary,
} from "@/types/account"

// ── Identity helpers ────────────────────────────────────────────────────────

export function isSignedIn(profile: UserProfileSummary | null): boolean {
  return profile?.mode === "signed_in"
}

export function canEditIdentity(profile: UserProfileSummary | null): boolean {
  return Boolean(profile && profile.mode === "signed_in")
}

export function canShowEmail(profile: UserProfileSummary | null): boolean {
  return Boolean(profile?.email)
}

export function getDisplayName(profile: UserProfileSummary | null): string {
  if (!profile) return "SportsFixtures User"
  return (
    profile.displayName ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.email?.split("@")[0] ||
    "SportsFixtures User"
  )
}

export function getInitials(profile: UserProfileSummary | null): string {
  const name = getDisplayName(profile)
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// ── Security helpers ────────────────────────────────────────────────────────

export function canChangePassword(security: SessionSecurityState | null): boolean {
  return Boolean(security?.canChangePassword && security?.hasPasswordLogin)
}

export function canDeleteAccount(security: SessionSecurityState | null): boolean {
  return Boolean(security?.canDeleteAccount)
}

// ── Consent helpers ─────────────────────────────────────────────────────────

export const CONSENT_KEYS: ConsentKey[] = [
  "marketing_email",
  "marketing_push",
  "personalization",
  "location_recommendations",
  "analytics",
  "affiliate_tracking",
]

export function consentLabel(key: ConsentKey): string {
  const map: Record<ConsentKey, string> = {
    marketing_email: "Marketing emails",
    marketing_push: "Marketing push notifications",
    personalization: "Personalised experience",
    location_recommendations: "Location-based recommendations",
    analytics: "Analytics and usage data",
    affiliate_tracking: "Affiliate attribution",
  }
  return map[key]
}

export function consentDescription(key: ConsentKey): string {
  const map: Record<ConsentKey, string> = {
    marketing_email: "Receive emails about features, offers, and updates",
    marketing_push: "Receive push notifications about promotions",
    personalization: "Allow the app to tailor content to your interests",
    location_recommendations: "Use your location to recommend nearby venues and events",
    analytics: "Help improve the app by sharing anonymous usage data",
    affiliate_tracking: "Allow attribution tracking when you click affiliate links",
  }
  return map[key]
}

export function defaultConsentValues(): Record<ConsentKey, boolean> {
  return {
    marketing_email: false,
    marketing_push: false,
    personalization: true,
    location_recommendations: true,
    analytics: true,
    affiliate_tracking: false,
  }
}

// ── Account mode helpers ────────────────────────────────────────────────────

export function getAccountModeLabel(mode: AccountMode): string {
  return mode === "signed_in" ? "Signed-in account" : "Device-based mode"
}

export function getAccountModeDescription(mode: AccountMode, email?: string | null): string {
  if (mode === "signed_in") {
    return email
      ? `Signed in as ${email}`
      : "Your account data is synced to your profile."
  }
  return "Your preferences are stored on this device only. Sign in to sync across devices."
}

// ── SF API base (server-side only; import only in route handlers) ───────────

export function getSFApiBase(): string {
  return (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net")
    .replace(/\/api-docs\/?$/, "")
    .replace(/\/$/, "")
}

export function getSFApiHeaders(): Record<string, string> {
  const token = process.env.SF_API_TOKEN || ""
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}
