export type ResultRow = {
  id: string
  sport?: string | null
  competitionId?: string | null
  competitionName?: string | null
  homeTeamName: string
  awayTeamName: string
  homeScore?: number | null
  awayScore?: number | null
  finishedAt?: string | null
  status?: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeResultRow(raw: any): ResultRow {
  return {
    id: String(raw?.id || raw?.eventId || ""),
    sport: typeof raw?.sport === "string" ? raw.sport : null,
    competitionId: typeof raw?.competitionId === "string" ? raw.competitionId : null,
    competitionName: typeof raw?.competitionName === "string" ? raw.competitionName : null,
    homeTeamName: String(raw?.homeTeamName || raw?.strHomeTeam || "Unknown Home Team"),
    awayTeamName: String(raw?.awayTeamName || raw?.strAwayTeam || "Unknown Away Team"),
    homeScore: typeof raw?.homeScore === "number" ? raw.homeScore : null,
    awayScore: typeof raw?.awayScore === "number" ? raw.awayScore : null,
    finishedAt: typeof raw?.finishedAt === "string" ? raw.finishedAt : null,
    status: typeof raw?.status === "string" ? raw.status : null,
  }
}
