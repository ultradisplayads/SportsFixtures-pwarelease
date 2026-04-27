import { NextRequest, NextResponse } from "next/server"

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net").replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""
const strapiHeaders = {
  "Content-Type": "application/json",
  ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
}

// POST /api/auth/migrate-device
// Called automatically after login to link device_token push subscriptions to user account.
// This means a user who followed teams before registering keeps all their data.

export async function POST(req: NextRequest) {
  const { device_token, user_id } = await req.json().catch(() => ({}))

  if (!device_token || !user_id) {
    return NextResponse.json({ error: "device_token and user_id required" }, { status: 400 })
  }

  try {
    // Call Strapi to link device_token push subscriptions to user_id
    await fetch(`${SF_API_URL}/api/push-subscriptions/migrate-device`, {
      method: "POST",
      headers: strapiHeaders,
      body: JSON.stringify({ device_token, user_id }),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[migrate-device]", err)
    return NextResponse.json({ error: "Migration failed" }, { status: 500 })
  }
}
