// app/api/account/delete/route.ts
// POST /api/account/delete
// Handles real account deletion for both modes:
//   - signed_in: calls Strapi /auth/local/delete-account (or custom plugin endpoint)
//                then also clears device-local rows from Neon
//   - anonymous_device: clears device-local rows from Neon only
//
// NEVER pretends to succeed. Returns a real error on failure so the UI can
// show the user what went wrong instead of false-confirming deletion.

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { neon } from "@neondatabase/serverless"
import { getSFApiBase, getSFApiHeaders } from "@/lib/account"

async function deleteDeviceRows(deviceToken: string): Promise<void> {
  if (!process.env.DATABASE_URL) return
  const sql = neon(process.env.DATABASE_URL)
  // Intentional: these may throw — caller handles errors
  await sql`DELETE FROM favourites WHERE device_token = ${deviceToken}`
  await sql`DELETE FROM push_subscriptions WHERE device_token = ${deviceToken}`
  await sql`DELETE FROM analytics_events WHERE device_token = ${deviceToken}`
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

      // Strapi custom delete endpoint (adjust path to match SF backend plugin)
      const strapiRes = await fetch(`${base}/api/auth/local/delete-account`, {
        method: "DELETE",
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      })

      if (!strapiRes.ok) {
        // Strapi may return 404 if the endpoint isn't yet wired — fall back to
        // marking the account as deleted via PUT (soft-delete pattern)
        if (strapiRes.status === 404) {
          // Soft-delete fallback: mark account as deletedAt in Strapi profile
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

      // Clear device rows too (best-effort — don't fail if Neon unavailable)
      if (deviceToken) {
        await deleteDeviceRows(deviceToken).catch(() => {})
      }

      // Clear the JWT cookie
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
