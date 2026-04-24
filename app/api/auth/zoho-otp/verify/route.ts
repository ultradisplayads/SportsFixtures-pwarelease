import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { email, otp, device_token } = await req.json().catch(() => ({}))
  if (!email || !otp) {
    return NextResponse.json({ error: "email and otp required" }, { status: 400 })
  }
  const apiBase = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net").replace(/\/api-docs\/?$/, "").replace(/\/$/, "")
  try {
    const res = await fetch(`${apiBase}/api/auth/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, device_token }),
    })
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: data.error?.message || "Invalid OTP" }, { status: 400 })
    }
    return NextResponse.json({ success: true, jwt: data.jwt, user: data.user })
  } catch {
    return NextResponse.json({ error: "OTP verification service not yet configured" }, { status: 503 })
  }
}
