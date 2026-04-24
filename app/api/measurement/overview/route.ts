import { NextResponse } from "next/server"
import { getMeasurementOverview } from "@/lib/measurement/aggregates"

const NO_STORE = { "Cache-Control": "no-store, max-age=0" }

export async function GET() {
  try {
    const data = await getMeasurementOverview()
    return NextResponse.json(data, { headers: NO_STORE })
  } catch (error) {
    console.error("Measurement overview route failed", error)
    return NextResponse.json(
      { error: "Failed to load measurement overview" },
      { status: 500, headers: NO_STORE },
    )
  }
}
