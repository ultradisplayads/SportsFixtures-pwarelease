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
  if (!deviceToken) return NextResponse.json({ items: [] })
  try {
    const res = await fetch(`${SF_API_URL}/api/notification-histories?deviceToken=${deviceToken}`, {
      headers: { ...strapiHeaders, "x-device-token": deviceToken }, cache: "no-store",
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("[notifications/history GET]", err)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  const deviceToken = getDeviceToken(req)
  const body = await req.json()
  if (!deviceToken) return NextResponse.json({ error: "deviceToken required" }, { status: 400 })
  try {
    const res = await fetch(`${SF_API_URL}/api/notification-histories`, {
      method: "POST",
      headers: { ...strapiHeaders, "x-device-token": deviceToken },
      body: JSON.stringify(body),
      cache: "no-store",
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("[notifications/history POST]", err)
    return NextResponse.json({ error: "Failed to record notification" }, { status: 500 })
  }
}