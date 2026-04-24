import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { eventType, deviceToken, userId, page, entityType, entityId, meta } = body

    if (!eventType) {
      return NextResponse.json({ success: false, error: "eventType required" }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    await sql`
      INSERT INTO analytics_events (event_type, device_token, user_id, page, entity_type, entity_id, meta)
      VALUES (
        ${eventType},
        ${deviceToken ?? null},
        ${userId ?? null},
        ${page ?? null},
        ${entityType ?? null},
        ${entityId ?? null},
        ${meta ? JSON.stringify(meta) : null}
      )
    `

    return NextResponse.json({ success: true })
  } catch (err: any) {
    // Non-fatal — never block user actions for analytics failures
    console.error("[analytics/event]", err)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
