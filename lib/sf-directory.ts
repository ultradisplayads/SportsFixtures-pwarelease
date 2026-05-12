const rawUrl = process.env.SF_API_URL || process.env.NEXT_PUBLIC_SF_API_URL || "https://staging-api.sportsfixtures.net"
const SF_API_URL = rawUrl.replace(/\/api-docs\/?$/, "").replace(/\/$/, "")

export type DirectoryItem = {
  id: string
  label: string
  slug: string
  type?: "sport" | "country" | "league" | "competition"
  code?: string
  sportId?: string
  countryId?: string
  country?: string
  sport?: string
  logo?: string | null
}

const EXCLUDED_COUNTRY_SLUGS = new Set([
  "united-kingdom",
  "israel",
  "europe",
  "world",
  "worldwide",
  "international",
  "mixed",
])

const COUNTRY_CODES: Record<string, string> = {
  thailand: "TH",
  england: "gb-eng",
  scotland: "gb-sct",
  wales: "gb-wls",
  "northern-ireland": "gb-nir",
  "united-states": "US",
  usa: "US",
  spain: "ES",
  germany: "DE",
  italy: "IT",
  france: "FR",
  brazil: "BR",
  argentina: "AR",
  portugal: "PT",
  netherlands: "NL",
  "the-netherlands": "NL",
  mexico: "MX",
  india: "IN",
  japan: "JP",
  australia: "AU",
  canada: "CA",
}

function unwrap(raw: any): any {
  if (!raw || typeof raw !== "object") return raw
  return raw.attributes ? { id: raw.id, documentId: raw.documentId, ...raw.attributes } : raw
}

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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function relationId(value: any): string | undefined {
  const raw = unwrap(value?.data ?? value)
  const id = raw?.id ?? raw?.idSport ?? raw?.idLeague
  return id == null ? undefined : String(id)
}

async function sfDirectoryFetch(path: string): Promise<any> {
  const token = process.env.SF_API_TOKEN || ""
  const res = await fetch(`${SF_API_URL}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`SF directory ${res.status} for ${path}: ${body.slice(0, 180)}`)
  }

  return res.json()
}

function sortItems<T extends DirectoryItem>(items: T[]): T[] {
  return [...items].sort((a, b) => a.label.localeCompare(b.label))
}

export async function getDirectorySports(): Promise<DirectoryItem[]> {
  const data = await sfDirectoryFetch("/api/sports?pagination[pageSize]=200")
  const items = extractArray(data, "sports")
    .map(unwrap)
    .map((raw): DirectoryItem => {
      const label = raw.strSport || raw.name || raw.displayName || "Unknown Sport"
      return {
        id: String(raw.id || raw.idSport || raw.documentId || slugify(label)),
        label,
        slug: raw.slug || slugify(label),
        type: "sport",
        logo: raw.strSportIconGreen || raw.strSportThumb || raw.icon || null,
      }
    })
    .filter((item) => item.label.length > 1 && item.label !== "AAAAAA")

  return sortItems(items)
}

export async function getDirectoryCountries(): Promise<DirectoryItem[]> {
  const data = await sfDirectoryFetch("/api/countries?pagination[pageSize]=300")
  const items = extractArray(data, "countries")
    .map(unwrap)
    .map((raw): DirectoryItem => {
      const rawLabel = raw.name_en || raw.name || raw.strCountry || "Unknown Country"
      const label = rawLabel === "The Netherlands" ? "Netherlands" : rawLabel
      const rawSlug = raw.slug || slugify(label)
      const slug = rawSlug === "the-netherlands" ? "netherlands" : rawSlug
      return {
        id: String(raw.id || raw.documentId || raw.countryCode || slugify(label)),
        label,
        slug,
        type: "country",
        code: raw.countryCode || raw.iso2 || COUNTRY_CODES[slug],
        logo: raw.strFlag || raw.flag || null,
      }
    })
    .filter((item) => item.label.length > 1 && !EXCLUDED_COUNTRY_SLUGS.has(item.slug))

  return sortItems(items)
}

export async function getDirectoryLeagues(params?: {
  sportId?: string | null
  countryId?: string | null
  countryName?: string | null
  pageSize?: number
}): Promise<DirectoryItem[]> {
  const query = new URLSearchParams()
  query.set("pagination[pageSize]", String(params?.pageSize ?? 500))
  if (params?.sportId) query.set("filters[sport][id][$eq]", params.sportId)
  if (params?.countryName) query.set("filters[strCountry][$eq]", params.countryName)

  const data = await sfDirectoryFetch(`/api/leagues?${query}`)
  const items = extractArray(data, "leagues")
    .map(unwrap)
    .map((raw): DirectoryItem => {
      const label = raw.strLeague || raw.name || raw.displayName || "Unknown League"
      const sport = unwrap(raw.sport?.data ?? raw.sport)
      return {
        id: String(raw.id || raw.idLeague || raw.documentId || slugify(label)),
        label,
        slug: raw.slug || slugify(label),
        type: "league",
        sportId: relationId(raw.sport),
        countryId: relationId(raw.country),
        country: raw.strCountry || raw.country || undefined,
        sport: sport?.displayName || sport?.strSport || raw.strSport || undefined,
        logo: raw.strBadge || raw.strLogo || raw.logo || raw.leagueLogo || null,
      }
    })
    .filter((item) => item.label.length > 1 && !/^_?\s*no league/i.test(item.label))
    .filter((item) => {
      const haystack = `${item.label} ${item.country || ""}`.toLowerCase()
      return !haystack.includes("israel") && !haystack.includes("israeli")
    })
    .filter((item) => !params?.sportId || item.sportId === params.sportId)
    .filter((item) => !params?.countryName || item.country === params.countryName)

  if (items.length === 0 && params?.countryName) {
    return getDirectoryLeagues({ sportId: params.sportId, pageSize: params.pageSize })
  }

  return sortItems(items)
}

export async function getDirectoryCompetitions(params?: {
  sportId?: string | null
  countryId?: string | null
  countryName?: string | null
}): Promise<DirectoryItem[]> {
  const leagues = await getDirectoryLeagues({ ...params, pageSize: 250 })
  return leagues.map((item) => ({ ...item, type: "competition" }))
}
