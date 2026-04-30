import { NextRequest, NextResponse } from "next/server"

const STRAPI_URL = process.env.SF_API_URL || "https://staging-api.sportsfixtures.net"
const COOKIE_NAME = "sf_auth"
const COOKIE_MAX_AGE = 24 * 60 * 60 // 24 hours

/**
 * POST /api/auth/login
 * Proxies login to Strapi, sets JWT in httpOnly cookie.
 * Matches main web app exactly.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      )
    }

    const strapiRes = await fetch(`${STRAPI_URL}/api/auth/local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: email, password }),
    })

    const data = await strapiRes.json()

    if (!strapiRes.ok) {
      const message = data?.error?.message || "Invalid email or password."
      return NextResponse.json({ success: false, error: message }, { status: 401 })
    }

    const jwt = data?.jwt
    const user = data?.user

    if (!jwt || !user) {
      return NextResponse.json(
        { success: false, error: "Login failed. Please try again." },
        { status: 500 }
      )
    }

    // Fetch full user with role populated
    let fullUser = user
    try {
      const meRes = await fetch(`${STRAPI_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      })
      if (meRes.ok) {
        const meData = await meRes.json()
        fullUser = meData?.user || user
      }
    } catch {
      // Fall back to basic user
    }

    const response = NextResponse.json({ success: true, user: fullUser })

    // JWT in httpOnly cookie — never exposed to JS
    response.cookies.set(COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    })

    return response
  } catch (err) {
    console.error("[/api/auth/login]", err)
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred." },
      { status: 500 }
    )
  }
}