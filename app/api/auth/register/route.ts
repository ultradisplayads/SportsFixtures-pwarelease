import { NextRequest, NextResponse } from "next/server"

const STRAPI_URL = process.env.SF_API_URL || "https://staging-api.sportsfixtures.net"

export async function POST(req: NextRequest) {
  const { email, password, username, firstName, lastName } = await req.json().catch(() => ({}))

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(`${STRAPI_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        username: username || email.split("@")[0],
        firstName: firstName || username || email.split("@")[0],
        lastName: lastName || "",
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Registration failed" },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true, message: data.message, email: data.email })
  } catch {
    return NextResponse.json(
      { error: "Registration service unavailable" },
      { status: 503 }
    )
  }
}