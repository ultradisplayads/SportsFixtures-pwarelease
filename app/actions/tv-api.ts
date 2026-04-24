"use server"

// TSDB v2 TV Listings — requires paid key (SPORTSDB_API_KEY != "3")
// Endpoints: /filter/tv/day/{date} | /filter/tv/country/{country} | /filter/tv/sport/{sport} | /filter/tv/channel/{channel}

const API_KEY = process.env.SPORTSDB_API_KEY || "3"
const BASE_V2 = "https://www.thesportsdb.com/api/v2/json"

export interface TSDBTVEvent {
  id?: string
  idEvent?: string
  idTVStation?: string
  strEvent?: string
  strFilename?: string
  strSport?: string
  strLeague?: string
  strChannel?: string
  strTVStation?: string
  strTVLogo?: string
  strCountry?: string
  strTime?: string
  dateEvent?: string
}

async function fetchTV(path: string): Promise<TSDBTVEvent[]> {
  try {
    const res = await fetch(`${BASE_V2}/${path}`, {
      headers: { "X-API-KEY": API_KEY },
      next: { revalidate: 300 }, // 5 min cache
    })
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        console.warn(`[tv-api] Auth error on ${path} — check SPORTSDB_API_KEY`)
      }
      return []
    }
    const data = await res.json()
    // TSDB v2 TV endpoints return { tvevents: [...] } or { schedule: [...] }
    return data?.tvevents || data?.schedule || data?.events || []
  } catch (e) {
    console.error("[tv-api]", e)
    return []
  }
}

export async function getTVByDay(date: string): Promise<TSDBTVEvent[]> {
  return fetchTV(`filter/tv/day/${date}`)
}

export async function getTVByCountry(country: string): Promise<TSDBTVEvent[]> {
  // country must be underscored e.g. "united_kingdom"
  const slug = country.toLowerCase().replace(/\s+/g, "_")
  return fetchTV(`filter/tv/country/${slug}`)
}

export async function getTVBySport(sport: string): Promise<TSDBTVEvent[]> {
  const slug = sport.toLowerCase().replace(/\s+/g, "_")
  return fetchTV(`filter/tv/sport/${slug}`)
}

export async function getTVByChannel(channel: string): Promise<TSDBTVEvent[]> {
  const slug = channel.toLowerCase().replace(/\s+/g, "_")
  return fetchTV(`filter/tv/channel/${slug}`)
}
