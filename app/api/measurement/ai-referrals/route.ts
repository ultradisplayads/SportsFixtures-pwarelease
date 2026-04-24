import { NextResponse } from "next/server"
import { getAiReferralPerformance } from "@/lib/measurement/aggregates"

const NO_STORE = { "Cache-Control": "no-store, max-age=0" }

export async function GET() {
  try {
    const data = await getAiReferralPerformance()
    return NextResponse.json(data, { headers: NO_STORE })
  } catch (error) {
    console.error("Measurement AI referrals route failed", error)
    return NextResponse.json(
      { error: "Failed to load AI referral performance" },
      { status: 500, headers: NO_STORE },
    )
  }
}
