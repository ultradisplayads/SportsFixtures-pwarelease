import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import type { NotificationItem } from "@/types/notifications"
import { notificationStore } from "@/lib/notification-store"

const sql = neon(process.env.DATABASE_URL!)

function getDeviceToken(req: NextRequest): string | null {
  return (
    req.headers.get("x-device-token") ||
    req.nextUrl.searchParams.get("deviceToken") ||
    null
  )
}

// ── GET — list notification history newest first ───────────────────────────────

export async function GET(req: NextRequest) {
  const deviceToken = getDeviceToken(req)

  if (!deviceToken) {
    // No device token — return empty list (history requires persistence)
    return NextResponse.json({ items: [] })
  }

  try {
    const rows = await sql`
      SELECT * FROM notification_history
      WHERE device_token = ${deviceToken}
      ORDER BY created_at DESC
      LIMIT 100
    `
    return NextResponse.json({ items: rows.map(dbRowToItem) })
  } catch (err) {
    console.error("[notifications/history GET]", err)
    // If table doesn't exist yet, return empty list gracefully
    return NextResponse.json({ items: [] })
  }
}

// ── POST — record a new notification in history ───────────────────────────────

export async function POST(req: NextRequest) {
  const deviceToken = getDeviceToken(req)
  const body = await req.json()

  if (!body.title || !body.category) {
    return NextResponse.json({ error: "title and category required" }, { status: 400 })
  }

  if (!deviceToken) {
    return NextResponse.json({ error: "deviceToken required" }, { status: 400 })
  }

  try {
    const rows = await sql`
      INSERT INTO notification_history (
        device_token, title, body, category, tier,
        entity_type, entity_id, event_id, url, reason,
        read, created_at
      ) VALUES (
        ${deviceToken},
        ${body.title},
        ${body.body || null},
        ${body.category},
        ${body.tier || "tier2"},
        ${body.entityType || null},
        ${body.entityId || null},
        ${body.eventId || null},
        ${body.url || null},
        ${body.reason || null},
        FALSE,
        NOW()
      )
      RETURNING *
    `
    return NextResponse.json(dbRowToItem(rows[0]))
  } catch (err) {
    console.error("[notifications/history POST]", err)
    return NextResponse.json({ error: "Failed to record notification" }, { status: 500 })
  }
}

// ── DB row → domain type ──────────────────────────────────────────────────────

function dbRowToItem(row: any): NotificationItem {
  return {
    id:         String(row.id),
    title:      row.title,
    body:       row.body || undefined,
    category:   row.category,
    tier:       row.tier || "tier2",
    entityType: row.entity_type || undefined,
    entityId:   row.entity_id || undefined,
    eventId:    row.event_id || undefined,
    url:        row.url || undefined,
    createdAt:  row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    read:       !!row.read,
    reason:     row.reason || undefined,
  }
}
