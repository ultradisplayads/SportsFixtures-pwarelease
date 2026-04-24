// lib/ticker-score-formatter.ts
// Section 15 — Ticker Score Formatting
//
// All display-layer formatting for ticker items lives here.
// Components must never reformat raw data — they receive pre-formatted strings.

import type { TickerItem, TickerItemType } from "@/types/ticker"

/**
 * Formats a score pair for compact ticker display.
 * Returns null if both scores are undefined/null (pre-match).
 */
export function formatTickerScore(
  home: string | number | null | undefined,
  away: string | number | null | undefined,
): string | null {
  if (home == null && away == null) return null
  const h = home ?? "0"
  const a = away ?? "0"
  return `${h} - ${a}`
}

/**
 * Formats a live minute for the ticker badge.
 * Returns uppercase canonical form: "45", "HT", "90+", "FT", "LIVE"
 */
export function formatTickerMinute(
  minute: string | null | undefined,
  type: TickerItemType,
): string {
  if (type === "result") return "FT"
  if (type === "kickoff") return "KO"
  if (!minute) return "LIVE"

  const upper = minute.toUpperCase().trim()
  if (upper === "HT" || upper === "HALFTIME") return "HT"
  if (upper === "FT" || upper === "FULLTIME") return "FT"
  return upper
}

/**
 * Builds a compact ticker headline from team names and an optional score.
 * Examples:
 *   "Arsenal 2 - 1 Chelsea" (live/result)
 *   "Arsenal vs Chelsea" (kickoff — no score yet)
 */
export function formatTickerHeadline(
  homeTeam: string | null | undefined,
  awayTeam: string | null | undefined,
  homeScore: string | number | null | undefined,
  awayScore: string | number | null | undefined,
  type: TickerItemType,
): string {
  const home = homeTeam ?? "Home"
  const away = awayTeam ?? "Away"

  if (type === "kickoff" || (homeScore == null && awayScore == null)) {
    return `${home} vs ${away}`
  }

  const score = formatTickerScore(homeScore, awayScore)
  return `${home} ${score} ${away}`
}

/**
 * Returns the correct CSS class string for the status badge background.
 * All badge colours are expressed as Tailwind utilities so they are
 * statically discoverable and tree-shakeable.
 */
export function tickerMinuteBadgeClass(
  minute: string | null | undefined,
  type: TickerItemType,
): string {
  if (type === "result") return "bg-destructive text-destructive-foreground"
  if (type === "kickoff") return "bg-muted text-muted-foreground"

  const fmt = formatTickerMinute(minute, type)
  if (fmt === "HT") return "bg-yellow-500 text-white"
  if (fmt === "FT") return "bg-destructive text-destructive-foreground"
  return "bg-green-600 text-white"
}
