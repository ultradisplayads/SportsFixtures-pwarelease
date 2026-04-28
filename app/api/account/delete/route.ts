// app/api/account/delete/route.ts
// POST /api/account/delete
// Handles real account deletion for both modes:
//   - signed_in: calls Strapi /auth/local/delete-account (or custom plugin endpoint)
//                then also clears device-local rows from Strapi
//   - anonymous_device: clears device-local rows from Strapi only

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSFApiBase, getSFApiHeaders } from "@/lib/account"

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net").replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""
const strapiHeaders = {
  "Content-Type": "application/json",
  ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
}

async function deleteDeviceRows(deviceToken: string): Promise<void> {
  // Delete favourites via Strapi
  await fetch(
    `${SF_API_URL}/api/user-favorites/device/${deviceToken}/all`,
    { method: "DELETE", headers: strapiHeaders }
  ).catch(() => {})

  // Deactivate push subscriptions via Strapi
  await fetch(
    `${SF_API_URL}/api/push-subscriptions/deactivate-by-device`,
    { method: "PATCH", headers: strapiHeaders, body: JSON.stringify({ device_token: deviceToken }) }
  ).catch(() => {})

  // Delete analytics events via Strapi
  await fetch(
    `${SF_API_URL}/api/analytics-events/by-device/${deviceToken}`,
    { method: "DELETE", headers: strapiHeaders }
  ).catch(() => {})
}

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const authHeader = req.headers.get("authorization") || ""
  const jwt =
    authHeader.replace(/^Bearer\s+/i, "").trim() ||
    cookieStore.get("sf_jwt")?.value ||
    ""

  let body: { deviceToken?: string } = {}
  try {
    body = await req.json()
  } catch {
    // body is optional for signed-in deletion
  }

  const deviceToken = body.deviceToken || cookieStore.get("sf_device_token")?.value || ""

  // ── Signed-in mode — delete Strapi account first ───────────────────────
  if (jwt) {
    try {
      const base = getSFApiBase()
      const headers = { ...getSFApiHeaders(), Authorization: `Bearer ${jwt}` }

      const strapiRes = await fetch(`${base}/api/auth/local/delete-account`, {
        method: "DELETE",
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      })

      if (!strapiRes.ok) {
        if (strapiRes.status === 404) {
          // Soft-delete fallback
          await fetch(`${base}/api/users/me`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ deletedAt: new Date().toISOString(), blocked: true }),
            cache: "no-store",
          })
        } else {
          const errJson = await strapiRes.json().catch(() => ({}))
          const msg = errJson?.error?.message || "Failed to delete account from server"
          return NextResponse.json({ success: false, error: msg }, { status: strapiRes.status })
        }
      }

      // Clear device rows too via Strapi (best-effort)
      if (deviceToken) {
        await deleteDeviceRows(deviceToken).catch(() => {})
      }

      const response = NextResponse.json({ success: true })
      response.cookies.delete("sf_jwt")
      return response
    } catch (err: any) {
      console.error("[delete-account/signed-in]", err)
      return NextResponse.json({ success: false, error: "Failed to delete account" }, { status: 500 })
    }
  }

  // ── Anonymous / device-only mode ──────────────────────────────────────
  if (!deviceToken) {
    return NextResponse.json(
      { success: false, error: "No account or device token provided" },
      { status: 400 },
    )
  }

  try {
    await deleteDeviceRows(deviceToken)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[delete-account/device]", err)
    return NextResponse.json({ success: false, error: "Deletion failed" }, { status: 500 })
  }
}
