import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { buildNotificationUrl } from "@/lib/alerts"

const WINDOW_MIN = 30
const WINDOW_MAX = 35

export async function GET(request: Request) {
  // Verify Vercel cron secret
  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Get all active push subscriptions with their followed teams
    const subs = await sql`
      SELECT ps.endpoint, ps.p256dh, ps.auth, ps.device_token,
             f.entity_id AS team_id, f.entity_name AS team_name
      FROM push_subscriptions ps
      JOIN favourites f ON f.device_token = ps.device_token
      WHERE ps.is_active = true
        AND f.entity_type = 'team'
        AND ps.pref_match_start = true
    `

    if (!subs.length) {
      return NextResponse.json({ sent: 0, message: "No active subscriptions" })
    }

    // Get upcoming events in the 30–35 min window from TheSportsDB
    const now = new Date()
    const windowStart = new Date(now.getTime() + WINDOW_MIN * 60 * 1000)
    const windowEnd   = new Date(now.getTime() + WINDOW_MAX * 60 * 1000)
    const dateStr = now.toISOString().split("T")[0]

    const apiKey = process.env.SPORTSDB_API_KEY || "3"
    const tsdbRes = await fetch(
      `https://www.thesportsdb.com/api/v1/json/${apiKey}/eventsday.php?d=${dateStr}&s=Soccer`,
      { next: { revalidate: 0 } }
    )
    const tsdbData = await tsdbRes.json()
    const events: Record<string, string>[] = tsdbData?.events || []

    // Filter to events starting in our window
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

      // Use canonical URL builder — no send path should invent its own deep link
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
        // individual send failure — continue to next sub
      }
    }

    return NextResponse.json({ sent, matches: upcoming.length })
  } catch (err) {
    console.error("[cron/match-alerts]", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
