// app/api/account/overview/route.ts
// GET /api/account/overview
// Returns the normalized AccountOverviewResponse used by useAccountOverview().
// Works for both signed-in and anonymous/device-based users — never returns an error
// for anonymous mode, it simply returns the appropriate constrained shape.

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import {
  getSFApiBase,
  getSFApiHeaders,
  defaultConsentValues,
} from "@/lib/account"
import { makeSuccessEnvelope, makeEmptyEnvelope } from "@/lib/contracts"
import type { NormalizedEnvelope } from "@/types/contracts"
import type {
  AccountOverviewResponse,
  UserProfileSummary,
  SessionSecurityState,
  UserProfilePreferencesSummary,
  UserConsentState,
  AccountDeletionState,
} from "@/types/account"

// Parse a Strapi JWT to extract the user payload without verifying signature.
// Verification happens on the Strapi side; here we only need the identity fields.
function parseJwtPayload(jwt: string): Record<string, any> | null {
  try {
    const parts = jwt.split(".")
    if (parts.length !== 3) return null
    const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(payload)
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const cookieStore = await cookies()

  // Read JWT from cookie (set at sign-in) or Authorization header
  const authHeader = req.headers.get("authorization") || ""
  const jwt =
    authHeader.replace(/^Bearer\s+/i, "").trim() ||
    cookieStore.get("sf_jwt")?.value ||
    ""

  // ── Anonymous / device-based mode ──────────────────────────────────────
  if (!jwt) {
    const deviceToken =
      req.headers.get("x-device-token") ||
      cookieStore.get("sf_device_token")?.value ||
      "unknown"

    const anonProfile: UserProfileSummary = {
      id: `device:${deviceToken}`,
      mode: "anonymous_device",
    }

    const anonSecurity: SessionSecurityState = {
      canChangePassword: false,
      canDeleteAccount: false,
      hasPasswordLogin: false,
      hasSocialLogin: false,
    }

    const anonPrefs: UserProfilePreferencesSummary = {
      followedTeamsCount: 0,
      followedCompetitionsCount: 0,
      followedPlayersCount: 0,
      followedVenuesCount: 0,
      notificationsEnabled: false,
      pushEnabled: false,
      calendarMode: null,
      locationRecommendationsEnabled: false,
    }

    const anonConsent: UserConsentState = {
      values: defaultConsentValues(),
      updatedAt: null,
    }

    const anonDeletion: AccountDeletionState = {
      enabled: true, // device-mode deletion clears local data — already implemented
      requiresConfirmation: true,
      warningCopy:
        "This will remove all data stored on this device, including followed teams, notification settings, and predictions. This cannot be undone.",
    }

    const body: AccountOverviewResponse = {
      profile: anonProfile,
      security: anonSecurity,
      preferences: anonPrefs,
      consent: anonConsent,
      deletion: anonDeletion,
    }

    return NextResponse.json(
      makeSuccessEnvelope<AccountOverviewResponse>({
        data: body,
        source: "internal",
        maxAgeSeconds: 60,
        confidence: "high",
      }),
    )
  }

  // ── Signed-in mode — fetch from Strapi ─────────────────────────────────
  try {
    const base = getSFApiBase()
    const headers = { ...getSFApiHeaders(), Authorization: `Bearer ${jwt}` }

    // Fetch the Strapi /users/me endpoint with populated relations
    const meRes = await fetch(`${base}/api/users/me?populate=*`, {
      headers,
      cache: "no-store",
    })

    if (!meRes.ok) {
      // JWT expired or invalid — treat as anonymous
      return GET(new Request(req.url, { headers: req.headers }))
    }

    const me = await meRes.json()
    const jwtPayload = parseJwtPayload(jwt)

    const profile: UserProfileSummary = {
      id: String(me.id),
      mode: "signed_in",
      displayName: me.displayName || null,
      firstName: me.firstName || null,
      lastName: me.lastName || null,
      email: me.email || null,
      phone: me.phone || null,
      avatarUrl: me.avatar?.url || null,
      city: me.city || null,
      country: me.country || null,
      timezone: me.timezone || null,
      createdAt: me.createdAt || null,
      premiumTier: me.premiumTier || null,
      premiumActive: Boolean(me.premiumActive),
    }

    const provider: string = me.provider || jwtPayload?.provider || ""
    const hasPassword = provider === "local" || provider === "email"
    const hasSocial = ["google", "facebook", "apple"].includes(provider)

    const security: SessionSecurityState = {
      canChangePassword: hasPassword,
      canDeleteAccount: true,
      hasPasswordLogin: hasPassword,
      hasSocialLogin: hasSocial,
      lastUpdatedAt: me.updatedAt || null,
    }

    // Preferences — count relations if populated, else default to 0
    const preferences: UserProfilePreferencesSummary = {
      followedTeamsCount: Array.isArray(me.favouriteTeams) ? me.favouriteTeams.length : 0,
      followedCompetitionsCount: Array.isArray(me.favouriteLeagues) ? me.favouriteLeagues.length : 0,
      followedPlayersCount: Array.isArray(me.favouritePlayers) ? me.favouritePlayers.length : 0,
      followedVenuesCount: Array.isArray(me.favouriteVenues) ? me.favouriteVenues.length : 0,
      notificationsEnabled: Boolean(me.notificationsEnabled),
      pushEnabled: Boolean(me.pushEnabled),
      calendarMode: me.calendarMode || null,
      locationRecommendationsEnabled: Boolean(me.locationRecommendationsEnabled ?? true),
    }

    // Consent — read from Strapi field or fall back to defaults
    const storedConsent = me.consentValues || {}
    const defaults = defaultConsentValues()
    const consent: UserConsentState = {
      values: {
        marketing_email: storedConsent.marketing_email ?? defaults.marketing_email,
        marketing_push: storedConsent.marketing_push ?? defaults.marketing_push,
        personalization: storedConsent.personalization ?? defaults.personalization,
        location_recommendations: storedConsent.location_recommendations ?? defaults.location_recommendations,
        analytics: storedConsent.analytics ?? defaults.analytics,
        affiliate_tracking: storedConsent.affiliate_tracking ?? defaults.affiliate_tracking,
      },
      updatedAt: me.consentUpdatedAt || null,
    }

    const deletion: AccountDeletionState = {
      enabled: true,
      requiresConfirmation: true,
      warningCopy:
        "This will permanently delete your account, followed teams, predictions, notification settings, and all personal data. This action cannot be undone.",
    }

    const body: AccountOverviewResponse = {
      profile,
      security,
      preferences,
      consent,
      deletion,
    }

    return NextResponse.json(
      makeSuccessEnvelope<AccountOverviewResponse>({
        data: body,
        source: "strapi",
        maxAgeSeconds: 60,
        confidence: "high",
      }),
    )
  } catch (err: any) {
    console.error("[account/overview]", err)
    return NextResponse.json(
      makeEmptyEnvelope<AccountOverviewResponse>({
        source: "strapi",
        unavailableReason: err instanceof Error ? err.message : "Failed to load account overview",
      }),
      { status: 200 },
    )
  }
}
