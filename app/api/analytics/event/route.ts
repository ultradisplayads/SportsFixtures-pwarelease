import { NextResponse } from "next/server"

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net").replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { eventType, deviceToken, userId, page, entityType, entityId, meta } = body

    if (!eventType) {
      return NextResponse.json({ success: false, error: "eventType required" }, { status: 400 })
    }

    await fetch(`${SF_API_URL}/api/analytics-events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        data: {
          event_type: eventType,
          device_token: deviceToken ?? null,
          user_id: userId ?? null,
          page: page ?? null,
          entity_type: entityType ?? null,
          entity_id: entityId ?? null,
          meta: meta ?? null,
        },
      }),
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    // Non-fatal — never block user actions for analytics failures
    console.error("[analytics/event]", err)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
