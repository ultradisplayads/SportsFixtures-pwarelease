export interface TVOverrideEvent {
  id: string
  event: string
  time: string
  date: string
  sport: string
  league: string
  season: string
  competition: string
  channels: string[]
  streamingServices: string[]
  homeTeam: string
  awayTeam: string
  thumbnail?: string | null
  editorialOverride?: boolean
}

const TV_OVERRIDES: TVOverrideEvent[] = [
  {
    id: "editorial-celtic-rangers-2026-05-10",
    event: "Celtic vs Rangers",
    time: "11:00",
    date: "2026-05-10",
    sport: "Soccer",
    league: "Scottish Premiership",
    season: "2025-2026",
    competition: "Scottish Premiership",
    channels: ["Sky Sports Football"],
    streamingServices: [],
    homeTeam: "Celtic",
    awayTeam: "Rangers",
    thumbnail: null,
    editorialOverride: true,
  },
]

function inRange(date: string, startDate: string, endDate: string) {
  return date >= startDate && date <= endDate
}

function matchesSport(row: TVOverrideEvent, sport?: string) {
  if (!sport) return true
  const normalised = sport.toLowerCase()
  if (normalised === "football") return row.sport.toLowerCase() === "soccer"
  return (
    row.sport.toLowerCase().includes(normalised) ||
    row.league.toLowerCase().includes(normalised)
  )
}

export function getTVOverrides(params: {
  startDate: string
  endDate: string
  sport?: string
}): TVOverrideEvent[] {
  return TV_OVERRIDES.filter(
    (row) =>
      inRange(row.date, params.startDate, params.endDate) &&
      matchesSport(row, params.sport),
  )
}
