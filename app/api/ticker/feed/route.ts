// GET /api/ticker/feed
// Normalized ticker feed — merges live scores, breaking news, TV now.
// The UI must only consume this route, not call raw provider endpoints directly.

import { NextRequest, NextResponse } from "next/server"
import type { TickerItem, TickerFeedResponse } from "@/types/ticker"
import { DEFAULT_TICKER_CONFIG } from "@/types/ticker"
import { buildChannels } from "@/lib/ticker-engine"
import {
  fetchControlPlaneSnapshot,
  tickerControlDtoToConfig,
} from "@/lib/control-plane"
import { tournamentDtoToState } from "@/lib/tournament-mode"
import { resolveTournamentSurfaceDecision, getTournamentTickerPriorityBoost } from "@/lib/tournament-surface"
import { buildLiveScoreItems, buildResultItems, type RawLiveEvent } from "@/lib/ticker-live"
import { buildBreakingNewsItems, buildTvNowItems, type RawNewsArticle, type RawTvListing } from "@/lib/ticker-news"

const SPORTSDB_API_KEY = process.env.SPORTSDB_API_KEY || "3"
const API_BASE_V2 = "https://www.thesportsdb.com/api/v2/json"

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net")
  .replace(/\/api-docs\/?$/, "")
  .replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""

// ---- Fetch helpers --------------------------------------------------------

// Fetch live events from the SF (Strapi) backend — same source used by LiveMatchesList on the home screen
async function fetchSFLiveScores(): Promise<TickerItem[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)

    const res = await fetch(
      `${SF_API_URL}/api/events?filters[strStatus][$eq]=live&pagination[pageSize]=50`,
      {
        cache: "no-store",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
        },
      },
    )
    clearTimeout(timeout)

    if (!res.ok) return []

    const json = await res.json()
    const rows: any[] = Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.events)
      ? json.events
      : Array.isArray(json)
      ? json
      : []

    // Normalise SF shape to RawLiveEvent before passing to ticker-live builders.
    const normalised: RawLiveEvent[] = rows.map((s: any) => ({
      idEvent: String(s.id ?? s.idEvent ?? ""),
      strHomeTeam:
        typeof s.homeTeam === "string"
          ? s.homeTeam
          : s.homeTeam?.strTeam ?? s.homeTeam?.name ?? s.strHomeTeam ?? "",
      strAwayTeam:
        typeof s.awayTeam === "string"
          ? s.awayTeam
          : s.awayTeam?.strTeam ?? s.awayTeam?.name ?? s.strAwayTeam ?? "",
      intHomeScore: s.intHomeScore,
      intAwayScore: s.intAwayScore,
      strProgress: s.strProgress || "LIVE",
      strLeague: s.strLeague ?? s.league?.strLeague ?? s.league?.name ?? undefined,
      idLeague: s.idLeague ?? s.league?.id ?? undefined,
      strSport: s.strSport ?? s.sport?.strSport ?? "soccer",
    }))

    const isResultRow = (raw: RawLiveEvent) =>
      ["FT", "AET", "PEN"].includes((raw.strProgress ?? "").toUpperCase().trim())

    const liveRows = normalised.filter((r) => !isResultRow(r))
    const resultRows = normalised.filter(isResultRow)

    return [
      ...buildLiveScoreItems(liveRows).map((i) => ({ ...i, id: `sf:${i.id}`, source: "sf" as const })),
      ...buildResultItems(resultRows).map((i) => ({ ...i, id: `sf:${i.id}`, source: "sf" as const })),
    ]
  } catch {
    return []
  }
}

async function fetchLiveScores(sport: string): Promise<TickerItem[]> {
  if (SPORTSDB_API_KEY === "3") return []

  try {
    const res = await fetch(`${API_BASE_V2}/livescore/${sport}`, {
      headers: { "X-API-KEY": SPORTSDB_API_KEY },
      cache: "no-store",
    })
    if (!res.ok) return []

    const text = await res.text()
    if (!text || text.trim() === "" || text.trim() === "null") return []

    const data = JSON.parse(text)
    const livescores = data?.livescores ?? []

    const RESULT_STATUSES = new Set(["FT", "AET", "PEN"])
    const DEAD_STATUSES = new Set(["CANC", "PST", "ABD", "NS"])

    const normalised: RawLiveEvent[] = livescores
      .filter((s: any) => !DEAD_STATUSES.has((s.strProgress || "").toUpperCase().trim()))
      .map((s: any): RawLiveEvent => ({
        idEvent: String(s.idEvent || s.idLiveScore || ""),
        strHomeTeam: s.strHomeTeam,
        strAwayTeam: s.strAwayTeam,
        intHomeScore: s.intHomeScore,
        intAwayScore: s.intAwayScore,
        strProgress: s.strProgress || "LIVE",
        strLeague: s.strLeague,
        idLeague: s.idLeague,
        strSport: s.strSport ?? sport,
      }))

    const liveRows = normalised.filter((r) => !RESULT_STATUSES.has((r.strProgress ?? "").toUpperCase().trim()))
    const resultRows = normalised.filter((r) => RESULT_STATUSES.has((r.strProgress ?? "").toUpperCase().trim()))

    return [
      ...buildLiveScoreItems(liveRows).map((i) => ({ ...i, id: `tsdb:${i.id}` })),
      ...buildResultItems(resultRows).map((i) => ({ ...i, id: `tsdb:${i.id}` })),
    ]
  } catch {
    return []
  }
}

async function fetchBreakingNews(): Promise<TickerItem[]> {
  if (!SF_API_URL) return []

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const url = `${SF_API_URL}/api/news?filters[isBreaking][$eq]=true&sort=publishedAt:desc&pagination[pageSize]=6`
    const res = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
      },
    })
    clearTimeout(timeout)

    if (!res.ok) return []

    const json = await res.json()
    const articles: any[] = json?.data ?? json?.articles ?? []

    const rawArticles: RawNewsArticle[] = articles.map((a: any) => ({
      id: a.id ?? a.documentId ?? undefined,
      title: a.attributes?.title ?? a.title ?? a.strTitle,
      url: a.attributes?.url ?? a.url,
      publishedAt: a.attributes?.publishedAt ?? a.publishedAt,
      source: a.attributes?.source ?? a.source,
    }))

    // Preserve priority escalation for items flagged isBreaking=critical in Strapi
    return buildBreakingNewsItems(rawArticles).map((item, i) => {
      const a = articles[i]
      const isCritical = a?.attributes?.isBreaking || a?.isBreaking
      return isCritical ? { ...item, priority: "critical" as const } : item
    })
  } catch {
    return []
  }
}

async function fetchTvNow(): Promise<TickerItem[]> {
  if (!SF_API_URL) return []

  try {
    const today = new Date().toISOString().split("T")[0]
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const url = new URL(`${SF_API_URL}/api/tv-events/by-range`)
    url.searchParams.set("startDate", today)
    url.searchParams.set("endDate", today)
    url.searchParams.set("pagination[page]", "1")
    url.searchParams.set("pagination[pageSize]", "10")

    const res = await fetch(url.toString(), {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
      },
    })
    clearTimeout(timeout)

    if (!res.ok) return []

    const json = await res.json()
    const rows: any[] = Array.isArray(json?.data) ? json.data : []

    // Only include events on air roughly now (within 2h window)
    const now = new Date()

    const filtered = rows
      .filter((row: any) => {
        if (!row.time || !row.date) return true
        try {
          const eventTime = new Date(`${row.date}T${row.time}:00`)
          const diffMs = now.getTime() - eventTime.getTime()
          // Include events that started up to 2h ago or start within 30min
          return diffMs >= -30 * 60 * 1000 && diffMs <= 2 * 60 * 60 * 1000
        } catch {
          return true
        }
      })
      .slice(0, 5)

    const rawListings: RawTvListing[] = filtered.map((row: any) => ({
      id: row.id ?? `${row.event ?? ""}:${row.channels?.[0] ?? ""}`,
      title: row.channels?.[0] ? `${row.event} on ${row.channels[0]}` : row.event,
      channelName: row.channels?.[0] ?? undefined,
      startsAt: row.date && row.time ? `${row.date}T${row.time}:00` : undefined,
      matchId: row.id ? String(row.id) : undefined,
      sport: row.sport?.toLowerCase() ?? undefined,
      leagueId: row.league ?? undefined,
    }))

    return buildTvNowItems(rawListings)
  } catch {
    return []
  }
}

// ---- Route handler --------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const sportParam = searchParams.get("sport") || "soccer"
  const limitParam = searchParams.get("limit")
  const channelParam = searchParams.get("channel") // "primary" | "secondary" | "all"

  // Load ticker config from the control plane.
  // Falls back to DEFAULT_TICKER_CONFIG via validateTickerControl() if Strapi is unavailable.
  const snapshot = await fetchControlPlaneSnapshot()
  const config = { ...tickerControlDtoToConfig(snapshot.ticker) }

  // Section 14 — Tournament mode ticker boost.
  // Derive tournament state and surface decisions from the same snapshot
  // so we don't make a second control-plane fetch.
  const tournamentState = tournamentDtoToState(snapshot.tournamentMode ?? null)
  const tournamentSurface = resolveTournamentSurfaceDecision(tournamentState)
  const tickerPriorityBoost = getTournamentTickerPriorityBoost(tournamentSurface)
  const featuredCompetitionIds = new Set(
    tournamentState.featuredCompetitionIds ?? [],
  )

  // URL param override for limit — allows per-request scoping without changing operator config
  if (limitParam) {
    const n = parseInt(limitParam, 10)
    if (!isNaN(n)) {
      config.maxPrimaryItems = n
      config.maxSecondaryItems = n
    }
  }

  // Fetch all sources concurrently — SF backend + TheSportsDB v2 + news + TV
  const [sfItems, tsdbItems, newsItems, tvItems] = await Promise.all([
    config.includeLiveScores ? fetchSFLiveScores() : Promise.resolve([]),
    config.includeLiveScores ? fetchLiveScores(sportParam) : Promise.resolve([]),
    config.includeBreakingNews ? fetchBreakingNews() : Promise.resolve([]),
    config.includeTvNow ? fetchTvNow() : Promise.resolve([]),
  ])

  // Merge: SF is authoritative. De-duplicate TSDB items that share the same event id
  // (SF uses numeric Strapi IDs; TSDB uses idEvent which may match strEvent on SF side)
  const sfEventIds = new Set(sfItems.map((i) => i.eventId).filter(Boolean))
  const dedupedTsdb = tsdbItems.filter((i) => !sfEventIds.has(i.eventId))

  let allItems: TickerItem[] = [...sfItems, ...dedupedTsdb, ...newsItems, ...tvItems]

  // Section 14 — Apply tournament ticker boost.
  // Items matching a featured competition ID get their priority raised by
  // tickerPriorityBoost steps. The priority scale is:
  //   "normal" -> "high" -> "critical"
  // Boost of 0 = no change. Boost flows through control-plane only — no UI hacks.
  if (tickerPriorityBoost > 0 && featuredCompetitionIds.size > 0) {
    const PRIORITY_SCALE: TickerItem["priority"][] = ["normal", "high", "critical"]
    allItems = allItems.map((item) => {
      if (!item.competitionId || !featuredCompetitionIds.has(item.competitionId)) return item
      const currentIdx = PRIORITY_SCALE.indexOf(item.priority)
      if (currentIdx === -1) return item
      const boostedIdx = Math.min(currentIdx + tickerPriorityBoost, PRIORITY_SCALE.length - 1)
      return { ...item, priority: PRIORITY_SCALE[boostedIdx] }
    })
  }

  const { primary, secondary } = buildChannels(allItems, config)

  // Handle fallback_real: if primary is empty and mode is fallback_real,
  // promote real scheduled content from secondary to a minimal primary signal
  let finalPrimary = primary
  if (
    finalPrimary.length === 0 &&
    config.emptyMode === "fallback_real" &&
    config.mode !== "off"
  ) {
    // Don't duplicate items — just leave primary empty so the ticker shows empty state
    finalPrimary = []
  }

  // Filter by channel if requested
  let responsePrimary = finalPrimary
  let responseSecondary = secondary
  if (channelParam === "primary") responseSecondary = []
  if (channelParam === "secondary") responsePrimary = []

  const response: TickerFeedResponse = {
    config,
    primary: responsePrimary,
    secondary: responseSecondary,
    generatedAt: new Date().toISOString(),
  }

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": `s-maxage=${config.refreshSeconds ?? 30}, stale-while-revalidate=10`,
    },
  })
}
