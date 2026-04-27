import { NextResponse } from "next/server"
import { buildNotificationUrl } from "@/lib/alerts"

const WINDOW_MIN = 30
const WINDOW_MAX = 35

const SF_API_URL = (process.env.SF_API_URL || "http://localhost:1337").replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""
const strapiHeaders = {
  "Content-Type": "application/json",
  ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get active push subscriptions with their followed teams from Strapi
    const subsRes = await fetch(`${SF_API_URL}/api/push-subscriptions/with-teams`, {
      headers: strapiHeaders,
      cache: "no-store",
    })

    if (!subsRes.ok) {
      return NextResponse.json({ sent: 0, message: "Failed to fetch subscriptions" })
    }

    const subsData = await subsRes.json()
    const subs = subsData.data || []

    if (!subs.length) {
      return NextResponse.json({ sent: 0, message: "No active subscriptions" })
    }

    // Get upcoming events in the 30–35 min window from TheSportsDB
    const now = new Date()
    const windowStart = new Date(now.getTime() + WINDOW_MIN * 60 * 1000)
    const windowEnd = new Date(now.getTime() + WINDOW_MAX * 60 * 1000)
    const dateStr = now.toISOString().split("T")[0]

    const apiKey = process.env.SPORTSDB_API_KEY || "3"
    const tsdbRes = await fetch(
      `https://www.thesportsdb.com/api/v1/json/${apiKey}/eventsday.php?d=${dateStr}&s=Soccer`,
      { next: { revalidate: 0 } }
    )
    const tsdbData = await tsdbRes.json()
    const events: Record<string, string>[] = tsdbData?.events || []

    const upcoming = events.filter((e) => {
      if (!e.strTime || !e.dateEvent) return false
      const eventTime = new Date(`${e.dateEvent}T${e.strTime}Z`)
      return eventTime >= windowStart && eventTime <= windowEnd
    })

    if (!upcoming.length) {
      return NextResponse.json({ sent: 0, message: "No matches in window" })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sportsfixtures.net"
    let sent = 0

    for (const sub of subs) {
      const match = upcoming.find(
        (e) =>
          e.idHomeTeam === sub.team_id ||
          e.idAwayTeam === sub.team_id ||
          e.strHomeTeam?.toLowerCase() === sub.team_name?.toLowerCase() ||
          e.strAwayTeam?.toLowerCase() === sub.team_name?.toLowerCase()
      )
      if (!match) continue

      const deepLink = buildNotificationUrl({
        category: "match_reminder",
        eventId: match.idEvent,
      })

      const payload = {
        title: `${match.strHomeTeam} vs ${match.strAwayTeam}`,
        body: `Kicks off in ~30 minutes`,
        url: `${baseUrl}${deepLink}`,
        tag: `match-${match.idEvent}`,
      }

      try {
        await fetch(`${baseUrl}/api/push/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.PUSH_SECRET ? { Authorization: `Bearer ${process.env.PUSH_SECRET}` } : {}),
          },
          body: JSON.stringify({
            target: "single",
            subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          }),
        })
        sent++
      } catch {
        // individual send failure — continue
      }
    }

    return NextResponse.json({ sent, matches: upcoming.length })
  } catch (err) {
    console.error("[cron/match-alerts]", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
