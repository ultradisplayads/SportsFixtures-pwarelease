import { NextRequest, NextResponse } from "next/server"

const STRAPI_URL = process.env.SF_API_URL || "https://staging-api.sportsfixtures.net"
const COOKIE_NAME = "sf_auth"
const COOKIE_MAX_AGE = 24 * 60 * 60

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json().catch(() => ({}))

  if (!email || !otp) {
    return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 })
  }

  try {
    const res = await fetch(`${STRAPI_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Invalid OTP" },
        { status: 400 }
      )
    }

    const jwt = data?.jwt
    const user = data?.user

    if (!jwt || !user) {
      return NextResponse.json({ error: "Verification failed" }, { status: 500 })
    }

    // ✅ JWT in httpOnly cookie — same pattern as Google/Facebook
    const response = NextResponse.json({ success: true, user })

    response.cookies.set(COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    })

    return response
  } catch {
    return NextResponse.json({ error: "OTP service unavailable" }, { status: 503 })
  }
}
