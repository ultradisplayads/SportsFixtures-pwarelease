import type { Event, LiveScore, TableEntry } from "@/app/actions/sports-api"
import {
  apiSportsFetch,
  currentFootballSeason,
  footballProduct,
  getApiSportsKey,
  hasApiSportsKey,
} from "@/lib/api-sports"

export function getApiFootballKey(): string {
  return getApiSportsKey()
}

export function hasApiFootballKey(): boolean {
  return hasApiSportsKey()
}

const TSDB_TO_API_FOOTBALL_LEAGUES: Record<string, string> = {
  "4328": "39",  // Premier League
  "4480": "2",   // UEFA Champions League
  "4335": "140", // La Liga
  "4331": "78",  // Bundesliga
  "4332": "135", // Serie A
  "4334": "61",  // Ligue 1
  "4330": "179", // Scottish Premiership
  "4346": "253", // Major League Soccer
}

export function mapTsdbLeagueToApiFootball(leagueId: string): string | null {
  return TSDB_TO_API_FOOTBALL_LEAGUES[String(leagueId)] || null
}

async function apiFootballFetch(endpoint: string, init: RequestInit = {}): Promise<any | null> {
  return apiSportsFetch(footballProduct(), endpoint, init)
}

function normaliseStatus(short?: string | null): string {
  if (!short) return "NS"
  const status = short.toUpperCase()
  if (["1H", "2H", "HT", "ET", "BT", "P", "SUSP", "INT", "LIVE"].includes(status)) return status
  if (["FT", "AET", "PEN"].includes(status)) return "FT"
  return status
}

function fixtureToEvent(row: any): Event {
  const fixture = row?.fixture || {}
  const league = row?.league || {}
  const teams = row?.teams || {}
  const goals = row?.goals || {}
  const status = fixture?.status || {}
  const date = fixture?.date ? new Date(fixture.date) : null
  const statusShort = normaliseStatus(status.short)

  return {
    idEvent: String(fixture.id || ""),
    strEvent: `${teams.home?.name || "Home"} vs ${teams.away?.name || "Away"}`,
    strEventAlternate: "",
    strFilename: "",
    strSport: "Soccer",
    idLeague: String(league.id || ""),
    strLeague: league.name || "",
    strSeason: String(league.season || currentFootballSeason()),
    strHomeTeam: teams.home?.name || "",
    strAwayTeam: teams.away?.name || "",
    intHomeScore: goals.home == null ? "" : String(goals.home),
    intAwayScore: goals.away == null ? "" : String(goals.away),
    intRound: "",
    strProgress: status.elapsed != null ? `${status.elapsed}'` : statusShort,
    dateEvent: date ? date.toISOString().slice(0, 10) : "",
    strTime: date ? date.toISOString().slice(11, 19) : "",
    idHomeTeam: teams.home?.id ? String(teams.home.id) : "",
    idAwayTeam: teams.away?.id ? String(teams.away.id) : "",
    strHomeTeamBadge: teams.home?.logo || "",
    strAwayTeamBadge: teams.away?.logo || "",
    strThumb: "",
    strVideo: "",
    strStatus: statusShort,
    strPostponed: statusShort === "PST" ? "yes" : "",
    strVenue: fixture?.venue?.name || "",
    strLeagueBadge: league.logo || "",
  }
}

function fixtureToLiveScore(row: any): LiveScore {
  const event = fixtureToEvent(row)
  return {
    idLiveScore: event.idEvent,
    idEvent: event.idEvent,
    strSport: event.strSport,
    idLeague: event.idLeague,
    strLeague: event.strLeague,
    idHomeTeam: event.idHomeTeam,
    idAwayTeam: event.idAwayTeam,
    strHomeTeam: event.strHomeTeam,
    strAwayTeam: event.strAwayTeam,
    intHomeScore: event.intHomeScore,
    intAwayScore: event.intAwayScore,
    strProgress: event.strProgress,
    strEventTime: event.strTime,
    dateEvent: event.dateEvent,
    updated: new Date().toISOString(),
  }
}

export async function getApiFootballLiveScores(): Promise<LiveScore[]> {
  const data = await apiFootballFetch("fixtures?live=all")
  const rows = Array.isArray(data?.response) ? data.response : []
  return rows.map(fixtureToLiveScore)
}

export async function getApiFootballLiveEvents(): Promise<Event[]> {
  const data = await apiFootballFetch("fixtures?live=all")
  const rows = Array.isArray(data?.response) ? data.response : []
  return rows.map(fixtureToEvent)
}

export async function getApiFootballFixtureLiveDetails(fixtureId: string): Promise<{
  events: any[]
  statistics: any[]
}> {
  if (!fixtureId) return { events: [], statistics: [] }

  const [eventsData, statisticsData] = await Promise.all([
    apiFootballFetch(`fixtures/events?fixture=${encodeURIComponent(fixtureId)}`),
    apiFootballFetch(`fixtures/statistics?fixture=${encodeURIComponent(fixtureId)}`),
  ])

  return {
    events: Array.isArray(eventsData?.response) ? eventsData.response : [],
    statistics: Array.isArray(statisticsData?.response) ? statisticsData.response : [],
  }
}

export async function getApiFootballNextEvents(tsdbLeagueId: string): Promise<Event[]> {
  const leagueId = mapTsdbLeagueToApiFootball(tsdbLeagueId)
  if (!leagueId) return []
  const season = currentFootballSeason()
  const data = await apiFootballFetch(`fixtures?league=${leagueId}&season=${season}&next=30`)
  const rows = Array.isArray(data?.response) ? data.response : []
  return rows.map(fixtureToEvent)
}

export async function getApiFootballPastEvents(tsdbLeagueId: string): Promise<Event[]> {
  const leagueId = mapTsdbLeagueToApiFootball(tsdbLeagueId)
  if (!leagueId) return []
  const season = currentFootballSeason()
  const data = await apiFootballFetch(`fixtures?league=${leagueId}&season=${season}&last=30`)
  const rows = Array.isArray(data?.response) ? data.response : []
  return rows.map(fixtureToEvent)
}

export async function getApiFootballLeagueTable(tsdbLeagueId: string): Promise<TableEntry[]> {
  const leagueId = mapTsdbLeagueToApiFootball(tsdbLeagueId)
  if (!leagueId) return []
  const current = currentFootballSeason()
  const seasons = [current, current - 1, current - 2, current - 3]

  for (const season of seasons) {
    const data = await apiFootballFetch(`standings?league=${leagueId}&season=${season}`)
    const standings = data?.response?.[0]?.league?.standings?.[0]
    if (!Array.isArray(standings) || standings.length === 0) continue

    return standings.map((row: any): TableEntry => ({
      idTeam: row.team?.id ? String(row.team.id) : "",
      strTeam: row.team?.name || "",
      strTeamBadge: row.team?.logo || "",
      intRank: row.rank == null ? "" : String(row.rank),
      intPlayed: row.all?.played == null ? "" : String(row.all.played),
      intWin: row.all?.win == null ? "" : String(row.all.win),
      intDraw: row.all?.draw == null ? "" : String(row.all.draw),
      intLoss: row.all?.lose == null ? "" : String(row.all.lose),
      intGoalsFor: row.all?.goals?.for == null ? "" : String(row.all.goals.for),
      intGoalsAgainst: row.all?.goals?.against == null ? "" : String(row.all.goals.against),
      intGoalDifference: row.goalsDiff == null ? "" : String(row.goalsDiff),
      intPoints: row.points == null ? "" : String(row.points),
      strForm: row.form || "",
    }))
  }

  return []
}
