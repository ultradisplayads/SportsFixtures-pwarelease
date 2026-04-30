import { NextRequest, NextResponse } from "next/server"

const STRAPI_URL = process.env.SF_API_URL || "https://staging-api.sportsfixtures.net"
const COOKIE_NAME = "sf_auth"
const COOKIE_MAX_AGE = 24 * 60 * 60

/**
 * GET /api/auth/facebook/callback
 * Exchanges Facebook access_token with Strapi for JWT.
 * Returns JSON (not redirect) so cookie is set reliably on 200 response.
 * Matches working Google callback exactly.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const accessToken = searchParams.get("access_token")

  if (!accessToken) {
    return NextResponse.json({ success: false, error: "no_token" }, { status: 400 })
  }

  try {
    const strapiRes = await fetch(
      `${STRAPI_URL}/api/auth/facebook/callback?access_token=${encodeURIComponent(accessToken)}`,
      { method: "GET" }
    )

    const rawBody = await strapiRes.text()
    console.log("[Facebook Callback] Strapi status:", strapiRes.status)
    console.log("[Facebook Callback] Strapi body:", rawBody)

    if (!strapiRes.ok) {
      console.error("[Facebook Callback] Strapi error:", rawBody)
      return NextResponse.json({ success: false, error: "strapi_failed" }, { status: 401 })
    }

    const data = JSON.parse(rawBody)
    const strapiJwt = data?.jwt
    const user = data?.user

    if (!strapiJwt || !user) {
      console.error("[Facebook Callback] No JWT or user in Strapi response")
      return NextResponse.json({ success: false, error: "no_jwt" }, { status: 401 })
    }

    // ✅ Return JSON — cookie set on 200, always reliable across browsers
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
    console.error("[Facebook Callback] Unexpected error:", err)
    return NextResponse.json({ success: false, error: "unexpected" }, { status: 500 })
  }
}