// GET  /api/venue-checkins?venueId=<id>   — count of active check-ins at a venue
// POST /api/venue-checkins                 — record a check-in for the session user
//
// Today: stores check-ins in the SF backend (/api/venue-checkins).
// Falls back gracefully when the endpoint is not yet provisioned.

import { NextRequest, NextResponse } from "next/server"

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net")
  .replace(/\/api-docs\/?$/, "")
  .replace(/\/$/, "")
const getSFToken = () => process.env.SF_API_TOKEN || ""

function sfHeaders() {
  const token = getSFToken()
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function GET(req: NextRequest) {
  const venueId = req.nextUrl.searchParams.get("venueId")
  if (!venueId) {
    return NextResponse.json({ error: "venueId required" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${SF_API_URL}/api/venue-checkins?filters[venue][id][$eq]=${venueId}&pagination[pageSize]=1`,
      { headers: sfHeaders(), cache: "no-store" },
    )
    if (!res.ok) {
      return NextResponse.json({ count: 0 }, { status: 200 })
    }
    const json = await res.json()
    const count =
      json?.meta?.pagination?.total ??
      (Array.isArray(json?.data) ? json.data.length : 0)
    return NextResponse.json({ venueId, count }, { status: 200 })
  } catch {
    return NextResponse.json({ venueId, count: 0 }, { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { venueId, eventId, userId } = body ?? {}
    if (!venueId) {
      return NextResponse.json({ error: "venueId required" }, { status: 400 })
    }

    const res = await fetch(`${SF_API_URL}/api/venue-checkins`, {
      method: "POST",
      headers: sfHeaders(),
      body: JSON.stringify({
        data: {
          venue:   venueId,
          event:   eventId ?? null,
          user:    userId  ?? null,
          checkedInAt: new Date().toISOString(),
        },
      }),
    })

    if (!res.ok) {
      // Non-2xx from backend — return accepted anyway so the client UX is positive
      return NextResponse.json({ ok: true, persisted: false }, { status: 200 })
    }

    const json = await res.json()
    return NextResponse.json(
      { ok: true, persisted: true, id: json?.data?.id ?? null },
      { status: 201 },
    )
  } catch {
    return NextResponse.json({ ok: true, persisted: false }, { status: 200 })
  }
}
