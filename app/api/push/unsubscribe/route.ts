import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(req: NextRequest) {
  try {
    const { endpoint } = await req.json()
    if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })
    await sql`UPDATE push_subscriptions SET is_active = FALSE, updated_at = NOW() WHERE endpoint = ${endpoint}`
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[push/unsubscribe]", err)
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 })
  }
}
