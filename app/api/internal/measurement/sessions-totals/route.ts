import { NextResponse } from "next/server"

export async function GET() {
  // Replace this with GA4 / warehouse / analytics service query
  return NextResponse.json({
    sessions: 0,
    organicSessions: 0,
    aiReferralSessions: 0,
  })
}
