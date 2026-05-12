import { NextResponse, type NextRequest } from "next/server"
import { getDirectoryLeagues } from "@/lib/sf-directory"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const leagues = await getDirectoryLeagues({
      sportId: searchParams.get("sportId"),
      countryId: searchParams.get("countryId"),
      countryName: searchParams.get("country"),
    })
    return NextResponse.json({ leagues })
  } catch (error) {
    console.error("[api/leagues]", error)
    return NextResponse.json({ leagues: [], error: "Failed to load leagues" }, { status: 502 })
  }
}
