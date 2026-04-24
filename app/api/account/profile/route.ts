// app/api/account/profile/route.ts
// PATCH /api/account/profile
// Updates the user's editable profile fields and returns the updated UserProfileSummary.
// Only operates when a valid JWT is present — anonymous mode cannot persist these fields.

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSFApiBase, getSFApiHeaders } from "@/lib/account"
import type { ProfileEditPayload } from "@/types/account"

const ALLOWED_FIELDS: (keyof ProfileEditPayload)[] = [
  "displayName",
  "firstName",
  "lastName",
  "phone",
  "city",
  "country",
  "timezone",
]

export async function PATCH(req: Request) {
  const cookieStore = await cookies()
  const authHeader = req.headers.get("authorization") || ""
  const jwt =
    authHeader.replace(/^Bearer\s+/i, "").trim() ||
    cookieStore.get("sf_jwt")?.value ||
    ""

  if (!jwt) {
    return NextResponse.json(
      { error: "Authentication required to update profile" },
      { status: 401 },
    )
  }

  let body: ProfileEditPayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  // Strip any fields that are not in the allowed list
  const sanitized: Partial<ProfileEditPayload> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body && typeof body[key] === "string") {
      sanitized[key] = (body[key] as string).trim()
    }
  }

  try {
    const base = getSFApiBase()
    const headers = { ...getSFApiHeaders(), Authorization: `Bearer ${jwt}` }

    // Strapi /users/me PUT
    const res = await fetch(`${base}/api/users/me`, {
      method: "PUT",
      headers,
      body: JSON.stringify(sanitized),
      cache: "no-store",
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      const msg =
        errJson?.error?.message || errJson?.message || "Failed to save profile"
      return NextResponse.json({ error: msg }, { status: res.status })
    }

    const updated = await res.json()

    return NextResponse.json({
      profile: {
        id: String(updated.id),
        mode: "signed_in",
        displayName: updated.displayName || null,
        firstName: updated.firstName || null,
        lastName: updated.lastName || null,
        email: updated.email || null,
        phone: updated.phone || null,
        avatarUrl: updated.avatar?.url || null,
        city: updated.city || null,
        country: updated.country || null,
        timezone: updated.timezone || null,
        createdAt: updated.createdAt || null,
        premiumTier: updated.premiumTier || null,
        premiumActive: Boolean(updated.premiumActive),
      },
    })
  } catch (err: any) {
    console.error("[account/profile]", err)
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 })
  }
}
