import { NextRequest, NextResponse } from "next/server"

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net").replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""
const strapiHeaders = {
  "Content-Type": "application/json",
  ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
}

function getDeviceToken(req: NextRequest): string | null {
  return req.headers.get("x-device-token") || req.nextUrl.searchParams.get("deviceToken") || null
}

export async function GET(req: NextRequest) {
  const deviceToken = getDeviceToken(req)
  const timezone = req.nextUrl.searchParams.get("timezone") || "UTC"
  const url = `${SF_API_URL}/api/push-preferences?${deviceToken ? `deviceToken=${deviceToken}&` : ""}timezone=${timezone}`
  try {
    const res = await fetch(url, { headers: strapiHeaders, cache: "no-store" })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("[notifications/preferences GET]", err)
    return NextResponse.json(buildDefaultPrefs(timezone))
  }
}

export async function PATCH(req: NextRequest) {
  const deviceToken = getDeviceToken(req)
  const patch = await req.json()
  try {
    const res = await fetch(
      `${SF_API_URL}/api/push-preferences${deviceToken ? `?deviceToken=${deviceToken}` : ""}`,
      { method: "PATCH", headers: { ...strapiHeaders, ...(deviceToken ? { "x-device-token": deviceToken } : {}) }, body: JSON.stringify(patch), cache: "no-store" }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("[notifications/preferences PATCH]", err)
    return NextResponse.json({ ...buildDefaultPrefs(), ...patch })
  }
}

function buildDefaultPrefs(timezone = "UTC") {
  return {
    pushEnabled: false, inAppEnabled: true, globalMute: false,
    quietHoursEnabled: false, quietHoursStart: "22:00", quietHoursEnd: "08:00",
    timezone, defaultReminderOffsets: ["1h", "15m"],
    enabledCategories: [], disabledCategories: [],
    tierEnabled: { tier1: true, tier2: true, tier3: false },
    allowBreakingNews: false, allowVenueOffers: false, allowTransferNews: false,
  }
}
