// app/api/account/consent/route.ts
// PATCH /api/account/consent
// Persists the user's privacy/consent preferences.
// For signed-in users: saves to Strapi profile.
// For anonymous users: returns 200 with a local-only acknowledgement —
// the client stores consent in localStorage since there is no server account.

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSFApiBase, getSFApiHeaders, defaultConsentValues, CONSENT_KEYS } from "@/lib/account"
import type { ConsentUpdatePayload, ConsentKey } from "@/types/account"

export async function PATCH(req: Request) {
  const cookieStore = await cookies()
  const authHeader = req.headers.get("authorization") || ""
  const jwt =
    authHeader.replace(/^Bearer\s+/i, "").trim() ||
    cookieStore.get("sf_jwt")?.value ||
    ""

  let body: ConsentUpdatePayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  // Validate and sanitize — only known consent keys, boolean values
  const defaults = defaultConsentValues()
  const sanitized: Record<ConsentKey, boolean> = { ...defaults }
  for (const key of CONSENT_KEYS) {
    if (key in (body.values ?? {})) {
      sanitized[key] = Boolean(body.values[key])
    }
  }

  // Anonymous mode — acknowledge without server write
  if (!jwt) {
    return NextResponse.json({
      success: true,
      localOnly: true,
      values: sanitized,
      updatedAt: new Date().toISOString(),
      note: "Consent preferences stored on device only (no signed-in account).",
    })
  }

  // Signed-in — persist to Strapi
  try {
    const base = getSFApiBase()
    const headers = { ...getSFApiHeaders(), Authorization: `Bearer ${jwt}` }

    const res = await fetch(`${base}/api/users/me`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        consentValues: sanitized,
        consentUpdatedAt: new Date().toISOString(),
      }),
      cache: "no-store",
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      const msg = errJson?.error?.message || "Failed to save privacy settings"
      return NextResponse.json({ error: msg }, { status: res.status })
    }

    return NextResponse.json({
      success: true,
      values: sanitized,
      updatedAt: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error("[account/consent]", err)
    return NextResponse.json({ error: "Failed to save privacy settings" }, { status: 500 })
  }
}
