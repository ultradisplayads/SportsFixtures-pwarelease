// app/api/account/password/route.ts
// POST /api/account/password
// Changes the user's password via Strapi's /auth/change-password endpoint.
// Only available when the user is signed in with a password (local) provider.
// Never pretends to succeed — only returns success if Strapi confirms the change.

import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSFApiBase, getSFApiHeaders } from "@/lib/account"
import type { PasswordChangePayload } from "@/types/account"

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const authHeader = req.headers.get("authorization") || ""
  const jwt =
    authHeader.replace(/^Bearer\s+/i, "").trim() ||
    cookieStore.get("sf_jwt")?.value ||
    ""

  if (!jwt) {
    return NextResponse.json(
      { error: "Authentication required to change password" },
      { status: 401 },
    )
  }

  let body: PasswordChangePayload
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { currentPassword, newPassword, confirmPassword } = body

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { error: "All password fields are required" },
      { status: 400 },
    )
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: "New passwords do not match" },
      { status: 400 },
    )
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters" },
      { status: 400 },
    )
  }

  try {
    const base = getSFApiBase()
    const headers = { ...getSFApiHeaders(), Authorization: `Bearer ${jwt}` }

    const res = await fetch(`${base}/api/auth/change-password`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        currentPassword,
        password: newPassword,
        passwordConfirmation: confirmPassword,
      }),
      cache: "no-store",
    })

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}))
      const msg =
        errJson?.error?.message ||
        errJson?.message ||
        "Failed to change password. Check your current password and try again."
      return NextResponse.json({ error: msg }, { status: res.status })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[account/password]", err)
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}
