import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

function getDeviceToken(req: NextRequest): string | null {
  return req.headers.get("x-device-token") || null
}

// GET /api/favourites — list all favourites for this device
export async function GET(req: NextRequest) {
  const token = getDeviceToken(req)
  if (!token) return NextResponse.json({ error: "Missing x-device-token" }, { status: 400 })

  try {
    const rows = await sql`
      SELECT entity_type, entity_id, entity_name, entity_logo, entity_meta, created_at
      FROM favourites
      WHERE device_token = ${token}
      ORDER BY created_at DESC
    `
    return NextResponse.json({ favourites: rows })
  } catch (err) {
    console.error("[favourites GET]", err)
    return NextResponse.json({ error: "Failed to fetch favourites" }, { status: 500 })
  }
}

// POST /api/favourites — add a favourite (single or bulk onboarding sync)
export async function POST(req: NextRequest) {
  const token = getDeviceToken(req)
  if (!token) return NextResponse.json({ error: "Missing x-device-token" }, { status: 400 })

  try {
    const body = await req.json()

    // Bulk mode: { teams: [{ id, name, logo? }, ...] } — used by onboarding
    if (Array.isArray(body.teams)) {
      for (const team of body.teams) {
        if (!team.id) continue
        await sql`
          INSERT INTO favourites (device_token, entity_type, entity_id, entity_name, entity_logo, entity_meta)
          VALUES (${token}, 'team', ${String(team.id)}, ${team.name || null}, ${team.logo || null}, '{}')
          ON CONFLICT (device_token, entity_type, entity_id) DO NOTHING
        `
      }
      return NextResponse.json({ success: true, count: body.teams.length })
    }

    // Single mode: { entity_type, entity_id, entity_name, ... }
    const { entity_type, entity_id, entity_name, entity_logo, entity_meta = {} } = body
    if (!entity_type || !entity_id) {
      return NextResponse.json({ error: "entity_type and entity_id required" }, { status: 400 })
    }

    await sql`
      INSERT INTO favourites (device_token, entity_type, entity_id, entity_name, entity_logo, entity_meta)
      VALUES (${token}, ${entity_type}, ${entity_id}, ${entity_name || null}, ${entity_logo || null}, ${JSON.stringify(entity_meta)})
      ON CONFLICT (device_token, entity_type, entity_id) DO UPDATE
        SET entity_name = EXCLUDED.entity_name,
            entity_logo = EXCLUDED.entity_logo,
            entity_meta = EXCLUDED.entity_meta
    `
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[favourites POST]", err)
    return NextResponse.json({ error: "Failed to save favourite" }, { status: 500 })
  }
}

// DELETE /api/favourites — remove a favourite
export async function DELETE(req: NextRequest) {
  const token = getDeviceToken(req)
  if (!token) return NextResponse.json({ error: "Missing x-device-token" }, { status: 400 })

  try {
    const { entity_type, entity_id } = await req.json()
    if (!entity_type || !entity_id) {
      return NextResponse.json({ error: "entity_type and entity_id required" }, { status: 400 })
    }

    await sql`
      DELETE FROM favourites
      WHERE device_token = ${token}
        AND entity_type = ${entity_type}
        AND entity_id = ${entity_id}
    `
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[favourites DELETE]", err)
    return NextResponse.json({ error: "Failed to remove favourite" }, { status: 500 })
  }
}
