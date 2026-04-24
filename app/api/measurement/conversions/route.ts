import { NextResponse } from "next/server"
import { getConversionPerformance } from "@/lib/measurement/aggregates"

const NO_STORE = { "Cache-Control": "no-store, max-age=0" }

export async function GET() {
  try {
    const data = await getConversionPerformance()
    return NextResponse.json(data, { headers: NO_STORE })
  } catch (error) {
    console.error("Measurement conversions route failed", error)
    return NextResponse.json(
      { error: "Failed to load conversion performance" },
      { status: 500, headers: NO_STORE },
    )
  }
}
