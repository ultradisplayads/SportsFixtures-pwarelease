// app/api/provider-matrix/route.ts
// Section 13 — Provider Matrix debug/admin endpoint.
//
// Returns the full provider routing decisions for a given sport and optional
// competition. Used by developer tooling and the ProviderNote debug component.
//
// Security: only accessible in development or when COVERAGE_DEBUG_ENABLED=1.

import { NextResponse } from "next/server"
import { routeProvider, type ProviderFeature } from "@/lib/provider-routing"
import { deriveSportKey } from "@/lib/coverage-resolver"

const ALL_FEATURES: ProviderFeature[] = [
  "event_detail", "lineups", "timeline", "stats", "standings",
  "tv", "highlights", "live_scores", "ticker_feed", "breaking_news",
  "tv_now", "match_events", "h2h", "insights",
  "push_notifications", "venue_discovery",
]

export async function GET(request: Request) {
  const isDev = process.env.NODE_ENV === "development"
  const debugEnabled = process.env.COVERAGE_DEBUG_ENABLED === "1"

  if (!isDev && !debugEnabled) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const rawSport = searchParams.get("sport")
  const competitionId = searchParams.get("competitionId") ?? null

  if (!rawSport) {
    return NextResponse.json(
      { error: "Missing required query param: sport" },
      { status: 400 },
    )
  }

  const sportKey = deriveSportKey(rawSport)

  const matrix = Object.fromEntries(
    ALL_FEATURES.map((feature) => [
      feature,
      routeProvider(feature, sportKey, competitionId),
    ]),
  )

  return NextResponse.json({
    sportKey,
    rawSport,
    competitionId,
    matrix,
    generatedAt: new Date().toISOString(),
  })
}
