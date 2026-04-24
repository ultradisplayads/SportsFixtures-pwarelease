import { NextResponse } from "next/server"
import { getStalePages } from "@/lib/measurement/aggregates"

const NO_STORE = { "Cache-Control": "no-store, max-age=0" }

export async function GET() {
  try {
    const data = await getStalePages()
    return NextResponse.json(data, { headers: NO_STORE })
  } catch (error) {
    console.error("Measurement stale-pages route failed", error)
    return NextResponse.json(
      { error: "Failed to load stale pages" },
      { status: 500, headers: NO_STORE },
    )
  }
}
