import { NextRequest, NextResponse } from "next/server"

const STRAPI_URL = process.env.SF_API_URL || "https://staging-api.sportsfixtures.net"

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}))

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  try {
    const res = await fetch(`${STRAPI_URL}/api/auth/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    if (res.ok) return NextResponse.json({ success: true })

    const err = await res.json()
    return NextResponse.json(
      { error: err.error?.message || "Failed to send OTP" },
      { status: 400 }
    )
  } catch {
    return NextResponse.json({ error: "OTP service unavailable" }, { status: 503 })
  }
}