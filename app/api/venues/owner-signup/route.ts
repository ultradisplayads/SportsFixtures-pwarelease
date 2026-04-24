import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      ownerName,
      ownerEmail,
      ownerPhone,
      venueName,
      venueType,
      address,
      city,
      country,
      website,
      whatsapp,
      lineId,
      screenCount,
      capacity,
      lat,
      lng,
      sports,
      hasPool,
      hasDarts,
      message,
    } = body

    // Basic validation
    if (!ownerName || !ownerEmail || !ownerPhone || !venueName || !address || !city || !country) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    await sql`
      INSERT INTO venue_signups (
        owner_name, owner_email, owner_phone,
        venue_name, venue_type,
        address, city, country,
        website, whatsapp, line_id,
        screen_count, capacity,
        lat, lng,
        sports, has_pool, has_darts,
        message, status
      ) VALUES (
        ${ownerName}, ${ownerEmail}, ${ownerPhone},
        ${venueName}, ${venueType ?? "bar"},
        ${address}, ${city}, ${country},
        ${website ?? null}, ${whatsapp ?? null}, ${lineId ?? null},
        ${screenCount ? Number(screenCount) : null}, ${capacity ? Number(capacity) : null},
        ${lat ? Number(lat) : null}, ${lng ? Number(lng) : null},
        ${sports ?? []}, ${hasPool ?? false}, ${hasDarts ?? false},
        ${message ?? null}, 'pending'
      )
    `

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[venue-signup] error:", err)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
