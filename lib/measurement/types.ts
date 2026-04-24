export type PageType =
  | "home"
  | "team"
  | "league"
  | "match"
  | "venue"
  | "article"
  | "tv"
  | "fixtures"
  | "results"
  | "search"
  | "other"

export type TrafficSourceType =
  | "organic_search"
  | "discover"
  | "chatgpt"
  | "bing_ai"
  | "gemini"
  | "direct"
  | "referral"
  | "social"
  | "unknown"

export type ConversionType =
  | "venue_click"
  | "venue_signup"
  | "promoted_listing_click"
  | "watch_here_click"
  | "alert_signup"
  | "favorite_add"
  | "app_install"
  | "other"

export type MeasurementOverview = {
  dateRange: string
  sessions: number
  organicSessions: number
  aiReferralSessions: number
  discoverClicks: number
  conversions: number
  venueIntentSessions: number
  stalePages: number
}

export type PageTypePerformanceRow = {
  pageType: PageType
  sessions: number
  organicSessions: number
  aiReferralSessions: number
  conversions: number
  avgEngagementSeconds: number
}

export type AiReferralRow = {
  source: TrafficSourceType
  sessions: number
  engagedSessions: number
  conversions: number
  topPaths: Array<{ path: string; sessions: number }>
}

export type ConversionRow = {
  conversionType: ConversionType
  count: number
  pageType: PageType
}

export type VenueIntentRow = {
  path: string
  city?: string
  sessions: number
  watchHereClicks: number
  venueClicks: number
  conversions: number
}

export type StalePageRow = {
  path: string
  pageType: PageType
  title: string
  updatedAt?: string
  ageDays?: number
  staleScore: number
  severity: "low" | "medium" | "high"
}
