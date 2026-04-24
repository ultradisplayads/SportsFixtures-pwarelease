import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// POST /api/auth/migrate-device
// Called automatically after login to link device_token favourites + push sub to user account.
// This means a user who followed teams before registering keeps all their data.

export async function POST(req: NextRequest) {
  const { device_token, user_id, jwt } = await req.json().catch(() => ({}))
  if (!device_token || !user_id) {
    return NextResponse.json({ error: "device_token and user_id required" }, { status: 400 })
  }

  try {
    // Link push subscription: set user_id on all device_token rows
    await sql`
      UPDATE push_subscriptions
      SET user_id = ${user_id}, updated_at = NOW()
      WHERE device_token = ${device_token}
        AND (user_id IS NULL OR user_id = '')
    `

    // Future: when dev adds user_id column to favourites table:
    // await sql`
    //   UPDATE favourites SET user_id = ${user_id}
    //   WHERE device_token = ${device_token} AND user_id IS NULL
    // `

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[migrate-device]", err)
    return NextResponse.json({ error: "Migration failed" }, { status: 500 })
  }
}
