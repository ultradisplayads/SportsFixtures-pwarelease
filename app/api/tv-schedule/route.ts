import { NextResponse } from "next/server"
import { cachedProviderJson } from "@/lib/provider-cache"

const SF_API_URL = (process.env.SF_API_URL || process.env.NEXT_PUBLIC_SF_API_URL || "")
  .replace(/\/api-docs\/?$/, "")
  .replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""

function shapeEvents(events: any[]) {
  return events.map((e: any) => ({
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
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0]
  const endpoint = `/api/events?filters[dateEvent][$eq]=${date}&filters[strChannel][$notNull]=true&sort=strTime:asc&pagination[pageSize]=50`

  try {
    const json = await cachedProviderJson({
      provider: "strapi",
      endpoint: `GET:${endpoint}`,
      ttlSeconds: 60,
      staleWhileRevalidateSeconds: 3600,
      cacheNull: true,
      fetcher: async () => {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)
        try {
          const res = await fetch(`${SF_API_URL}${endpoint}`, {
            cache: "no-store",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
            },
          })
          if (!res.ok) return { data: [] }
          return res.json()
        } finally {
          clearTimeout(timeout)
        }
      },
    })

    return NextResponse.json(
      { data: shapeEvents(Array.isArray(json?.data) ? json.data : []) },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=3600" } },
    )
  } catch {
    return NextResponse.json({ data: [] }, { status: 200 })
  }
}
