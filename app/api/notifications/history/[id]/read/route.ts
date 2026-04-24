import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const deviceToken =
    req.headers.get("x-device-token") ||
    req.nextUrl.searchParams.get("deviceToken") ||
    null

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  try {
    await sql`
      UPDATE notification_history
      SET read = TRUE
      WHERE id = ${id}
        ${deviceToken ? sql`AND device_token = ${deviceToken}` : sql``}
    `
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[notifications/history/read]", err)
    return NextResponse.json({ success: true }) // fail silently — read state is cosmetic
  }
}
