import { NextRequest, NextResponse } from "next/server"

const API_KEY = process.env.SPORTSDB_API_KEY || "3"
const API_URL = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventshighlights.php`

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const sport = searchParams.get("sport")?.toLowerCase() || ""
  const limit = Number(searchParams.get("limit") || "12")

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(API_URL, {
      cache: "no-store",
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) throw new Error(`Highlights request failed: ${response.status}`)

    const payload = await response.json()
    const events = Array.isArray(payload?.tvhighlights) ? payload.tvhighlights : []

    const items = events
      .filter((e: any) => !sport || e?.strSport?.toLowerCase() === sport)
      .slice(0, limit)
      .map((e: any) => ({
        id: e.idEvent,
        title: e.strEvent,
        thumbnailUrl: e.strThumb || e.strPoster || null,
        competition: e.strLeague || e.strSport || "",
        duration: "",
        date: e.dateEvent,
        views: 0,
        videoUrl: e.strVideo || "",
        sport: e.strSport || "",
      }))

    return NextResponse.json(items)
  } catch (error) {
    console.error("Error fetching highlights:", error)
    return NextResponse.json([], { status: 200 })
  }
}
