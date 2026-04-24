import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import type { NotificationSubscriptionProfile } from "@/types/notifications"

const sql = neon(process.env.DATABASE_URL!)

function getDeviceToken(req: NextRequest): string | null {
  return (
    req.headers.get("x-device-token") ||
    req.nextUrl.searchParams.get("deviceToken") ||
    null
  )
}

// ── GET — list all subscriptions for this device ──────────────────────────────

export async function GET(req: NextRequest) {
  const deviceToken = getDeviceToken(req)
  if (!deviceToken) return NextResponse.json({ items: [] })

  try {
    const rows = await sql`
      SELECT * FROM notification_subscriptions
      WHERE device_token = ${deviceToken}
      ORDER BY created_at DESC
    `
    return NextResponse.json({ items: rows.map(dbRowToSub) })
  } catch (err) {
    console.error("[notifications/subscriptions GET]", err)
    return NextResponse.json({ items: [] })
  }
}

// ── POST — upsert a subscription ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const deviceToken = getDeviceToken(req)
  const body: NotificationSubscriptionProfile = await req.json()

  if (!body.entityType || !body.entityId) {
    return NextResponse.json({ error: "entityType and entityId are required" }, { status: 400 })
  }

  // Optimistically return even without a device token (in-memory only mode)
  if (!deviceToken) {
    return NextResponse.json({ items: [body] })
  }

  try {
    await sql`
      INSERT INTO notification_subscriptions (
        device_token, entity_type, entity_id, entity_name,
        categories, reminder_offsets, tier, created_at, updated_at
      ) VALUES (
        ${deviceToken},
        ${body.entityType},
        ${body.entityId},
        ${body.entityName || null},
        ${JSON.stringify(body.categories || [])},
        ${JSON.stringify(body.reminderOffsets || [])},
        ${body.tier || "tier2"},
        NOW(),
        NOW()
      )
      ON CONFLICT (device_token, entity_type, entity_id) DO UPDATE SET
        entity_name     = COALESCE(EXCLUDED.entity_name, notification_subscriptions.entity_name),
        categories      = EXCLUDED.categories,
        reminder_offsets = EXCLUDED.reminder_offsets,
        tier            = EXCLUDED.tier,
        updated_at      = NOW()
    `

    const rows = await sql`
      SELECT * FROM notification_subscriptions
      WHERE device_token = ${deviceToken}
      ORDER BY created_at DESC
    `
    return NextResponse.json({ items: rows.map(dbRowToSub) })
  } catch (err) {
    console.error("[notifications/subscriptions POST]", err)
    // DB not yet migrated — return optimistic item
    return NextResponse.json({ items: [body] })
  }
}

// ── DELETE — remove a subscription ───────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const deviceToken = getDeviceToken(req)
  const entityType = req.nextUrl.searchParams.get("entityType")
  const entityId   = req.nextUrl.searchParams.get("entityId")

  if (!entityType || !entityId) {
    return NextResponse.json({ error: "entityType and entityId are required" }, { status: 400 })
  }

  if (!deviceToken) return NextResponse.json({ items: [] })

  try {
    await sql`
      DELETE FROM notification_subscriptions
      WHERE device_token = ${deviceToken}
        AND entity_type = ${entityType}
        AND entity_id = ${entityId}
    `

    const rows = await sql`
      SELECT * FROM notification_subscriptions
      WHERE device_token = ${deviceToken}
      ORDER BY created_at DESC
    `
    return NextResponse.json({ items: rows.map(dbRowToSub) })
  } catch (err) {
    console.error("[notifications/subscriptions DELETE]", err)
    return NextResponse.json({ items: [] })
  }
}

// ── DB row → domain type ──────────────────────────────────────────────────────

function dbRowToSub(row: any): NotificationSubscriptionProfile {
  const parseArray = (v: any): string[] => {
    if (!v) return []
    if (Array.isArray(v)) return v
    try { return JSON.parse(v) } catch { return [] }
  }
  return {
    id:              String(row.id),
    entityType:      row.entity_type,
    entityId:        row.entity_id,
    entityName:      row.entity_name || undefined,
    categories:      parseArray(row.categories) as any,
    reminderOffsets: parseArray(row.reminder_offsets) as any,
    tier:            row.tier || "tier2",
  }
}
