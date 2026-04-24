import type {
  AiReferralRow,
  ConversionRow,
  MeasurementOverview,
  PageTypePerformanceRow,
  StalePageRow,
  VenueIntentRow,
} from "@/lib/measurement/types"
import { buildStalePageRow } from "@/lib/measurement/stale-page"

export const mockOverview: MeasurementOverview = {
  dateRange: "Last 30 days",
  sessions: 128430,
  organicSessions: 74120,
  aiReferralSessions: 8420,
  discoverClicks: 11600,
  conversions: 5310,
  venueIntentSessions: 18440,
  stalePages: 34,
}

export const mockPageTypePerformance: PageTypePerformanceRow[] = [
  { pageType: "match",  sessions: 36100, organicSessions: 22000, aiReferralSessions: 2200, conversions: 1320, avgEngagementSeconds: 87 },
  { pageType: "team",   sessions: 20440, organicSessions: 14100, aiReferralSessions: 1600, conversions: 640,  avgEngagementSeconds: 74 },
  { pageType: "league", sessions: 18220, organicSessions: 12110, aiReferralSessions: 910,  conversions: 510,  avgEngagementSeconds: 69 },
  { pageType: "venue",  sessions: 15410, organicSessions: 8210,  aiReferralSessions: 1240, conversions: 1460, avgEngagementSeconds: 93 },
  { pageType: "article",sessions: 10220, organicSessions: 4130,  aiReferralSessions: 1710, conversions: 180,  avgEngagementSeconds: 81 },
  { pageType: "tv",     sessions: 9120,  organicSessions: 5440,  aiReferralSessions: 550,  conversions: 730,  avgEngagementSeconds: 58 },
]

export const mockAiReferrals: AiReferralRow[] = [
  {
    source: "chatgpt",
    sessions: 4180,
    engagedSessions: 2810,
    conversions: 310,
    topPaths: [
      { path: "/match/88421",    sessions: 540 },
      { path: "/venues/144",     sessions: 430 },
      { path: "/team/133604",    sessions: 400 },
    ],
  },
  {
    source: "bing_ai",
    sessions: 2670,
    engagedSessions: 1890,
    conversions: 220,
    topPaths: [
      { path: "/match/88421",                    sessions: 300 },
      { path: "/news/celtic-vs-rangers-preview", sessions: 250 },
      { path: "/tv",                             sessions: 200 },
    ],
  },
  {
    source: "gemini",
    sessions: 1570,
    engagedSessions: 920,
    conversions: 110,
    topPaths: [
      { path: "/team/133604",  sessions: 220 },
      { path: "/league/4328",  sessions: 180 },
      { path: "/venues/144",   sessions: 130 },
    ],
  },
]

export const mockConversions: ConversionRow[] = [
  { conversionType: "venue_click",       count: 2140, pageType: "venue" },
  { conversionType: "watch_here_click",  count: 1260, pageType: "match" },
  { conversionType: "alert_signup",      count: 940,  pageType: "team"  },
  { conversionType: "favorite_add",      count: 720,  pageType: "league" },
  { conversionType: "venue_signup",      count: 180,  pageType: "venue" },
  { conversionType: "app_install",       count: 70,   pageType: "home"  },
]

export const mockVenueIntent: VenueIntentRow[] = [
  { path: "/venues/144", city: "Pattaya", sessions: 1820, watchHereClicks: 310, venueClicks: 460, conversions: 94 },
  { path: "/venues/221", city: "Bangkok", sessions: 1330, watchHereClicks: 220, venueClicks: 370, conversions: 72 },
  { path: "/venues/301", city: "Pattaya", sessions: 1010, watchHereClicks: 180, venueClicks: 220, conversions: 44 },
]

export const mockStalePages: StalePageRow[] = [
  buildStalePageRow({ path: "/news/old-transfer-rumours", pageType: "article", title: "Old transfer rumours", updatedAt: "2026-03-15T00:00:00.000Z" }),
  buildStalePageRow({ path: "/venues/301",                pageType: "venue",   title: "Venue 301",           updatedAt: "2025-12-20T00:00:00.000Z" }),
  buildStalePageRow({ path: "/team/14512",                pageType: "team",    title: "Team 14512",          updatedAt: "2026-02-01T00:00:00.000Z" }),
]
