// GET /api/venue-watchers?venueId=<id>&eventId=<id>
// Returns the count of users currently watching a given event at a venue.
// Proxies to the SF backend /api/venue-watchers endpoint.
// Returns { count: 0 } when the endpoint is unavailable.

import { NextRequest, NextResponse } from "next/server"

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net")
  .replace(/\/api-docs\/?$/, "")
  .replace(/\/$/, "")
const getSFToken = () => process.env.SF_API_TOKEN || ""

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const venueId = searchParams.get("venueId")
  const eventId = searchParams.get("eventId")

  if (!venueId) {
    return NextResponse.json({ error: "venueId required" }, { status: 400 })
  }

  try {
    const token = getSFToken()
    const qs = new URLSearchParams({
      "filters[venue][id][$eq]": venueId,
      "pagination[pageSize]": "1",
    })
    if (eventId) qs.set("filters[event][id][$eq]", eventId)

    const res = await fetch(
      `${SF_API_URL}/api/venue-watchers?${qs}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      },
    )

    if (!res.ok) {
      return NextResponse.json({ venueId, eventId: eventId ?? null, count: 0 }, { status: 200 })
    }

    const json = await res.json()
    const count =
      json?.meta?.pagination?.total ??
      json?.count ??
      (Array.isArray(json?.data) ? json.data.length : 0)

    return NextResponse.json(
      { venueId, eventId: eventId ?? null, count },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    )
  } catch {
    return NextResponse.json(
      { venueId, eventId: eventId ?? null, count: 0 },
      { status: 200 },
    )
  }
}
