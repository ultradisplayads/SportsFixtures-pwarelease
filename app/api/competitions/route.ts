import { NextResponse, type NextRequest } from "next/server"
import { getDirectoryCompetitions } from "@/lib/sf-directory"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const competitions = await getDirectoryCompetitions({
      sportId: searchParams.get("sportId"),
      countryId: searchParams.get("countryId"),
      countryName: searchParams.get("country"),
    })
    return NextResponse.json({ competitions })
  } catch (error) {
    console.error("[api/competitions]", error)
    return NextResponse.json({ competitions: [], error: "Failed to load competitions" }, { status: 502 })
  }
}
