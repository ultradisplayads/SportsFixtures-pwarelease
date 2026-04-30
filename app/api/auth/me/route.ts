import { NextRequest, NextResponse } from "next/server"

const STRAPI_URL = process.env.SF_API_URL || "https://staging-api.sportsfixtures.net"
const COOKIE_NAME = "sf_auth"

/**
 * GET /api/auth/me
 * Validates httpOnly cookie and returns current user with role.
 * Matches main web app exactly.
 */
export async function GET(req: NextRequest) {
  const jwt = req.cookies.get(COOKIE_NAME)?.value

  if (!jwt) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 401 }
    )
  }

  try {
    const strapiRes = await fetch(`${STRAPI_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })

    // Only clear cookie on confirmed 401 — not on network errors or 500s
    if (strapiRes.status === 401) {
      const response = NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      )
      response.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" })
      return response
    }

    // Any other non-200 — keep cookie alive, may be temporary server issue
    if (!strapiRes.ok) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      )
    }

    const data = await strapiRes.json()

    if (!data.user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      )
    }

    return NextResponse.json({ authenticated: true, user: data.user })
  } catch {
    // Network error — keep cookie alive
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 503 }
    )
  }
}

/**
 * DELETE /api/auth/me
 * Deletes account and clears session cookie.
 */
export async function DELETE(req: NextRequest) {
  const jwt = req.cookies.get(COOKIE_NAME)?.value

  if (!jwt) {
    return NextResponse.json(
      { success: false, error: "Not authenticated." },
      { status: 401 }
    )
  }

  try {
    const strapiRes = await fetch(`${STRAPI_URL}/api/auth/me`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` },
    })

    const data = await strapiRes.json()

    if (!strapiRes.ok) {
      return NextResponse.json(
        { success: false, error: data?.error?.message || "Failed to delete account." },
        { status: strapiRes.status }
      )
    }

    const response = NextResponse.json({ success: true, message: "Account deleted successfully." })
    response.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" })
    return response
  } catch (err) {
    console.error("[/api/auth/me DELETE]", err)
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred." },
      { status: 500 }
    )
  }
}