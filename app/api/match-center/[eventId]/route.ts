// ── /api/match-center/[eventId] ───────────────────────────────────────────────
//
// Unified match-center contract endpoint.
// Returns a MatchCenterResponse with all section envelopes normalised from
// provider data. The frontend must consume THIS shape, never raw provider shapes.
//
// Provider strategy (per Section 03 spec):
//   • Event / lineups / timeline / stats / TV: SF API (internal proxy)
//   • Standings: TSDB v1 via sports-api actions
//   • Highlights: strVideo from TSDB event + /api/highlights fallback
//   • Insights: derived from standings context in lib/match-intelligence

import { NextRequest, NextResponse } from "next/server"
import {
  makeEnvelope,
  makeUnavailable,
  normaliseTimelineFromTSDB,
  normaliseTimelineFromSFAPI,
  normaliseStatsFromTSDB,
  normaliseStatsFromSFAPI,
  normaliseStandingsFromTSDB,
  normaliseHighlightsFromTSDB,
  deriveInsightsFromContext,
} from "@/lib/match-intelligence"
import { getLeagueTable } from "@/app/actions/sports-api"
import {
  buildMatchCenterCoverageHints,
  deriveSportKey,
} from "@/lib/coverage-resolver"
import type {
  MatchLineups,
  MatchLineupsTeam,
  MatchPlayer,
  MatchTvInfo,
  MatchHighlightItem,
} from "@/types/match-intelligence"
import type { MatchCenterEvent, MatchCenterResponse } from "@/types/match-center"

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net")
  .replace(/\/api-docs\/?$/, "")
  .replace(/\/$/, "")
const SF_TOKEN = () => process.env.SF_API_TOKEN || ""

// ── Shared fetch helper ───────────────────────────────────────────────────────

async function sfGet(path: string): Promise<any> {
  try {
    const token = SF_TOKEN()
    const res = await fetch(`${SF_API_URL}${path}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (!res.ok) return null
    const text = await res.text()
    if (!text || text.trim() === "null") return null
    return JSON.parse(text)
  } catch {
    return null
  }
}

// ── Lineup normaliser ─────────────────────────────────────────────────────────

function toPlayer(raw: any): MatchPlayer {
  return {
    name: raw?.player || raw?.strPlayer || raw?.name || "Unknown",
    position: raw?.position || raw?.strPosition || raw?.positionShort || "",
    image: raw?.strCutout || raw?.strRender || raw?.strThumb || undefined,
    country: raw?.strNationality || undefined,
  }
}

function splitByRole(players: any[] = []): Omit<MatchLineupsTeam, "name" | "badge" | "formation" | "substitutes"> {
  const out = { goalkeeper: null as MatchPlayer | null, defenders: [] as MatchPlayer[], midfielders: [] as MatchPlayer[], forwards: [] as MatchPlayer[] }
  for (const raw of players) {
    const p = toPlayer(raw)
    const pos = String(raw?.positionShort || raw?.strPosition || "").toUpperCase()
    if (!out.goalkeeper && (pos === "G" || pos === "GK" || pos.includes("KEEP"))) out.goalkeeper = p
    else if (pos === "D" || pos === "DF" || pos.includes("BACK") || pos.includes("DEF")) out.defenders.push(p)
    else if (pos === "M" || pos === "MF" || pos.includes("MID")) out.midfielders.push(p)
    else if (pos === "F" || pos === "FW" || pos.includes("ATT") || pos.includes("STR") || pos.includes("FOR")) out.forwards.push(p)
    else if (!out.goalkeeper) out.goalkeeper = p
    else out.midfielders.push(p)
  }
  return out
}

function buildTeamLineup(teamData: any, name: string, badge: string): MatchLineupsTeam {
  const starting = Array.isArray(teamData?.starting) ? teamData.starting : []
  const subs = Array.isArray(teamData?.substitutes) ? teamData.substitutes : []
  const roles = splitByRole(starting)
  return {
    name,
    badge,
    formation: teamData?.formation || "TBC",
    goalkeeper: roles.goalkeeper || { name: "TBC", position: "GK" },
    defenders: roles.defenders,
    midfielders: roles.midfielders,
    forwards: roles.forwards,
    substitutes: subs.map(toPlayer),
  }
}

// ── TV normaliser ─────────────────────────────────────────────────────────────

function normaliseTvChannels(raw: any): MatchTvInfo | null {
  const channels: MatchTvInfo["channels"] = []

  // SF API event may include channels array
  if (Array.isArray(raw?.channels)) {
    for (const ch of raw.channels) {
      channels.push({
        id: ch.id ? String(ch.id) : undefined,
        name: ch.name || ch.strChannel || ch.channel || "",
        country: ch.country || ch.strCountry || undefined,
        logo: ch.logo || ch.strLogo || undefined,
      })
    }
  }
  // Flat strChannel field
  if (raw?.strChannel && !channels.find((c) => c.name === raw.strChannel)) {
    channels.push({ name: raw.strChannel })
  }

  if (channels.length === 0) return null
  return { channels, source: "thesportsdb" }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params

  if (!eventId || !/^\d+$/.test(eventId)) {
    return NextResponse.json({ error: "Valid numeric eventId required" }, { status: 400 })
  }

  const fetchedAt = new Date().toISOString()

  // ── 1. Fetch event, lineup, and timeline in parallel ──────────────────────

  const [eventPayload, lineupPayload, highlightsPayload] = await Promise.all([
    sfGet(`/api/events/${eventId}`),
    sfGet(`/api/event-lineup/${eventId}?format=byTeam`),
    sfGet(`/api/highlights?limit=6`),
  ])

  const sfEvent: any = eventPayload?.data || eventPayload || null
  const lineupData: any = lineupPayload?.success ? lineupPayload.data : null

  // ── 2. Build event envelope ───────────────────────────────────────────────

  let eventEnvelope = makeUnavailable<MatchCenterEvent>("Event details", "thesportsdb")

  if (sfEvent && (sfEvent.strHomeTeam || sfEvent.homeTeam)) {
    const ev: MatchCenterEvent = {
      idEvent: String(sfEvent.idEvent || eventId),
      strEvent: sfEvent.strEvent || `${sfEvent.strHomeTeam} vs ${sfEvent.strAwayTeam}`,
      strSport: sfEvent.strSport || "Soccer",
      strLeague: sfEvent.league?.name || sfEvent.strLeague || "",
      idLeague: String(sfEvent.league?.id || sfEvent.idLeague || ""),
      strSeason: sfEvent.strSeason || undefined,
      strHomeTeam: sfEvent.homeTeam?.name || sfEvent.strHomeTeam || "",
      strAwayTeam: sfEvent.awayTeam?.name || sfEvent.strAwayTeam || "",
      strHomeTeamBadge: sfEvent.homeTeam?.badge || sfEvent.strHomeTeamBadge || undefined,
      strAwayTeamBadge: sfEvent.awayTeam?.badge || sfEvent.strAwayTeamBadge || undefined,
      idHomeTeam: String(sfEvent.homeTeam?.id || sfEvent.idHomeTeam || ""),
      idAwayTeam: String(sfEvent.awayTeam?.id || sfEvent.idAwayTeam || ""),
      intHomeScore: sfEvent.intHomeScore != null ? Number(sfEvent.intHomeScore) : null,
      intAwayScore: sfEvent.intAwayScore != null ? Number(sfEvent.intAwayScore) : null,
      strStatus: sfEvent.strStatus || undefined,
      strProgress: sfEvent.strProgress || undefined,
      strVenue: sfEvent.strVenue || undefined,
      dateEvent: sfEvent.dateEvent || undefined,
      strTime: sfEvent.strTime || undefined,
      strVideo: sfEvent.strVideo || undefined,
    }
    const isLiveStatus = ["1h", "2h", "ht", "live", "et", "pen"].some((s) =>
      (ev.strProgress || ev.strStatus || "").toLowerCase().includes(s)
    )
    eventEnvelope = makeEnvelope(ev, "thesportsdb", {
      fetchedAt,
      isLive: isLiveStatus,
      maxAgeSeconds: isLiveStatus ? 30 : 3600,
      confidence: "high",
    })
  }

  const ev = eventEnvelope.data

  // ── 3. Lineups envelope ───────────────────────────────────────────────────

  let lineupsEnvelope = makeUnavailable<MatchLineups>("Lineups", "thesportsdb")

  if (lineupData) {
    const homeName = ev?.strHomeTeam || lineupData.homeTeam?.name || "Home"
    const awayName = ev?.strAwayTeam || lineupData.awayTeam?.name || "Away"
    const homeBadge = ev?.strHomeTeamBadge || lineupData.homeTeam?.badge || ""
    const awayBadge = ev?.strAwayTeamBadge || lineupData.awayTeam?.badge || ""

    const hasHomePlayers = Array.isArray(lineupData.homeTeam?.starting) && lineupData.homeTeam.starting.length > 0
    const hasAwayPlayers = Array.isArray(lineupData.awayTeam?.starting) && lineupData.awayTeam.starting.length > 0
    const confirmed = hasHomePlayers && hasAwayPlayers

    const lineup: MatchLineups = {
      home: buildTeamLineup(lineupData.homeTeam, homeName, homeBadge),
      away: buildTeamLineup(lineupData.awayTeam, awayName, awayBadge),
      confirmed,
      source: "thesportsdb",
    }

    lineupsEnvelope = makeEnvelope(lineup, "thesportsdb", {
      fetchedAt,
      partial: !confirmed,
      confidence: confirmed ? "high" : "low",
      maxAgeSeconds: 300,
    })
  }

  // ── 4. Timeline envelope ──────────────────────────────────────────────────

  let timelineEnvelope = makeUnavailable<ReturnType<typeof normaliseTimelineFromTSDB>>("Timeline", "thesportsdb")

  // Try structured SF-API timeline first
  const sfTimeline = sfEvent?.timeline || sfEvent?.events || null
  if (Array.isArray(sfTimeline) && sfTimeline.length > 0) {
    const events = normaliseTimelineFromSFAPI(sfTimeline)
    timelineEnvelope = makeEnvelope(events, "thesportsdb", {
      fetchedAt,
      confidence: "high",
      maxAgeSeconds: 30,
    })
  } else if (sfEvent) {
    // Fall back to TSDB goal/card string fields
    const events = normaliseTimelineFromTSDB(sfEvent)
    if (events.length > 0) {
      timelineEnvelope = makeEnvelope(events, "thesportsdb", {
        fetchedAt,
        partial: true,
        confidence: "medium",
        maxAgeSeconds: 300,
      })
    }
  }

  // ── 5. Stats envelope ─────────────────────────────────────────────────────

  let statsEnvelope = makeUnavailable<ReturnType<typeof normaliseStatsFromTSDB>>("Statistics", "thesportsdb")

  const sfStats = sfEvent?.statistics || sfEvent?.stats || null
  if (Array.isArray(sfStats) && sfStats.length > 0) {
    const stats = normaliseStatsFromSFAPI(sfStats)
    if (stats.length > 0) {
      statsEnvelope = makeEnvelope(stats, "thesportsdb", { fetchedAt, confidence: "high" })
    }
  } else if (sfEvent) {
    const stats = normaliseStatsFromTSDB(sfEvent)
    if (stats.length > 0) {
      statsEnvelope = makeEnvelope(stats, "thesportsdb", { fetchedAt, partial: true, confidence: "medium" })
    }
  }

  // ── 6. Standings envelope ─────────────────────────────────────────────────

  let standingsEnvelope = makeUnavailable<ReturnType<typeof normaliseStandingsFromTSDB>>("Standings", "thesportsdb")

  const leagueId = ev?.idLeague
  if (leagueId) {
    try {
      const table = await getLeagueTable(leagueId, ev?.strSeason)
      if (table.length > 0) {
        const normalised = normaliseStandingsFromTSDB(table, ev?.idHomeTeam, ev?.idAwayTeam)
        standingsEnvelope = makeEnvelope(normalised, "thesportsdb", {
          fetchedAt,
          confidence: "high",
          maxAgeSeconds: 900,
        })
      }
    } catch {
      // leave as unavailable
    }
  }

  // ── 7. TV envelope ────────────────────────────────────────────────────────

  let tvEnvelope = makeUnavailable<MatchTvInfo>("TV listings", "thesportsdb")

  const tvInfo = normaliseTvChannels(sfEvent)
  if (tvInfo) {
    tvEnvelope = makeEnvelope(tvInfo, "thesportsdb", {
      fetchedAt,
      confidence: "medium",
      maxAgeSeconds: 3600,
    })
  }

  // ── 8. Highlights envelope ────────────────────────────────────────────────

  let highlightsEnvelope = makeUnavailable<MatchHighlightItem[]>("Highlights", "thesportsdb")

  const tsdbHighlights = normaliseHighlightsFromTSDB(
    ev?.strVideo,
    ev ? `${ev.strHomeTeam} vs ${ev.strAwayTeam}` : "Match"
  )

  // Add broader highlights feed
  const feedItems: MatchHighlightItem[] = []
  if (Array.isArray(highlightsPayload)) {
    for (const item of highlightsPayload as any[]) {
      if (item?.videoUrl) {
        feedItems.push({
          id: String(item.id || `hl-${feedItems.length}`),
          title: item.title || "Highlight",
          url: item.videoUrl,
          thumbnail: item.thumbnailUrl || undefined,
          provider: "thesportsdb",
          publishedAt: item.date || undefined,
        })
      }
    }
  }

  const allHighlights = [...tsdbHighlights, ...feedItems].filter(
    (h, i, arr) => arr.findIndex((x) => x.url === h.url) === i
  )

  if (allHighlights.length > 0) {
    highlightsEnvelope = makeEnvelope(allHighlights, "thesportsdb", {
      fetchedAt,
      confidence: "medium",
      maxAgeSeconds: 3600,
    })
  }

  // ── 9. Insights envelope ──────────────────────────────────────────────────

  let insightsEnvelope = makeUnavailable<ReturnType<typeof deriveInsightsFromContext>>("Insights", "derived")

  const standings = standingsEnvelope.data
  if (standings && standings.length > 0 && ev) {
    const derived = deriveInsightsFromContext({
      standings,
      homeTeamId: ev.idHomeTeam,
      awayTeamId: ev.idAwayTeam,
      homeTeamName: ev.strHomeTeam,
      awayTeamName: ev.strAwayTeam,
    })
    if (derived.length > 0) {
      insightsEnvelope = makeEnvelope(derived, "derived", {
        fetchedAt,
        confidence: "medium",
        maxAgeSeconds: 900,
      })
    }
  }

  // ── Assemble and return ───────────────────────────────────────────────────

  // Section 11: derive coverage hints from event sport + league id so tabs
  // can make visibility decisions without a separate /api/coverage round-trip.
  const sportKey = deriveSportKey(ev?.strSport ?? null)
  const competitionId = ev?.idLeague ?? null
  const coverageHints = buildMatchCenterCoverageHints(sportKey, competitionId)

  const response: MatchCenterResponse = {
    event: eventEnvelope,
    lineups: lineupsEnvelope,
    timeline: timelineEnvelope,
    stats: statsEnvelope,
    standings: standingsEnvelope,
    tv: tvEnvelope,
    highlights: highlightsEnvelope,
    insights: insightsEnvelope,
    coverageHints,
  }

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "no-store",
    },
  })
}
