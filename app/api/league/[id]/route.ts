import { NextRequest, NextResponse } from "next/server"
import { getSFLeagueById } from "@/lib/sf-api"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const league = await getSFLeagueById(id)
    if (!league) {
      return NextResponse.json({ error: "League not found" }, { status: 404 })
    }
    return NextResponse.json(league, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    })
  } catch (err) {
    console.error("[api/league]", err)
    return NextResponse.json({ error: "Failed to load league" }, { status: 500 })
  }
}
