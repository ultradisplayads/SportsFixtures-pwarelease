import { NextRequest, NextResponse } from "next/server"

const STRAPI_URL = process.env.SF_API_URL || "https://staging-api.sportsfixtures.net"
const COOKIE_NAME = "sf_auth"
const COOKIE_MAX_AGE = 24 * 60 * 60

/**
 * GET /api/auth/google/callback
 * Exchanges Google access_token with Strapi for JWT.
 * Returns JSON (not redirect) so cookie is set reliably on 200 response.
 * The callback PAGE handles the redirect after reading the JSON.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const accessToken = searchParams.get("access_token") || searchParams.get("id_token")

  if (!accessToken) {
    return NextResponse.json({ success: false, error: "no_token" }, { status: 400 })
  }

  try {
    const strapiRes = await fetch(
      `${STRAPI_URL}/api/auth/google/callback?access_token=${encodeURIComponent(accessToken)}`,
      { method: "GET" }
    )

    const rawBody = await strapiRes.text()
    console.log("[Google Callback] Strapi status:", strapiRes.status)

    if (!strapiRes.ok) {
      console.error("[Google Callback] Strapi error:", rawBody)
      return NextResponse.json({ success: false, error: "strapi_failed" }, { status: 401 })
    }

    const data = JSON.parse(rawBody)
    const strapiJwt = data?.jwt
    const user = data?.user

    if (!strapiJwt || !user) {
      console.error("[Google Callback] No JWT or user in Strapi response")
      return NextResponse.json({ success: false, error: "no_jwt" }, { status: 401 })
    }

    // ✅ Return JSON — cookie set on 200, always reliable across browsers
    // The /auth/google/callback page reads this and handles the redirect
    const response = NextResponse.json({ success: true, user })

    response.cookies.set(COOKIE_NAME, strapiJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    })

    return response
  } catch (err) {
    console.error("[Google Callback] Unexpected error:", err)
    return NextResponse.json({ success: false, error: "unexpected" }, { status: 500 })
  }
}