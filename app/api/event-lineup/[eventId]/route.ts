import { NextRequest, NextResponse } from "next/server"

const SF_API_URL = (
  process.env.SF_API_URL || "https://staging-api.sportsfixtures.net"
).replace(/\/api-docs\/?$/, "").replace(/\/$/, "")

const getSFToken = () => process.env.SF_API_TOKEN || ""

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params

  if (!eventId || !/^\d+$/.test(eventId)) {
    return NextResponse.json(
      { success: false, error: "Valid numeric event ID is required" },
      { status: 400 }
    )
  }

  const { searchParams } = request.nextUrl
  const format = searchParams.get("format") || "raw"

  try {
    const token = getSFToken()
    const url = new URL(`${SF_API_URL}/api/event-lineup/${eventId}`)
    url.searchParams.set("format", format)

    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ success: false, data: null }, { status: 200 })
      }
      throw new Error(`SF API error: ${response.status}`)
    }

    const payload = await response.json()
    return NextResponse.json(payload)
  } catch (error) {
    console.error(`[event-lineup] Error fetching lineup for ${eventId}:`, error)
    return NextResponse.json({ success: false, data: null }, { status: 200 })
  }
}
