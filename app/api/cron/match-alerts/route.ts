import { NextResponse } from "next/server"
import { buildNotificationUrl } from "@/lib/alerts"
import { DEFAULT_REMINDER_OFFSETS } from "@/lib/push-repertoire"
import { cachedProviderJson } from "@/lib/provider-cache"

const REMINDER_WINDOWS: Record<string, { minutes: number; label: string }> = {
  "24h": { minutes: 24 * 60, label: "in 1 day" },
  "12h": { minutes: 12 * 60, label: "in 12 hours" },
  "8h":  { minutes: 8 * 60, label: "in 8 hours" },
  "3h":  { minutes: 3 * 60, label: "in 3 hours" },
  "1h":  { minutes: 60, label: "in 1 hour" },
  "30m": { minutes: 30, label: "in 30 minutes" },
  "15m": { minutes: 15, label: "in 15 minutes" },
  "5m":  { minutes: 5, label: "in 5 minutes" },
}

const WINDOW_WIDTH_MINUTES = 5
const SF_API_URL = (process.env.SF_API_URL || "http://localhost:1337").replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""
const strapiHeaders = {
  "Content-Type": "application/json",
  ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
}

function eventDate(event: Record<string, string>): Date | null {
  if (!event.strTime || !event.dateEvent) return null
  const isoTime = event.strTime.endsWith("Z") ? event.strTime : `${event.strTime}Z`
  const date = new Date(`${event.dateEvent}T${isoTime}`)
  return Number.isFinite(date.getTime()) ? date : null
}

function dateKey(date: Date): string {
  return date.toISOString().split("T")[0]
}

function eventMatchesOffset(event: Record<string, string>, offsetMinutes: number, now: Date): boolean {
  const start = eventDate(event)
  if (!start) return false
  const windowStart = new Date(now.getTime() + offsetMinutes * 60 * 1000)
  const windowEnd = new Date(windowStart.getTime() + WINDOW_WIDTH_MINUTES * 60 * 1000)
  return start >= windowStart && start < windowEnd
}

function targetTeams(event: Record<string, string>): string[] {
  return [event.idHomeTeam, event.idAwayTeam].filter(Boolean)
}

async function fetchEventsForDates(dates: string[]) {
  const apiKey = process.env.SPORTSDB_API_KEY || "3"
  const batches = await Promise.all(
    dates.map(async (date) => {
      const endpoint = `eventsday.php?d=${date}&s=Soccer`
      const data = await cachedProviderJson({
        provider: "sportsdb-v1",
        endpoint: `GET:${endpoint}`,
        ttlSeconds: 120,
        cacheNull: true,
        fetcher: async () => {
          const res = await fetch(
            `https://www.thesportsdb.com/api/v1/json/${apiKey}/${endpoint}`,
            { cache: "no-store" },
          )
          return res.json().catch(() => ({}))
        },
      })
      return Array.isArray(data?.events) ? data.events : []
    }),
  )
  return batches.flat()
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const subsRes = await fetch(`${SF_API_URL}/api/push-subscriptions/with-teams`, {
      headers: strapiHeaders,
      cache: "no-store",
    })
    const subsData = subsRes.ok ? await subsRes.json() : { data: [] }
    const subs = Array.isArray(subsData?.data) ? subsData.data : []
    if (!subs.length) return NextResponse.json({ sent: 0, message: "No active subscriptions" })

    const now = new Date()
    const dates = Array.from(new Set([
      dateKey(now),
      dateKey(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
      dateKey(new Date(now.getTime() + 48 * 60 * 60 * 1000)),
    ]))
    const events = await fetchEventsForDates(dates)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sportsfixtures.net"
    const pushHeaders = {
      "Content-Type": "application/json",
      ...(process.env.PUSH_SECRET ? { Authorization: `Bearer ${process.env.PUSH_SECRET}` } : {}),
    }

    const activeOffsets = Array.from(
      new Set(
        subs.flatMap((sub: any) =>
          Array.isArray(sub.reminder_offsets) && sub.reminder_offsets.length > 0
            ? sub.reminder_offsets
            : DEFAULT_REMINDER_OFFSETS,
        ),
      ),
    ).filter((offset): offset is keyof typeof REMINDER_WINDOWS =>
      typeof offset === "string" && offset in REMINDER_WINDOWS,
    )

    let sent = 0
    const matches: Array<{ eventId: string; offset: string; teamIds: string[] }> = []

    for (const offset of activeOffsets) {
      const window = REMINDER_WINDOWS[offset]
      const upcoming = events.filter((event) => eventMatchesOffset(event, window.minutes, now))

      for (const match of upcoming) {
        const teamIds = targetTeams(match)
        if (teamIds.length === 0) continue

        const deepLink = buildNotificationUrl({
          category: "match_reminder",
          eventId: match.idEvent,
        })

        const res = await fetch(`${baseUrl}/api/push/send`, {
          method: "POST",
          headers: pushHeaders,
          body: JSON.stringify({
            targetType: "team",
            teamIds,
            category: "match_reminder",
            campaignId: `match-${match.idEvent}-${offset}`,
            tag: `match-${match.idEvent}-${offset}`,
            title: `${match.strHomeTeam} vs ${match.strAwayTeam}`,
            message: `Kicks off ${window.label}`,
            url: deepLink,
            primaryUrl: deepLink,
            secondaryUrl: "/venues",
            actions: [
              { action: "primary", title: "Match centre" },
              { action: "secondary", title: "Find a bar" },
            ],
          }),
        })
        const result = await res.json().catch(() => ({}))
        sent += Number(result.delivered ?? 0)
        matches.push({ eventId: match.idEvent, offset, teamIds })
      }
    }

    return NextResponse.json({ sent, matches: matches.length, windows: activeOffsets })
  } catch (err) {
    console.error("[cron/match-alerts]", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
