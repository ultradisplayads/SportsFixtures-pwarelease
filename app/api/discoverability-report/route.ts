import { NextResponse } from "next/server"
import type { DiscoverabilityReportRow } from "@/lib/seo/analytics"

const SITE_URL = "https://sportsfixtures.net"

/**
 * GET /api/discoverability-report
 * Returns a report of core public routes with their indexability status.
 * Wire to a dashboard or GSC/GA4 integration.
 */
export async function GET() {
  const staticRows: DiscoverabilityReportRow[] = [
    {
      pageType: "static",
      path: "/",
      canonical: `${SITE_URL}/`,
      indexedTarget: true,
      hasSchema: true,
      hasSummaryBlock: false,
      hasFactBlock: false,
      hasFreshnessBlock: false,
      hasRelatedLinks: true,
      passesQualityGate: false,
    },
    {
      pageType: "static",
      path: "/fixtures",
      canonical: `${SITE_URL}/fixtures`,
      indexedTarget: true,
      hasSchema: false,
      hasSummaryBlock: false,
      hasFactBlock: false,
      hasFreshnessBlock: true,
      hasRelatedLinks: true,
      passesQualityGate: false,
    },
    {
      pageType: "static",
      path: "/results",
      canonical: `${SITE_URL}/results`,
      indexedTarget: true,
      hasSchema: false,
      hasSummaryBlock: false,
      hasFactBlock: false,
      hasFreshnessBlock: true,
      hasRelatedLinks: true,
      passesQualityGate: false,
    },
    {
      pageType: "static",
      path: "/venues",
      canonical: `${SITE_URL}/venues`,
      indexedTarget: true,
      hasSchema: false,
      hasSummaryBlock: false,
      hasFactBlock: false,
      hasFreshnessBlock: false,
      hasRelatedLinks: true,
      passesQualityGate: false,
    },
  ]

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    rows: staticRows,
    summary: {
      total: staticRows.length,
      passing: staticRows.filter((r) => r.passesQualityGate).length,
      failing: staticRows.filter((r) => !r.passesQualityGate).length,
    },
  })
}
