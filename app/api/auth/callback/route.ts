import { NextRequest, NextResponse } from "next/server"

// Strapi social auth callback
// After Google/Facebook/Apple auth, Strapi redirects to:
// /api/auth/callback?access_token={jwt}&device_token={token}&provider={provider}
//
// This handler stores the JWT in a httpOnly cookie and redirects to the app.

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const access_token = searchParams.get("access_token")
  const provider = searchParams.get("provider") || "google"
  const device_token = searchParams.get("device_token") || ""

  if (!access_token) {
    return NextResponse.redirect(new URL("/sign-in?error=no_token", req.url))
  }

  // Fetch user details from Strapi
  const apiBase = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net").replace(/\/api-docs\/?$/, "").replace(/\/$/, "")
  let user = null
  try {
    const res = await fetch(`${apiBase}/api/users/me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    if (res.ok) user = await res.json()
  } catch { /* ignore — still set cookie */ }

  const response = NextResponse.redirect(new URL("/", req.url))

  // Store JWT in httpOnly cookie (7 days)
  response.cookies.set("sf_jwt", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })

  // Pass user info + device_token back via a short-lived client-readable cookie
  // so the AuthProvider can hydrate on next render
  if (user) {
    response.cookies.set("sf_auth_init", JSON.stringify({
      id: String(user.id),
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      provider,
      deviceToken: device_token,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60, // 1 minute — just enough for the client to read and store
      path: "/",
    })
  }

  return response
}
