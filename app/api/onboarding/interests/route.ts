import { NextRequest, NextResponse } from "next/server"

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net").replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""

export async function POST(req: NextRequest) {
  const deviceToken = req.headers.get("x-device-token") || null

  try {
    const body = await req.json()

    await fetch(`${SF_API_URL}/api/analytics-events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        data: {
          event_type: "onboarding_interests_saved",
          device_token: deviceToken,
          page: "/onboarding/follow-teams",
          entity_type: "onboarding",
          entity_id: deviceToken,
          meta: {
            sports: Array.isArray(body.sports) ? body.sports : [],
            countries: Array.isArray(body.countries) ? body.countries : [],
            leagues: Array.isArray(body.leagues) ? body.leagues : [],
            events: Array.isArray(body.events) ? body.events : [],
          },
        },
      }),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[onboarding/interests]", err)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
