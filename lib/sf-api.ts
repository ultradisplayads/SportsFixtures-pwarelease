// SF Backend API Client - staging-api.sportsfixtures.net
// Primary data source for news, TV events, venues, sports, countries, leagues, auth

import {
  normalizeTeamBadge,
  normalizeCompetitionLogo,
  normalizeArticleImage,
  normalizeVenueImage,
  getBestAssetUrl,
} from "@/lib/asset-normalization"

// Strip /api-docs or trailing slashes if the env var was set to the docs URL
const rawUrl = process.env.SF_API_URL || "https://staging-api.sportsfixtures.net"
const SF_API_URL = rawUrl.replace(/\/api-docs\/?$/, "").replace(/\/$/, "")
// Read lazily so updates to env vars in the Vercel dashboard are picked up without a redeploy
const getSFToken = () => process.env.SF_API_TOKEN || ""

// The SF API uses Strapi field naming conventions (strSport, strCountry, etc.)
// These interfaces map both the raw Strapi fields and normalised aliases

export interface SFSport {
  id: string | number
  documentId?: string
  idSport?: string
  strSport?: string    // raw Strapi field
  name?: string        // normalised alias
  slug?: string
  icon?: string
  strSportThumb?: string
  isActive?: boolean
}

export interface SFCountry {
  id: string | number
  documentId?: string
  name?: string
  strCountry?: string  // raw Strapi field
  slug?: string
  flag?: string
  countryCode?: string
  strFlag?: string
}

export interface SFLeague {
  id: string | number
  documentId?: string
  name?: string
  strLeague?: string   // raw Strapi field
  idLeague?: string
  slug?: string
  sport?: SFSport
  country?: SFCountry
  logo?: string
  strBadge?: string
  priority?: number
}

export interface SFTeam {
  id: string | number
  documentId?: string
  name?: string
  strTeam?: string     // raw Strapi field
  idTeam?: string
  slug?: string
  badge?: string
  strTeamBadge?: string
  league?: SFLeague
  sport?: SFSport
  country?: SFCountry
}

export interface SFEvent {
  id: string | number
  documentId?: string
  idEvent?: string
  strEvent?: string    // raw Strapi field
  name?: string        // normalised alias
  slug?: string
  dateEvent?: string | null
  dateEventLocal?: string | null
  strTime?: string | null
  strTimeLocal?: string | null
  strTimestamp?: string | null
  strHomeTeam?: string
  strAwayTeam?: string
  idHomeTeam?: string | null
  idAwayTeam?: string | null
  strHomeTeamBadge?: string | null
  strAwayTeamBadge?: string | null
  homeTeam?: SFTeam
  awayTeam?: SFTeam
  intHomeScore?: number | string | null
  intAwayScore?: number | string | null
  strProgress?: string | null
  strStatus?: string | null
  strSport?: string | null
  strLeague?: string | null
  league?: SFLeague
  sport?: SFSport
  strThumb?: string | null
  strVideo?: string | null
  strVenue?: string | null
  venue?: { id?: string | number; name?: string } | null  // ← add this
  tvEvents?: SFTVEvent[]
}

export interface SFTVEvent {
  id: string | number
  documentId?: string
  channel?: string
  strChannel?: string  // raw Strapi field
  channelLogo?: string
  strChannelLogo?: string
  country?: string
  strCountry?: string
  countryCode?: string
  startTime?: string
  strTime?: string
  network?: string
  event?: SFEvent
}

export interface SFNewsArticle {
  id: string | number
  documentId?: string
  title?: string
  strTitle?: string    // raw Strapi field
  content?: string
  excerpt?: string
  image?: string
  strImage?: string
  source?: string
  url?: string
  publishedAt: string
  createdAt?: string
  category?: string
  sport?: SFSport
  tags?: string[]
}

export interface SFVenue {
  id: string | number
  documentId?: string
  name?: string
  strVenue?: string    // raw Strapi field
  address?: string
  city?: string
  country?: string
  phone?: string
  whatsapp?: string
  lineId?: string
  screenCount?: number
  capacity?: number
  rating?: number
  latitude?: number
  longitude?: number
  lat?: number
  lng?: number
  imageUrl?: string
  sports?: string[]
}

// Normalise a raw Strapi sport record into a consistent shape
export function normaliseSport(raw: any): SFSport {
  return {
    id: String(raw.id || raw.idSport || ""),
    documentId: raw.documentId,
    idSport: raw.idSport,
    strSport: raw.strSport,
    name: raw.strSport || raw.name || raw.displayName || "Unknown",
    slug: raw.slug || raw.strSport?.toLowerCase().replace(/\s+/g, "-") || "",
    icon: raw.strSportIconGreen || raw.strSportThumb,
    strSportThumb: raw.strSportThumb,
    isActive: raw.isActive,
  }
}

// Normalise a raw Strapi country record
export function normaliseCountry(raw: any): SFCountry {
  return {
    id: String(raw.id || ""),
    documentId: raw.documentId,
    name: raw.name_en || raw.name || raw.strCountry || "Unknown",
    strCountry: raw.strCountry,
    slug: raw.slug || raw.strCountry?.toLowerCase().replace(/\s+/g, "-") || "",
    flag: raw.strFlag || raw.flag,
    countryCode: raw.countryCode || raw.strCountry?.substring(0, 2).toUpperCase(),
  }
}

// Normalise a raw Strapi event record
export function normaliseSFEvent(raw: any): SFEvent {
  // Resolve home team name — raw.homeTeam may be a Strapi relation object {id, name, badge}
  const homeTeamName =
    typeof raw.homeTeam === "string"
      ? raw.homeTeam
      : raw.homeTeam?.name || raw.homeTeam?.strTeam || raw.strHomeTeam || ""
  const awayTeamName =
    typeof raw.awayTeam === "string"
      ? raw.awayTeam
      : raw.awayTeam?.name || raw.awayTeam?.strTeam || raw.strAwayTeam || ""

  // Use the asset-normalization layer — no more inline provider field guessing
  const homeObj =
    typeof raw.homeTeam === "object" && raw.homeTeam !== null ? raw.homeTeam : {}
  const awayObj =
    typeof raw.awayTeam === "object" && raw.awayTeam !== null ? raw.awayTeam : {}

  const homeBadge = getBestAssetUrl(
    normalizeTeamBadge({ ...homeObj, strHomeTeamBadge: raw.strHomeTeamBadge, homeBadge: raw.homeBadge }, homeTeamName),
  ) ?? ""
  const awayBadge = getBestAssetUrl(
    normalizeTeamBadge({ ...awayObj, strAwayTeamBadge: raw.strAwayTeamBadge, awayBadge: raw.awayBadge }, awayTeamName),
  ) ?? ""

  const leagueObj = raw.league && typeof raw.league === "object" ? raw.league : {}
  const leagueLogo = getBestAssetUrl(
    normalizeCompetitionLogo(
      { ...leagueObj, strLeague: raw.strLeague, strLeagueBadge: raw.strLeagueBadge },
      raw.strLeague || leagueObj.name,
    ),
  )

  return {
    ...raw,
    id: String(raw.id || raw.idEvent || ""),
    name: raw.strEvent || raw.name || "",
    dateEvent: raw.dateEvent || raw.dateEventLocal || null,
    strTime: raw.strTime || raw.strTimeLocal || null,
    homeTeam: homeTeamName,
    awayTeam: awayTeamName,
    homeBadge,
    awayBadge,
    idHomeTeam: raw.idHomeTeam || (typeof raw.homeTeam === "object" ? String(raw.homeTeam?.id || "") : undefined),
    idAwayTeam: raw.idAwayTeam || (typeof raw.awayTeam === "object" ? String(raw.awayTeam?.id || "") : undefined),
    intHomeScore: raw.intHomeScore != null ? Number(raw.intHomeScore) : null,
    intAwayScore: raw.intAwayScore != null ? Number(raw.intAwayScore) : null,
    sport: raw.sport ? raw.sport : raw.strSport ? { id: "", name: raw.strSport, strSport: raw.strSport } : undefined,
    league: raw.league
      ? { ...leagueObj, leagueLogo }
      : raw.strLeague
      ? { id: raw.idLeague || "", name: raw.strLeague, strLeague: raw.strLeague, leagueLogo }
      : undefined,
  }
}

// Extract array from Strapi response envelope
function extractArray(data: any, ...keys: string[]): any[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key]
    if (data.data && Array.isArray(data.data[key])) return data.data[key]
  }
  if (Array.isArray(data.data)) return data.data
  return []
}

async function sfFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${SF_API_URL}${endpoint}`
  const token = getSFToken()
  if (!token) {
    console.error("[SF API] SF_API_TOKEN is not set — request to", endpoint, "will fail with 401. Add the token in Project Settings > Vars.")
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      cache: "no-store",
    })

    if (!res.ok) {
      if (res.status === 404) {
        // 404 is expected when an event exists in TSDB but not the SF API — fail silently
        return null
      }
      const errorText = await res.text()
      if (res.status === 401) {
        console.error(`[SF API] 401 Unauthorized - ${endpoint}: token may be expired or invalid. Body:`, errorText)
      } else {
        console.error(`[SF API] ${res.status} ${res.statusText} - ${endpoint}:`, errorText)
      }
      return null
    }

    return res.json()
  } catch (err) {
    console.error(`[SF API] Network error - ${endpoint}:`, err)
    return null
  }
}

// ─── SPORTS ────────────────────────────────────────────────────────────────

export async function getSFSports(): Promise<SFSport[]> {
  const data = await sfFetch("/api/sports")
  return extractArray(data, "sports").map(normaliseSport)
}

// /api/top/sports does not exist in this Strapi instance — fall back to /api/sports
export async function getTopSports(): Promise<SFSport[]> {
  return getSFSports()
}

// ─── COUNTRIES ─────────────────────────────────────────────────────────────

export async function getSFCountries(): Promise<SFCountry[]> {
  const data = await sfFetch("/api/countries")
  return extractArray(data, "countries").map(normaliseCountry)
}

// ─── LEAGUES ───────────────────────────────────────────────────────────────

export async function getSFLeagues(params?: { sportId?: string; countryId?: string; page?: number }): Promise<SFLeague[]> {
  const query = new URLSearchParams()
  if (params?.sportId) query.set("filters[sport][id][$eq]", params.sportId)
  if (params?.countryId) query.set("filters[country][id][$eq]", params.countryId)
  if (params?.page) query.set("pagination[page]", String(params.page))
  const data = await sfFetch(`/api/leagues${query.toString() ? `?${query}` : ""}`)
  return extractArray(data, "leagues").map((r: any) => ({
    ...r,
    id: String(r.id || r.idLeague || ""),
    name: r.strLeague || r.name || "Unknown League",
    slug: r.slug || "",
    logo: r.strBadge || r.logo,
  }))
}

export async function getTopLeagues(): Promise<SFLeague[]> {
  return getSFLeagues()
}

export async function getSFLeagueById(idOrSlug: string): Promise<SFLeague | null> {
  // First try direct lookup by Strapi ID or slug
  const data = await sfFetch(`/api/leagues/${idOrSlug}`)
  if (data && !data.error) {
    const raw = data.data || data
    if (raw?.id || raw?.strLeague) {
      return { ...raw, id: String(raw.id || ""), name: raw.strLeague || raw.name || "" }
    }
  }
  // Fallback: filter by idLeague (TheSportsDB numeric ID)
  const fallback = await sfFetch(`/api/leagues?filters[idLeague][$eq]=${idOrSlug}&pagination[pageSize]=1`)
  const arr = fallback?.data ?? fallback?.leagues ?? []
  const raw = Array.isArray(arr) ? arr[0] : arr
  if (!raw) return null
  return { ...raw, id: String(raw.id || raw.idLeague || ""), name: raw.strLeague || raw.name || "" }
}

// ─── EVENTS ────────────────────────────────────────────────────────────────

export async function getSFEvents(params?: {
  sportId?: string
  countryId?: string
  leagueId?: string
  date?: string
  status?: string
  page?: number
  limit?: number
}): Promise<SFEvent[]> {
  const query = new URLSearchParams()
  if (params?.sportId) query.set("filters[sport][id][$eq]", params.sportId)
  if (params?.countryId) query.set("filters[country][id][$eq]", params.countryId)
  if (params?.leagueId) query.set("filters[idLeague][$eq]", params.leagueId)
  if (params?.date) query.set("filters[dateEvent][$eq]", params.date)
  if (params?.status) query.set("filters[strStatus][$eq]", params.status)
  if (params?.page) query.set("pagination[page]", String(params.page))
  if (params?.limit) query.set("pagination[pageSize]", String(params.limit))
  const data = await sfFetch(`/api/events${query.toString() ? `?${query}` : ""}`)
  return extractArray(data, "events").map(normaliseSFEvent)
}

export async function getLiveSFEvents(): Promise<SFEvent[]> {
  const data = await sfFetch("/api/events?filters[strStatus][$eq]=live&pagination[pageSize]=50")
  return extractArray(data, "events").map(normaliseSFEvent)
}

export async function getSFEventById(id: string): Promise<SFEvent | null> {
  const data = await sfFetch(`/api/events/${id}`)
  if (!data) return null
  const raw = data.data || data
  return normaliseSFEvent(raw)
}

export async function getBestEventsPerSport(): Promise<SFEvent[]> {
  // Strapi doesn't have this custom endpoint — use top events ordered by date
  const data = await sfFetch("/api/events?sort=dateEvent:asc&pagination[pageSize]=20")
  return extractArray(data, "events").map(normaliseSFEvent)
}

// ─── TV EVENTS ─────────────────────────────────────────────────────────────

export async function getTVEventsForEvent(eventId: string): Promise<SFTVEvent[]> {
  const data = await sfFetch(`/api/tv-events?filters[event][id][$eq]=${eventId}&populate=*`)
  return extractArray(data, "tvEvents", "tv-events").map((r: any) => ({
    ...r,
    id: String(r.id || ""),
    channel: r.strChannel || r.channel || r.strTVStation || "",
    channelLogo: r.strChannelLogo || r.channelLogo,
    country: r.strCountry || r.country,
    countryCode: r.countryCode,
    startTime: r.strTime || r.startTime,
  }))
}

export async function getTVEventsBySport(sport: string): Promise<SFTVEvent[]> {
  const data = await sfFetch(`/api/tv-events?filters[strSport][$eq]=${encodeURIComponent(sport)}&populate=*`)
  return extractArray(data, "tvEvents", "tv-events")
}

export async function getTVEventsByDateRange(from: string, to: string): Promise<SFTVEvent[]> {
  const data = await sfFetch(`/api/tv-events?filters[dateEvent][$gte]=${from}&filters[dateEvent][$lte]=${to}&populate=*`)
  return extractArray(data, "tvEvents", "tv-events")
}

// ─── NEWS ──────────────────────────────────────────────────────────────────

export async function getSFNews(params?: {
  sport?: string
  category?: string
  page?: number
  limit?: number
}): Promise<SFNewsArticle[]> {
  const query = new URLSearchParams()
  if (params?.sport) query.set("filters[sport][strSport][$containsi]", params.sport)
  if (params?.category) query.set("filters[category][$containsi]", params.category)
  if (params?.page) query.set("pagination[page]", String(params.page))
  query.set("pagination[pageSize]", String(params?.limit || 20))
  query.set("sort", "publishedAt:desc")
  query.set("populate", "sport")
  const data = await sfFetch(`/api/news?${query}`)
  return extractArray(data, "articles", "news").map((r: any) => ({
    ...r,
    id: String(r.id || ""),
    title: r.strTitle || r.title || r.headline || "Untitled",
    excerpt: r.strExcerpt || r.excerpt || r.description || "",
    // Use asset-normalization layer — resolves strImage, image, thumbnail in priority order
    image: getBestAssetUrl(normalizeArticleImage(r, r.strTitle || r.title || null)),
    source: r.strSource || r.source || "Sports Fixtures",
    url: r.strUrl || r.url || r.link,
    publishedAt: r.publishedAt || r.createdAt || new Date().toISOString(),
    category: r.strCategory || r.category || r.sport?.strSport || "Sport",
    sport: r.sport ? normaliseSport(r.sport) : undefined,
  }))
}

// ─── VENUES ────────────────────────────────────────────────────────────────

export async function getSFVenues(params?: {
  lat?: number
  lng?: number
  radius?: number
}): Promise<SFVenue[]> {
  const query = new URLSearchParams()
  if (params?.lat) query.set("lat", String(params.lat))
  if (params?.lng) query.set("lng", String(params.lng))
  if (params?.radius) query.set("radius", String(params.radius))
  query.set("pagination[pageSize]", "50")
  const data = await sfFetch(`/api/venues?${query}`)
  return extractArray(data, "venues").map((r: any) => ({
    ...r,
    id: String(r.id || ""),
    name: r.strVenue || r.name || "Unknown Venue",
    address: r.strAddress || r.address,
    city: r.strCity || r.city,
    country: r.strCountry || r.country,
    latitude: r.latitude || r.lat || r.strLatitude,
    longitude: r.longitude || r.lng || r.strLongitude,
    // Asset-normalization resolves strImage, imageUrl, strFanart1, strThumb in priority order
    imageUrl: getBestAssetUrl(normalizeVenueImage(r, r.strVenue || r.name || null)),
  }))
}

export async function getSFVenueById(id: string): Promise<SFVenue | null> {
  const data = await sfFetch(`/api/venues/${id}`)
  if (!data) return null
  const raw = data.data || data
  return { ...raw, id: String(raw.id || ""), name: raw.strVenue || raw.name || "" }
}

// ─── TEAMS ─────────────────────────────────────────────────────────────────

export async function getSFTeamById(id: string): Promise<SFTeam | null> {
  const data = await sfFetch(`/api/teams/${id}`)
  if (!data) return null
  const raw = data.data || data
  return { ...raw, id: String(raw.id || ""), name: raw.strTeam || raw.name || "" }
}

export async function searchSFTeams(query: string): Promise<SFTeam[]> {
  const data = await sfFetch(`/api/teams?filters[strTeam][$containsi]=${encodeURIComponent(query)}`)
  return extractArray(data, "teams").map((r: any) => ({
    ...r,
    id: String(r.id || r.idTeam || ""),
    name: r.strTeam || r.name || "",
    badge: r.strTeamBadge || r.badge,
  }))
}

// ─── PLAYERS ───────────────────────────────────────────────────────────────

export async function searchSFPlayers(query: string): Promise<any[]> {
  const data = await sfFetch(`/api/players?filters[strPlayer][$containsi]=${encodeURIComponent(query)}`)
  return extractArray(data, "players")
}

// ─── AUTH ──────────────────────────────────────────────────────────────────

export async function registerUser(body: {
  email: string
  password: string
  username?: string
  firstName?: string
  lastName?: string
}) {
  return sfFetch("/api/auth/local/register", {
    method: "POST",
    body: JSON.stringify(body),
    next: undefined,
    cache: "no-store",
  })
}

export async function loginUser(body: { email: string; password: string }) {
  return sfFetch("/api/auth/local", {
    method: "POST",
    body: JSON.stringify({ identifier: body.email, password: body.password }),
    next: undefined,
    cache: "no-store",
  })
}

export async function getCurrentUser(token: string) {
  return sfFetch("/api/users/me", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
}

// ─── TRENDING ──────────────────────────────────────────────────────────────

export async function getTrendingEvents(): Promise<SFEvent[]> {
  return getBestEventsPerSport()
}

// ─── ADS ───────────────────────────────────────────────────────────────────

export interface SFAd {
  type: "banner" | "native"
  title: string
  description: string
  cta: string
  image?: string
  link: string
}

export async function sfFetchAd(position: "top" | "middle" | "bottom"): Promise<SFAd | null> {
  // Ads served from Strapi — configure ad content types in CMS
  // Returns null when no active ads exist for this position
  const data = await sfFetch(`/api/ads?filters[position][$eq]=${position}&filters[isActive][$eq]=true&pagination[pageSize]=1&sort=createdAt:desc`)
  const items = extractArray(data, "ads")
  if (!items.length) return null
  const raw = items[0]
  return {
    type: raw.type || "banner",
    title: raw.title || raw.strTitle || "",
    description: raw.description || raw.strDescription || "",
    cta: raw.ctaText || raw.cta || "Learn More",
    image: raw.imageUrl || raw.strImage,
    link: raw.link || raw.strLink || "#",
  }
}
