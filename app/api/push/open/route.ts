import { NextRequest, NextResponse } from "next/server"

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net").replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""
const strapiHeaders = {
  "Content-Type": "application/json",
  ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const campaignId = body.campaignId || null
    const category = body.category || null
    const action = body.action || "default"
    const url = body.url || null

    if (SF_API_TOKEN && campaignId) {
      await fetch(`${SF_API_URL}/api/push-open-events`, {
        method: "POST",
        headers: strapiHeaders,
        body: JSON.stringify({
          campaignId,
          category,
          action,
          url,
          openedAt: new Date().toISOString(),
          userAgent: req.headers.get("user-agent") || "service-worker",
        }),
        cache: "no-store",
      }).catch(() => {})

      await fetch(`${SF_API_URL}/api/push-campaign-metrics/open`, {
        method: "PATCH",
        headers: strapiHeaders,
        body: JSON.stringify({
          campaignId,
          category,
          action,
          url,
          openedAt: new Date().toISOString(),
        }),
        cache: "no-store",
      }).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[push/open]", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
