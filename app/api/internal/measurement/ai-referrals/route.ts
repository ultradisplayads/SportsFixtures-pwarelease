import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/server/admin-auth"

export async function GET(req: NextRequest) {
  const session = await requireAdminSession(req)
  if (!session.ok) return session.response

  // Replace with GA4 / warehouse query for AI referral sessions
  // e.g. source buckets: chatgpt, bing_ai, gemini
  return NextResponse.json([])
}
