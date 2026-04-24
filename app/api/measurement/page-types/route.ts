import { NextResponse } from "next/server"
import { getPageTypePerformance } from "@/lib/measurement/aggregates"

const NO_STORE = { "Cache-Control": "no-store, max-age=0" }

export async function GET() {
  try {
    const data = await getPageTypePerformance()
    return NextResponse.json(data, { headers: NO_STORE })
  } catch (error) {
    console.error("Measurement page-types route failed", error)
    return NextResponse.json(
      { error: "Failed to load page-type performance" },
      { status: 500, headers: NO_STORE },
    )
  }
}
