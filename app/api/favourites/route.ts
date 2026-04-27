import { NextRequest, NextResponse } from "next/server"

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net").replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""
const strapiHeaders = {
  "Content-Type": "application/json",
  ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
}

function getDeviceToken(req: NextRequest): string | null {
  return req.headers.get("x-device-token") || null
}

// GET /api/favourites — list all favourites for this device
export async function GET(req: NextRequest) {
  const token = getDeviceToken(req)
  if (!token) return NextResponse.json({ error: "Missing x-device-token" }, { status: 400 })

  try {
    const res = await fetch(
      `${SF_API_URL}/api/user-favorites/device/${token}`,
      { headers: strapiHeaders, cache: "no-store" }
    )
    if (!res.ok) return NextResponse.json({ favourites: [] })
    const data = await res.json()
    // Map Strapi format back to PWA format
    const favourites = (data.data || []).map((f: any) => ({
      entity_type: f.entityType,
      entity_id: f.entityId,
      entity_name: f.entityName || null,
      entity_logo: f.entityLogo || null,
      entity_meta: f.entityMeta || {},
      created_at: f.createdAt,
    }))
    return NextResponse.json({ favourites })
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
        await fetch(`${SF_API_URL}/api/user-favorites/device`, {
          method: "POST",
          headers: strapiHeaders,
          body: JSON.stringify({
            deviceToken: token,
            entityType: "team",
            entityId: String(team.id),
            entityName: team.name || null,
            entityLogo: team.logo || null,
          }),
        })
      }
      return NextResponse.json({ success: true, count: body.teams.length })
    }

    // Single mode
    const { entity_type, entity_id, entity_name, entity_logo, entity_meta = {} } = body
    if (!entity_type || !entity_id) {
      return NextResponse.json({ error: "entity_type and entity_id required" }, { status: 400 })
    }

    await fetch(`${SF_API_URL}/api/user-favorites/device`, {
      method: "POST",
      headers: strapiHeaders,
      body: JSON.stringify({
        deviceToken: token,
        entityType: entity_type,
        entityId: entity_id,
        entityName: entity_name || null,
        entityLogo: entity_logo || null,
        entityMeta: entity_meta,
      }),
    })

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

    await fetch(
      `${SF_API_URL}/api/user-favorites/device/${token}/${entity_type}/${entity_id}`,
      { method: "DELETE", headers: strapiHeaders }
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[favourites DELETE]", err)
    return NextResponse.json({ error: "Failed to remove favourite" }, { status: 500 })
  }
}
