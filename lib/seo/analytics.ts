/**
 * Discoverability reporting types.
 * Wire these into your reporting dashboard or GA4 custom dimensions.
 *
 * Track separately:
 *   - classic search clicks / impressions (Google Search Console)
 *   - Discover clicks / impressions (GSC)
 *   - Bing AI citations (Bing Webmaster / AI Performance dashboard)
 *   - AI referral sessions (GA4 with source segmentation)
 *   - entity-level growth by page type
 */

export type PageType = "team" | "league" | "match" | "venue" | "article" | "tv" | "static"

export type DiscoverabilityReportRow = {
  pageType: PageType
  path: string
  canonical: string
  lastModified?: string
  indexedTarget: boolean
  hasSchema: boolean
  hasSummaryBlock: boolean
  hasFactBlock: boolean
  hasFreshnessBlock: boolean
  hasRelatedLinks: boolean
  passesQualityGate: boolean
}

/**
 * Build a report row for a given route.
 * Pass this to your reporting API or log it for QA.
 */
export function buildReportRow(args: Omit<DiscoverabilityReportRow, "passesQualityGate"> & {
  hasSummaryBlock: boolean
  hasFactBlock: boolean
  hasFreshnessBlock: boolean
  hasRelatedLinks: boolean
}): DiscoverabilityReportRow {
  const passesQualityGate =
    args.hasSummaryBlock &&
    args.hasFactBlock &&
    args.hasFreshnessBlock &&
    args.hasRelatedLinks &&
    args.hasSchema

  return { ...args, passesQualityGate }
}
