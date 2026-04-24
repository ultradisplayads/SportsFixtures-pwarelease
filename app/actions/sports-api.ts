"use server"

// Server Actions for SportsDB API - keeps API key secure

const SPORTSDB_API_KEY = process.env.SPORTSDB_API_KEY || "3"
// Note: Free key "3" only supports v1. A paid key unlocks v2 (live scores, full TV data).
const API_BASE_V1 = "https://www.thesportsdb.com/api/v1/json"
const API_BASE_V2 = "https://www.thesportsdb.com/api/v2/json"

// API Types
export interface LiveScore {
  idLiveScore: string
  idEvent: string
  strSport: string
  idLeague: string
  strLeague: string
  idHomeTeam: string
  idAwayTeam: string
  strHomeTeam: string
  strAwayTeam: string
  intHomeScore: string
  intAwayScore: string
  strProgress: string
  strEventTime: string
  dateEvent: string
  updated: string
}

export interface Event {
  idEvent: string
  strEvent: string
  strEventAlternate: string
  strFilename: string
  strSport: string
  idLeague: string
  strLeague: string
  strSeason: string
  strHomeTeam: string
  strAwayTeam: string
  intHomeScore: string
  intAwayScore: string
  intRound: string
  strProgress: string
  dateEvent: string
  strTime: string
  idHomeTeam: string
  idAwayTeam: string
  strHomeTeamBadge: string
  strAwayTeamBadge: string
  strThumb: string
  strVideo: string
  strStatus: string
  strPostponed: string
  strVenue?: string
  strLeagueBadge?: string
}

export interface H2HMatch {
  idEvent: string
  strEvent: string
  dateEvent: string
  strHomeTeam: string
  strAwayTeam: string
  intHomeScore: string
  intAwayScore: string
  strSeason: string
}

export interface TableEntry {
  idTeam: string
  strTeam: string
  strTeamBadge: string
  intRank: string
  intPlayed: string
  intWin: string
  intDraw: string
  intLoss: string
  intGoalsFor: string
  intGoalsAgainst: string
  intGoalDifference: string
  intPoints: string
  strForm: string
}

// V2 API call with authentication header
async function fetchV2(endpoint: string): Promise<any> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const response = await fetch(`${API_BASE_V2}/${endpoint}`, {
      headers: { "X-API-KEY": SPORTSDB_API_KEY },
      cache: "no-store",
      signal: controller.signal,
    })

    if (!response.ok) {
      // Return empty for all expected non-2xx codes so callers get [] not an error.
      // 400/401/403 = free key used on a premium endpoint (expected in dev/staging)
      // 429 = rate limited, 503 = temporarily unavailable
      return {}
    }

    const text = await response.text()
    if (!text || text.trim() === "" || text.trim() === "null") return {}
    try { return JSON.parse(text) } catch { return {} }
  } catch {
    // Swallow all errors — 400/401/403 from premium endpoints and network
    // failures must never surface as uncaught errors in the preview overlay.
    return {}
  } finally {
    clearTimeout(timeout)
  }
}

// V1 API call
async function fetchV1(endpoint: string): Promise<any> {
  const response = await fetch(`${API_BASE_V1}/${SPORTSDB_API_KEY}/${endpoint}`, {
    next: { revalidate: 30 },
  })

  if (!response.ok) {
    // Return empty rather than throw so callers degrade gracefully
    return {}
  }

  // TheSportsDB sometimes returns an empty body (zero bytes) or plain "{}"
  // for leagues/seasons with no data — guard against JSON parse failures.
  const text = await response.text()
  if (!text || text.trim() === "" || text.trim() === "null") {
    return {}
  }
  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

// Server Actions
export async function getLiveScores(sport = "soccer"): Promise<LiveScore[]> {
  try {
    const data = await fetchV2(`livescore/${sport}`)
    return data.livescores || []
  } catch (error) {
    console.error("Error fetching live scores:", error)
    return []
  }
}

export async function getNextEvents(leagueId: string): Promise<Event[]> {
  try {
    const data = await fetchV1(`eventsnextleague.php?id=${leagueId}`)
    return data.events || []
  } catch (error) {
    console.error("Error fetching next events:", error)
    return []
  }
}

export async function getPastEvents(leagueId: string): Promise<Event[]> {
  try {
    const data = await fetchV1(`eventspastleague.php?id=${leagueId}`)
    return data.events || []
  } catch (error) {
    console.error("Error fetching past events:", error)
    return []
  }
}

export async function getEventDetails(eventId: string): Promise<Event | null> {
  try {
    const data = await fetchV1(`lookupevent.php?id=${eventId}`)
    return data.events?.[0] || null
  } catch (error) {
    console.error("Error fetching event details:", error)
    return null
  }
}

export async function getHeadToHead(team1Id: string, team2Id: string, leagueId: string): Promise<H2HMatch[]> {
  try {
    // Get past events from the league
    const data = await fetchV1(`eventspastleague.php?id=${leagueId}`)

    // TheSportsDB returns null (not []) when no results — guard both cases
    const raw = data?.events
    const events: Event[] = Array.isArray(raw) ? raw : []

    // Filter for matches between these two teams
    const h2hMatches = events.filter((event: Event) => {
      const isMatch =
        (event.idHomeTeam === team1Id && event.idAwayTeam === team2Id) ||
        (event.idHomeTeam === team2Id && event.idAwayTeam === team1Id)
      return isMatch && event.intHomeScore !== null && event.intAwayScore !== null
    })

    // Return last 5 matches
    return h2hMatches.slice(0, 5).map((event: Event) => ({
      idEvent: event.idEvent,
      strEvent: event.strEvent,
      dateEvent: event.dateEvent,
      strHomeTeam: event.strHomeTeam,
      strAwayTeam: event.strAwayTeam,
      intHomeScore: event.intHomeScore,
      intAwayScore: event.intAwayScore,
      strSeason: event.strSeason,
    }))
  } catch (error) {
    console.error("Error fetching head-to-head:", error)
    return []
  }
}

export async function getLeagueTable(leagueId: string, season?: string): Promise<TableEntry[]> {
  // Build a list of seasons to try: provided value → hyphenated → single year
  const currentYear = new Date().getFullYear()
  const seasonsToTry = season
    ? [season]
    : [
        `${currentYear - 1}-${currentYear}`, // e.g. "2024-2025" (European leagues)
        `${currentYear}`,                     // e.g. "2025"     (Thai, US leagues)
        `${currentYear - 1}`,                 // previous single year fallback
      ]

  for (const s of seasonsToTry) {
    try {
      const data = await fetchV1(`lookuptable.php?l=${leagueId}&s=${s}`)
      const table = data?.table
      if (Array.isArray(table) && table.length > 0) {
        return table
      }
    } catch {
      // try next season string
    }
  }

  console.error(`Error fetching league table for league ${leagueId}: no data found for any season`)
  return []
}

export async function getTeamDetails(teamId: string) {
  try {
    const data = await fetchV1(`lookupteam.php?id=${teamId}`)
    return data.teams?.[0] || null
  } catch (error) {
    console.error("Error fetching team details:", error)
    return null
  }
}

export async function getPlayersByTeam(teamId: string) {
  try {
    const data = await fetchV1(`lookup_all_players.php?id=${teamId}`)
    return data.player || []
  } catch (error) {
    console.error("Error fetching players:", error)
    return []
  }
}

export async function searchTeams(query: string) {
  try {
    const data = await fetchV1(`searchteams.php?t=${encodeURIComponent(query)}`)
    return data.teams || []
  } catch (error) {
    console.error("Error searching teams:", error)
    return []
  }
}

export async function searchPlayers(query: string) {
  try {
    const data = await fetchV1(`searchplayers.php?p=${encodeURIComponent(query)}`)
    return data.player || []
  } catch (error) {
    console.error("Error searching players:", error)
    return []
  }
}

export async function getNextEventsByTeam(teamId: string): Promise<Event[]> {
  try {
    const data = await fetchV1(`eventsnext.php?id=${teamId}`)
    return data.events || []
  } catch (error) {
    console.error("Error fetching next events by team:", error)
    return []
  }
}

export async function handleRefresh() {
  "use server"
  return { success: true, timestamp: new Date().toISOString() }
}
