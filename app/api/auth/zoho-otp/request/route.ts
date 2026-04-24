import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}))
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }
  const apiBase = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net").replace(/\/api-docs\/?$/, "").replace(/\/$/, "")
  try {
    const res = await fetch(`${apiBase}/api/auth/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    if (res.ok) return NextResponse.json({ success: true })
    const err = await res.json()
    return NextResponse.json({ error: err.error?.message || "Failed to send OTP" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "OTP service not yet configured" }, { status: 503 })
  }
}
