import type {
  AiReferralRow,
  ConversionRow,
  PageType,
  PageTypePerformanceRow,
  StalePageRow,
  TrafficSourceType,
  VenueIntentRow,
} from "@/lib/measurement/types"
import { buildStalePageRow } from "@/lib/measurement/stale-page"

type SessionsTotalsResponse = {
  sessions?: number
  organicSessions?: number
  aiReferralSessions?: number
}

type DiscoverClicksResponse = {
  clicks?: number
}

type RawPageTypeRow = {
  pageType: PageType
  sessions: number
  organicSessions: number
  aiReferralSessions: number
  conversions: number
  avgEngagementSeconds: number
}

type RawAiReferralRow = {
  source: TrafficSourceType
  sessions: number
  engagedSessions: number
  conversions: number
  topPaths: Array<{ path: string; sessions: number }>
}

type RawConversionRow = {
  conversionType: ConversionRow["conversionType"]
  count: number
  pageType: PageType
}

type RawVenueIntentRow = {
  path: string
  city?: string
  sessions: number
  watchHereClicks: number
  venueClicks: number
  conversions: number
}

type RawFreshnessRow = {
  path: string
  pageType: PageType
  title: string
  updatedAt?: string
}

const DEFAULT_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
}

function getMeasurementBaseUrl() {
  return (
    process.env.MEASUREMENT_API_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  )
}

async function safeFetchJson<T>(path: string, fallback: T): Promise<T> {
  const baseUrl = getMeasurementBaseUrl()

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: DEFAULT_HEADERS,
      cache: "no-store",
    })

    if (!res.ok) {
      return fallback
    }

    return (await res.json()) as T
  } catch {
    return fallback
  }
}

export async function fetchOrganicAndSessionTotals(): Promise<{
  sessions: number
  organicSessions: number
  aiReferralSessions: number
}> {
  const data = await safeFetchJson<SessionsTotalsResponse>(
    "/api/internal/measurement/sessions-totals",
    {},
  )

  return {
    sessions: data.sessions ?? 0,
    organicSessions: data.organicSessions ?? 0,
    aiReferralSessions: data.aiReferralSessions ?? 0,
  }
}

export async function fetchDiscoverClicks(): Promise<number> {
  const data = await safeFetchJson<DiscoverClicksResponse>(
    "/api/internal/measurement/discover-clicks",
    {},
  )

  return data.clicks ?? 0
}

export async function fetchPageTypeRows(): Promise<PageTypePerformanceRow[]> {
  const rows = await safeFetchJson<RawPageTypeRow[]>(
    "/api/internal/measurement/page-type-performance",
    [],
  )

  return rows.map((row) => ({
    pageType: row.pageType,
    sessions: row.sessions ?? 0,
    organicSessions: row.organicSessions ?? 0,
    aiReferralSessions: row.aiReferralSessions ?? 0,
    conversions: row.conversions ?? 0,
    avgEngagementSeconds: row.avgEngagementSeconds ?? 0,
  }))
}

export async function fetchAiReferralRows(): Promise<AiReferralRow[]> {
  const rows = await safeFetchJson<RawAiReferralRow[]>(
    "/api/internal/measurement/ai-referrals",
    [],
  )

  return rows.map((row) => ({
    source: row.source,
    sessions: row.sessions ?? 0,
    engagedSessions: row.engagedSessions ?? 0,
    conversions: row.conversions ?? 0,
    topPaths: Array.isArray(row.topPaths) ? row.topPaths : [],
  }))
}

export async function fetchConversionRows(): Promise<ConversionRow[]> {
  const rows = await safeFetchJson<RawConversionRow[]>(
    "/api/internal/measurement/conversions",
    [],
  )

  return rows.map((row) => ({
    conversionType: row.conversionType,
    count: row.count ?? 0,
    pageType: row.pageType,
  }))
}

export async function fetchVenueIntentRows(): Promise<VenueIntentRow[]> {
  const rows = await safeFetchJson<RawVenueIntentRow[]>(
    "/api/internal/measurement/venue-intent",
    [],
  )

  return rows.map((row) => ({
    path: row.path,
    city: row.city,
    sessions: row.sessions ?? 0,
    watchHereClicks: row.watchHereClicks ?? 0,
    venueClicks: row.venueClicks ?? 0,
    conversions: row.conversions ?? 0,
  }))
}

export async function fetchStalePageRows(): Promise<StalePageRow[]> {
  const rows = await safeFetchJson<RawFreshnessRow[]>(
    "/api/internal/measurement/freshness",
    [],
  )

  return rows.map((row) =>
    buildStalePageRow({
      path: row.path,
      pageType: row.pageType,
      title: row.title,
      updatedAt: row.updatedAt,
    }),
  )
}
