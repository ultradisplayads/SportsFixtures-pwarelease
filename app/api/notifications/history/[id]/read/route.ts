import { NextRequest, NextResponse } from "next/server"

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net").replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""
const strapiHeaders = {
  "Content-Type": "application/json",
  ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const deviceToken = req.headers.get("x-device-token") || req.nextUrl.searchParams.get("deviceToken") || null
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })
  try {
    await fetch(`${SF_API_URL}/api/notification-histories/${id}/read`, {
      method: "POST",
      headers: { ...strapiHeaders, ...(deviceToken ? { "x-device-token": deviceToken } : {}) },
      cache: "no-store",
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[notifications/history/read]", err)
    return NextResponse.json({ success: true }) // fail silently
  }
}
