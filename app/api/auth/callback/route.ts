import { NextRequest, NextResponse } from "next/server"

const STRAPI_URL = process.env.SF_API_URL || "https://staging-api.sportsfixtures.net"
const COOKIE_NAME = "sf_auth" // matches main web app
const COOKIE_MAX_AGE = 24 * 60 * 60

/**
 * GET /api/auth/callback
 *
 * Generic social OAuth callback — used when Strapi redirects back
 * with ?access_token=... and ?provider=...
 *
 * This is the fallback handler. Dedicated routes exist for:
 *   /api/auth/google/callback
 *   /api/auth/facebook/callback
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const access_token = searchParams.get("access_token")
  const provider = searchParams.get("provider") || "google"

  if (!access_token) {
    return NextResponse.redirect(new URL("/auth/signin?error=no_token", req.url))
  }

  try {
    // Exchange access_token with Strapi for JWT + user
    const strapiRes = await fetch(
      `${STRAPI_URL}/api/auth/${provider}/callback?access_token=${encodeURIComponent(access_token)}`,
      { method: "GET" }
    )

    const rawBody = await strapiRes.text()
    console.log(`[Auth Callback] ${provider} Strapi status:`, strapiRes.status)

    if (!strapiRes.ok) {
      console.error(`[Auth Callback] ${provider} Strapi error:`, rawBody)
      return NextResponse.redirect(new URL("/auth/signin?error=auth_failed", req.url))
    }

    const data = JSON.parse(rawBody)
    const strapiJwt = data?.jwt
    const user = data?.user

    if (!strapiJwt || !user) {
      console.error(`[Auth Callback] No JWT or user from ${provider}`)
      return NextResponse.redirect(new URL("/auth/signin?error=auth_failed", req.url))
    }

    const roleType = user?.role?.type || "authenticated"
    const redirectPath = getRoleRedirect(roleType)
    const response = NextResponse.redirect(new URL(redirectPath, req.url))

    // ✅ JWT in httpOnly cookie — matches main web app
    response.cookies.set(COOKIE_NAME, strapiJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    })

    // NOTE: sf_auth_init removed — AuthProvider hydrates via /api/auth/me on mount

    return response
  } catch (err) {
    console.error(`[Auth Callback] Unexpected error:`, err)
    return NextResponse.redirect(new URL("/auth/signin?error=auth_failed", req.url))
  }
}

function getRoleRedirect(roleType: string): string {
  switch (roleType) {
    case "venue_owner": return "/venue-owners"
    case "admin":
    case "internal":    return "/admin"
    default:            return "/"
  }
}