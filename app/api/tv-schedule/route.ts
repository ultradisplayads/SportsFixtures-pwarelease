import { NextResponse } from "next/server"

const SF_API_URL = (process.env.SF_API_URL || process.env.NEXT_PUBLIC_SF_API_URL || "")
  .replace(/\/api-docs\/?$/, "")
  .replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const url = `${SF_API_URL}/api/events?filters[dateEvent][$eq]=${date}&filters[strChannel][$notNull]=true&sort=strTime:asc&pagination[pageSize]=50`
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
      },
    })
    clearTimeout(timeout)

    const text = await res.text()
    if (!res.ok) return NextResponse.json({ data: [] }, { status: 200 })

    try {
      const json = JSON.parse(text)
      const events = json?.data ?? []
      // Shape each event to include channel info
      const shaped = events.map((e: any) => ({
        id: e.id ?? e.idEvent,
        strHomeTeam: e.strHomeTeam,
        strAwayTeam: e.strAwayTeam,
        strLeague: e.strLeague,
        dateEvent: e.dateEvent,
        strTime: e.strTime,
        strChannel: e.strChannel,
        channels: e.strChannel ? [e.strChannel] : [],
        strSport: e.strSport ?? "Football",
        isLive: e.strStatus === "Live" || e.intProgress > 0,
      }))
      return NextResponse.json({ data: shaped })
    } catch {
      return NextResponse.json({ data: [] }, { status: 200 })
    }
  } catch {
    clearTimeout(timeout)
    return NextResponse.json({ data: [] }, { status: 200 })
  }
}
