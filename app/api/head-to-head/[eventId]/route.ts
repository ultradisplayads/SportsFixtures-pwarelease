import { NextRequest, NextResponse } from "next/server"

const SF_API_URL = (
  process.env.SF_API_URL || "https://staging-api.sportsfixtures.net"
).replace(/\/api-docs\/?$/, "").replace(/\/$/, "")

const getSFToken = () => process.env.SF_API_TOKEN || ""

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params

  if (!eventId || !/^\d+$/.test(eventId)) {
    return NextResponse.json(
      { success: false, error: "Valid numeric event ID is required" },
      { status: 400 }
    )
  }

  try {
    const token = getSFToken()
    const response = await fetch(
      `${SF_API_URL}/api/head-to-head/${eventId}`,
      {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ success: false, data: [] }, { status: 200 })
      }
      throw new Error(`SF API error: ${response.status}`)
    }

    const payload = await response.json()
    return NextResponse.json(payload)
  } catch (error) {
    console.error(`[head-to-head] Error fetching H2H for ${eventId}:`, error)
    return NextResponse.json({ success: false, data: [] }, { status: 200 })
  }
}
