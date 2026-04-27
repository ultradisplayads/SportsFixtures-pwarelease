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
    const res = await fetch(`${SF_API_URL}/api/notification-subscriptions?deviceToken=${deviceToken}`, {
      headers: { ...strapiHeaders, "x-device-token": deviceToken }, cache: "no-store",
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("[notifications/subscriptions GET]", err)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  const deviceToken = getDeviceToken(req)
  const body = await req.json()
  if (!body.entityType || !body.entityId) return NextResponse.json({ error: "entityType and entityId are required" }, { status: 400 })
  if (!deviceToken) return NextResponse.json({ items: [body] })
  try {
    const res = await fetch(`${SF_API_URL}/api/notification-subscriptions`, {
      method: "POST",
      headers: { ...strapiHeaders, "x-device-token": deviceToken },
      body: JSON.stringify(body), cache: "no-store",
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("[notifications/subscriptions POST]", err)
    return NextResponse.json({ items: [body] })
  }
}

export async function DELETE(req: NextRequest) {
  const deviceToken = getDeviceToken(req)
  const entityType = req.nextUrl.searchParams.get("entityType")
  const entityId = req.nextUrl.searchParams.get("entityId")
  if (!entityType || !entityId) return NextResponse.json({ error: "entityType and entityId are required" }, { status: 400 })
  if (!deviceToken) return NextResponse.json({ items: [] })
  try {
    const res = await fetch(
      `${SF_API_URL}/api/notification-subscriptions?deviceToken=${deviceToken}&entityType=${entityType}&entityId=${entityId}`,
      { method: "DELETE", headers: { ...strapiHeaders, "x-device-token": deviceToken }, cache: "no-store" }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("[notifications/subscriptions DELETE]", err)
    return NextResponse.json({ items: [] })
  }
}