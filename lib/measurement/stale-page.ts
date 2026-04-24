import type { PageType, StalePageRow } from "@/lib/measurement/types"
import { STALE_THRESHOLDS } from "@/lib/measurement/constants"

function getThreshold(pageType: PageType): number {
  switch (pageType) {
    case "article":  return STALE_THRESHOLDS.article
    case "match":    return STALE_THRESHOLDS.match
    case "results":  return STALE_THRESHOLDS.results
    case "fixtures": return STALE_THRESHOLDS.fixtures
    case "venue":    return STALE_THRESHOLDS.venue
    case "team":     return STALE_THRESHOLDS.team
    case "league":   return STALE_THRESHOLDS.league
    case "tv":       return STALE_THRESHOLDS.tv
    default:         return STALE_THRESHOLDS.other
  }
}

export function calculateAgeDays(updatedAt?: string): number | undefined {
  if (!updatedAt) return undefined
  const updated = new Date(updatedAt).getTime()
  if (Number.isNaN(updated)) return undefined
  return Math.floor((Date.now() - updated) / (1000 * 60 * 60 * 24))
}

export function calculateStaleScore(pageType: PageType, updatedAt?: string): number {
  const ageDays = calculateAgeDays(updatedAt)
  if (ageDays === undefined) return 100
  const threshold = getThreshold(pageType)
  return Math.max(0, Math.round((ageDays / threshold) * 100))
}

export function staleSeverity(score: number): "low" | "medium" | "high" {
  if (score >= 100) return "high"
  if (score >= 60)  return "medium"
  return "low"
}

export function buildStalePageRow(args: {
  path: string
  pageType: PageType
  title: string
  updatedAt?: string
}): StalePageRow {
  const ageDays   = calculateAgeDays(args.updatedAt)
  const staleScore = calculateStaleScore(args.pageType, args.updatedAt)
  return {
    path:      args.path,
    pageType:  args.pageType,
    title:     args.title,
    updatedAt: args.updatedAt,
    ageDays,
    staleScore,
    severity: staleSeverity(staleScore),
  }
}
