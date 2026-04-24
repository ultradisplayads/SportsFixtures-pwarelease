import { NextRequest, NextResponse } from "next/server"

const SF_API_URL = (
  process.env.SF_API_URL || "https://staging-api.sportsfixtures.net"
).replace(/\/api-docs\/?$/, "").replace(/\/$/, "")

const getSFToken = () => process.env.SF_API_TOKEN || ""

function formatDate(date: Date) {
  return date.toISOString().split("T")[0]
}

function getDateRange(mode: string) {
  const now = new Date()
  const today = new Date(now)
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  const day = now.getDay()
  const saturday = new Date(now)
  saturday.setDate(now.getDate() + ((6 - day + 7) % 7))
  const sunday = new Date(now)
  sunday.setDate(now.getDate() + ((7 - day + 7) % 7))

  switch (mode) {
    case "tomorrow":
      return { startDate: formatDate(tomorrow), endDate: formatDate(tomorrow) }
    case "weekend":
      return { startDate: formatDate(saturday), endDate: formatDate(sunday) }
    default:
      return { startDate: formatDate(today), endDate: formatDate(today) }
  }
}

function normaliseEvents(rows: any[]) {
  const grouped = new Map<string, any>()

  for (const row of rows) {
    const key = row.idEvent || row.idBroadcast || `${row.strEvent}-${row.dateEvent}`
    if (!grouped.has(key)) {
      grouped.set(key, {
        id: row.idEvent || row.idBroadcast,
        event: row.strEvent,
        time: row.strTime?.slice(0, 5) || "",
        date: row.dateEvent,
        sport: row.strSport,
        league: row.strLeague || row.strSport || "",
        season: row.strSeason || "",
        competition: row.strLeague || row.strSport || "",
        channels: [],
        streamingServices: [],
        homeTeam: row.strHomeTeam || "",
        awayTeam: row.strAwayTeam || "",
        thumbnail:
          row.strEventThumb || row.strEventPoster || row.strEventBanner || null,
      })
    }
    const current = grouped.get(key)
    if (row.strChannel && !current.channels.includes(row.strChannel)) {
      current.channels.push(row.strChannel)
    }
  }

  return Array.from(grouped.values())
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const dateMode = searchParams.get("date") || "today"
  const sport = searchParams.get("sport") || ""
  const { startDate, endDate } = getDateRange(dateMode)

  try {
    const url = new URL(`${SF_API_URL}/api/tv-events/by-range`)
    url.searchParams.set("startDate", startDate)
    url.searchParams.set("endDate", endDate)
    url.searchParams.set("pagination[page]", "1")
    url.searchParams.set(
      "pagination[pageSize]",
      dateMode === "weekend" ? "100" : "50"
    )
    if (sport) url.searchParams.set("sport", sport)

    const token = getSFToken()
    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (!response.ok) throw new Error(`TV request failed: ${response.status}`)

    const payload = await response.json()
    const rows = Array.isArray(payload?.data) ? payload.data : []

    return NextResponse.json({
      data: normaliseEvents(rows),
      usedFallbackData: false,
      range: { startDate, endDate },
    })
  } catch (error) {
    console.error("Error fetching TV schedule:", error)
    return NextResponse.json(
      { data: [], usedFallbackData: true, range: { startDate, endDate } },
      { status: 200 }
    )
  }
}
