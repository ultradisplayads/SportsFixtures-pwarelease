import { NextRequest, NextResponse } from "next/server"

const STRAPI_URL = process.env.NEXT_PUBLIC_API_URL || "https://staging-api.sportsfixtures.net"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      // Account
      password,
      // Owner
      ownerName, ownerEmail, ownerPhone,
      // Venue
      venueName, venueType,
      address, city, country,
      website, whatsapp, lineId,
      screenCount, capacity,
      lat, lng,
      sports, hasPool, hasDarts,
      message,
    } = body

    // Validation
    if (!ownerName || !ownerEmail || !ownerPhone || !venueName || !address || !city || !country) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      )
    }

    // Step 1 — Create Strapi user account with venue_owner role
    const registerRes = await fetch(`${STRAPI_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email:       ownerEmail,
        password:    password,
        username:    ownerEmail, // use email as username
        firstName:   ownerName.split(" ")[0] || ownerName,
        lastName:    ownerName.split(" ").slice(1).join(" ") || ownerName,
        phoneNumber: ownerPhone,
        age:         18, // default — can update in profile
      }),
    })

    const registerData = await registerRes.json()

    if (!registerRes.ok) {
      const errorMsg = registerData?.error?.message || registerData?.error || "Failed to create account"
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: registerRes.status }
      )
    }

    // Step 2 — Save venue signup application to Strapi
    const signupRes = await fetch(`${STRAPI_URL}/api/venue-signups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerName,
        ownerEmail,
        ownerPhone,
        venueName,
        venueType:   venueType   ?? "bar",
        address,
        city,
        country,
        website:     website     ?? null,
        whatsapp:    whatsapp    ?? null,
        lineId:      lineId      ?? null,
        screenCount: screenCount ? Number(screenCount) : null,
        capacity:    capacity    ? Number(capacity)    : null,
        lat:         lat         ? Number(lat)         : null,
        lng:         lng         ? Number(lng)         : null,
        sports:      sports      ?? [],
        hasPool:     hasPool     ?? false,
        hasDarts:    hasDarts    ?? false,
        message:     message     ?? null,
        status:      "pending",
      }),
    })

    // Non-blocking — if signup save fails, account is still created
    if (!signupRes.ok) {
      console.error("[venue-signup] Failed to save signup data — account still created")
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[venue-signup] error:", err)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}