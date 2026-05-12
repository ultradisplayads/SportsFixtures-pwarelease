import { cachedProviderJson } from "@/lib/provider-cache"

export type ApiSportsProductKey =
  | "football"
  | "afl"
  | "baseball"
  | "basketball"
  | "formula-1"
  | "handball"
  | "hockey"
  | "mma"
  | "nba"
  | "nfl"
  | "rugby"
  | "volleyball"

export type ApiSportsProductConfig = {
  key: ApiSportsProductKey
  label: string
  sport: string
  baseUrl: string
  plan: string
  dailyLimit: number
  enabled: boolean
  supportsLive: boolean
  liveEndpoint?: string
  subscriptionEnd?: string
}

export type ApiSportsLiveEvent = {
  provider: "api-sports"
  product: ApiSportsProductKey
  id: string
  sport: string
  league: string
  leagueLogo: string | null
  homeTeam: string
  homeLogo: string | null
  awayTeam: string
  awayLogo: string | null
  homeScore: number | null
  awayScore: number | null
  progress: string | null
  dateEvent: string | null
  strTime: string | null
  status: "live" | "ft" | "ns"
  raw: any
}

const DEFAULT_DAILY_LIMIT = Number(process.env.API_SPORTS_DAILY_LIMIT || 100)
const DETAIL_BUDGET = Number(process.env.API_SPORTS_LIVE_DETAIL_BUDGET || 2)

const DEFAULT_PRODUCTS: ApiSportsProductConfig[] = [
  {
    key: "football",
    label: "FOOTBALL",
    sport: "Soccer",
    baseUrl: "https://v3.football.api-sports.io",
    plan: "Free",
    dailyLimit: DEFAULT_DAILY_LIMIT,
    enabled: true,
    supportsLive: true,
    liveEndpoint: "fixtures?live=all",
    subscriptionEnd: "2027-04-20T00:00:00+00:00",
  },
  {
    key: "afl",
    label: "AFL",
    sport: "AFL",
    baseUrl: "https://v1.afl.api-sports.io",
    plan: "Free",
    dailyLimit: DEFAULT_DAILY_LIMIT,
    enabled: true,
    supportsLive: true,
    liveEndpoint: "games?live=all",
    subscriptionEnd: "2027-04-20T00:00:00+00:00",
  },
  {
    key: "baseball",
    label: "BASEBALL",
    sport: "Baseball",
    baseUrl: "https://v1.baseball.api-sports.io",
    plan: "Free",
    dailyLimit: DEFAULT_DAILY_LIMIT,
    enabled: true,
    supportsLive: true,
    liveEndpoint: "games?live=all",
    subscriptionEnd: "2027-04-20T00:00:00+00:00",
  },
  {
    key: "basketball",
    label: "BASKETBALL",
    sport: "Basketball",
    baseUrl: "https://v1.basketball.api-sports.io",
    plan: "Free",
    dailyLimit: DEFAULT_DAILY_LIMIT,
    enabled: true,
    supportsLive: true,
    liveEndpoint: "games?live=all",
    subscriptionEnd: "2027-04-20T00:00:00+00:00",
  },
  {
    key: "formula-1",
    label: "FORMULA-1",
    sport: "Formula 1",
    baseUrl: "https://v1.formula-1.api-sports.io",
    plan: "Free",
    dailyLimit: DEFAULT_DAILY_LIMIT,
    enabled: true,
    supportsLive: false,
    subscriptionEnd: "2027-04-20T00:00:00+00:00",
  },
  {
    key: "handball",
    label: "HANDBALL",
    sport: "Handball",
    baseUrl: "https://v1.handball.api-sports.io",
    plan: "Free",
    dailyLimit: DEFAULT_DAILY_LIMIT,
    enabled: true,
    supportsLive: true,
    liveEndpoint: "games?live=all",
    subscriptionEnd: "2027-04-20T00:00:00+00:00",
  },
  {
    key: "hockey",
    label: "HOCKEY",
    sport: "Ice Hockey",
    baseUrl: "https://v1.hockey.api-sports.io",
    plan: "Free",
    dailyLimit: DEFAULT_DAILY_LIMIT,
    enabled: true,
    supportsLive: true,
    liveEndpoint: "games?live=all",
    subscriptionEnd: "2027-04-20T00:00:00+00:00",
  },
  {
    key: "mma",
    label: "MMA",
    sport: "MMA",
    baseUrl: "https://v1.mma.api-sports.io",
    plan: "Free",
    dailyLimit: DEFAULT_DAILY_LIMIT,
    enabled: true,
    supportsLive: false,
    subscriptionEnd: "2027-04-20T00:00:00+00:00",
  },
  {
    key: "nba",
    label: "NBA",
    sport: "Basketball",
    baseUrl: "https://v2.nba.api-sports.io",
    plan: "Free",
    dailyLimit: DEFAULT_DAILY_LIMIT,
    enabled: true,
    supportsLive: true,
    liveEndpoint: "games?live=all",
    subscriptionEnd: "2027-04-20T00:00:00+00:00",
  },
  {
    key: "nfl",
    label: "NFL",
    sport: "American Football",
    baseUrl: "https://v1.american-football.api-sports.io",
    plan: "Free",
    dailyLimit: DEFAULT_DAILY_LIMIT,
    enabled: true,
    supportsLive: true,
    liveEndpoint: "games?live=all",
    subscriptionEnd: "2027-04-20T00:00:00+00:00",
  },
  {
    key: "rugby",
    label: "RUGBY",
    sport: "Rugby",
    baseUrl: "https://v1.rugby.api-sports.io",
    plan: "Free",
    dailyLimit: DEFAULT_DAILY_LIMIT,
    enabled: true,
    supportsLive: true,
    liveEndpoint: "games?live=all",
    subscriptionEnd: "2027-04-20T00:00:00+00:00",
  },
  {
    key: "volleyball",
    label: "VOLLEYBALL",
    sport: "Volleyball",
    baseUrl: "https://v1.volleyball.api-sports.io",
    plan: "Free",
    dailyLimit: DEFAULT_DAILY_LIMIT,
    enabled: true,
    supportsLive: true,
    liveEndpoint: "games?live=all",
    subscriptionEnd: "2027-04-20T00:00:00+00:00",
  },
]

export function getApiSportsKey(): string {
  return (
    process.env.API_FOOTBALL_KEY ||
    process.env.API_SPORTS_KEY ||
    process.env.APISPORTS_KEY ||
    ""
  )
}

export function hasApiSportsKey(): boolean {
  return getApiSportsKey().length > 0
}

export function getDefaultApiSportsProducts(): ApiSportsProductConfig[] {
  const enabledEnv = process.env.API_SPORTS_ENABLED_PRODUCTS
  const enabled = enabledEnv
    ? new Set(enabledEnv.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean))
    : null

  return DEFAULT_PRODUCTS.map((product) => ({
    ...product,
    baseUrl: process.env[`API_SPORTS_${product.key.toUpperCase().replace(/-/g, "_")}_BASE_URL`] || product.baseUrl,
    enabled: enabled ? enabled.has(product.key) : product.enabled,
    dailyLimit: Number(process.env[`API_SPORTS_${product.key.toUpperCase().replace(/-/g, "_")}_DAILY_LIMIT`] || product.dailyLimit),
  }))
}

function getSFConfigUrl(): string | null {
  const url = (process.env.SF_API_URL || "").replace(/\/api-docs\/?$/, "").replace(/\/$/, "")
  return url || null
}

async function getStrapiApiSportsProducts(): Promise<Partial<ApiSportsProductConfig>[] | null> {
  const baseUrl = getSFConfigUrl()
  if (!baseUrl) return null
  const token = process.env.SF_API_TOKEN || ""

  return cachedProviderJson({
    provider: "strapi-provider-config",
    endpoint: "GET:/api/api-sports-products",
    ttlSeconds: 300,
    cacheNull: true,
    fetcher: async () => {
      const res = await fetch(`${baseUrl}/api/api-sports-products?pagination[pageSize]=100`, {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!res.ok) return null
      const json = await res.json()
      const rows = Array.isArray(json?.data) ? json.data : []
      return rows.map((row: any) => row.attributes ? { id: row.id, ...row.attributes } : row)
    },
  })
}

export async function getApiSportsProducts(): Promise<ApiSportsProductConfig[]> {
  const defaults = getDefaultApiSportsProducts()
  const overrides = await getStrapiApiSportsProducts()
  if (!Array.isArray(overrides) || overrides.length === 0) return defaults

  const byKey = new Map(defaults.map((product) => [product.key, product]))
  overrides.forEach((override) => {
    const key = String(override.key || "").toLowerCase() as ApiSportsProductKey
    const existing = byKey.get(key)
    if (!existing) return
    byKey.set(key, {
      ...existing,
      ...override,
      key: existing.key,
      baseUrl: String(override.baseUrl || existing.baseUrl).replace(/\/$/, ""),
      enabled: override.enabled ?? existing.enabled,
      supportsLive: override.supportsLive ?? existing.supportsLive,
      dailyLimit: Number(override.dailyLimit || existing.dailyLimit),
    })
  })

  return Array.from(byKey.values())
}

function productCacheProvider(product: ApiSportsProductConfig): string {
  return `api-sports-${product.key}`
}

function quotaAwareLiveTtl(product: ApiSportsProductConfig): number {
  if (process.env.API_SPORTS_LIVE_TTL_SECONDS) return Number(process.env.API_SPORTS_LIVE_TTL_SECONDS)
  const dailyLimit = Math.max(1, Number(product.dailyLimit || DEFAULT_DAILY_LIMIT))
  return Math.max(30, Math.ceil(86400 / dailyLimit))
}

function endpointTtl(product: ApiSportsProductConfig, endpoint: string): number {
  if (endpoint.includes("live=all")) return quotaAwareLiveTtl(product)
  if (endpoint.includes("events") || endpoint.includes("statistics")) return quotaAwareLiveTtl(product)
  if (endpoint.includes("standings")) return 900
  if (endpoint.includes("fixtures") || endpoint.includes("games")) return 300
  return 600
}

export async function apiSportsFetch(
  product: ApiSportsProductConfig,
  endpoint: string,
  init: RequestInit = {},
): Promise<any | null> {
  const key = getApiSportsKey()
  if (!key || !product.enabled) return null
  const cleanEndpoint = endpoint.replace(/^\//, "")
  const method = (init.method || "GET").toUpperCase()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  const fetcher = async () => {
    const res = await fetch(`${product.baseUrl.replace(/\/$/, "")}/${cleanEndpoint}`, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "x-apisports-key": key,
        ...(init.headers as Record<string, string> | undefined),
      },
    })
    if (!res.ok) return null
    return res.json()
  }

  try {
    if (method !== "GET") return await fetcher()
    return cachedProviderJson({
      provider: productCacheProvider(product),
      endpoint: `${method}:${cleanEndpoint}`,
      ttlSeconds: endpointTtl(product, cleanEndpoint),
      staleWhileRevalidateSeconds: cleanEndpoint.includes("live=all") ? 180 : 3600,
      fetcher,
      cacheNull: true,
    })
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function currentSeason(): number {
  const now = new Date()
  const year = now.getUTCFullYear()
  return now.getUTCMonth() + 1 >= 7 ? year : year - 1
}

function toDateTime(value: any): { dateEvent: string | null; strTime: string | null } {
  const raw =
    value?.fixture?.date ||
    value?.date?.start ||
    value?.date ||
    value?.game?.date?.date ||
    value?.game?.date ||
    value?.time ||
    null
  if (!raw) return { dateEvent: null, strTime: null }
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    const text = String(raw)
    return {
      dateEvent: /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : null,
      strTime: /\d{2}:\d{2}/.test(text) ? text.match(/\d{2}:\d{2}(?::\d{2})?/)?.[0] ?? null : null,
    }
  }
  return {
    dateEvent: date.toISOString().slice(0, 10),
    strTime: date.toISOString().slice(11, 19),
  }
}

function scoreValue(value: any): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value))) return Number(value)
  return null
}

function normaliseStatus(row: any): { progress: string | null; status: "live" | "ft" | "ns" } {
  const raw =
    row?.fixture?.status ||
    row?.status ||
    row?.game?.status ||
    row?.state ||
    {}
  const short = String(raw.short || raw.long || raw.clock || raw.timer || raw.elapsed || "").trim()
  const upper = short.toUpperCase()
  const isFinished = ["FT", "AET", "PEN", "FINISHED", "FINAL", "ENDED"].includes(upper)
  const isNotStarted = ["NS", "NOT STARTED", "SCHEDULED"].includes(upper)
  const elapsed = raw.elapsed ?? raw.timer ?? raw.clock
  return {
    progress: elapsed != null && String(elapsed).trim() !== "" ? String(elapsed) : short || null,
    status: isFinished ? "ft" : isNotStarted ? "ns" : "live",
  }
}

export function normaliseApiSportsLiveEvent(product: ApiSportsProductConfig, row: any): ApiSportsLiveEvent {
  const teams = row?.teams || {}
  const scores = row?.scores || {}
  const goals = row?.goals || {}
  const league = row?.league || {}
  const fixture = row?.fixture || {}
  const game = row?.game || {}
  const home = teams.home || row?.home || {}
  const away = teams.away || teams.visitors || row?.away || row?.visitors || {}
  const homeScore = scores.home?.total ?? scores.home?.points ?? scores.home ?? goals.home
  const awayScore = scores.away?.total ?? scores.away?.points ?? scores.visitors?.points ?? scores.visitors ?? scores.away ?? goals.away
  const status = normaliseStatus(row)
  const dateTime = toDateTime(row)

  return {
    provider: "api-sports",
    product: product.key,
    id: String(fixture.id || game.id || row.id || row.gameId || ""),
    sport: product.sport,
    league: league.name || league.name_long || row.competition?.name || product.label,
    leagueLogo: league.logo || null,
    homeTeam: home.name || home.nickname || row.homeTeam || "",
    homeLogo: home.logo || null,
    awayTeam: away.name || away.nickname || row.awayTeam || "",
    awayLogo: away.logo || null,
    homeScore: scoreValue(homeScore),
    awayScore: scoreValue(awayScore),
    progress: status.progress,
    dateEvent: dateTime.dateEvent,
    strTime: dateTime.strTime,
    status: status.status,
    raw: row,
  }
}

export async function getApiSportsLiveEvents(): Promise<ApiSportsLiveEvent[]> {
  if (!hasApiSportsKey()) return []
  const products = (await getApiSportsProducts()).filter((product) => (
    product.enabled && product.supportsLive && product.liveEndpoint
  ))
  const liveBudget = Math.max(1, Number(process.env.API_SPORTS_LIVE_PRODUCT_BUDGET || products.length))
  const selected = products.slice(0, liveBudget)

  const results = await Promise.all(
    selected.map(async (product) => {
      const data = await apiSportsFetch(product, product.liveEndpoint || "")
      const rows = Array.isArray(data?.response) ? data.response : []
      return rows.map((row: any) => normaliseApiSportsLiveEvent(product, row))
    }),
  )

  return results.flat().filter((event) => event.id && event.homeTeam && event.awayTeam)
}

export function getApiSportsLiveDetailBudget(): number {
  return DETAIL_BUDGET
}

export function footballProduct(): ApiSportsProductConfig {
  return getDefaultApiSportsProducts().find((product) => product.key === "football") || DEFAULT_PRODUCTS[0]
}

export function currentFootballSeason(): number {
  return currentSeason()
}
