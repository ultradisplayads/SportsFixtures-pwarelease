// lib/ticker-news.ts
// Section 15 — News + TV to ticker item bridge.
//
// Maps raw news articles and TV listing shapes to TickerItem.
// The ticker feed route calls these instead of inlining logic.

import type { TickerItem } from "@/types/ticker"

// Raw article shape from /api/news or TheSportsDB news endpoint
export interface RawNewsArticle {
  id?: string | number
  title?: string
  strTitle?: string
  url?: string
  strUrl?: string
  publishedAt?: string
  strPublished?: string
  source?: string
  strSource?: string
  leagueId?: string
  sport?: string
}

// Raw TV listing shape
export interface RawTvListing {
  id?: string | number
  title?: string
  channelName?: string
  startsAt?: string
  matchId?: string
  matchHref?: string
  sport?: string
  leagueId?: string
}

/**
 * Converts a raw news article to a TickerItem with type "breaking_news".
 * Returns null if the article has no usable title.
 */
export function buildBreakingNewsItem(raw: RawNewsArticle): TickerItem | null {
  const title = raw.title ?? raw.strTitle ?? null
  if (!title?.trim()) return null

  const id = String(raw.id ?? Math.random().toString(36).slice(2))
  const href = raw.url ?? raw.strUrl ?? "/news"

  return {
    id: `news_${id}`,
    type: "breaking_news",
    channel: "secondary",
    priority: "high",
    freshness: "updated",
    headline: title.trim(),
    label: raw.source ?? raw.strSource ?? undefined,
    href,
    source: "news",
    sport: raw.sport?.toLowerCase() ?? undefined,
    competitionId: raw.leagueId ?? undefined,
    startsAt: raw.publishedAt ?? raw.strPublished ?? undefined,
    featured: false,
  }
}

/**
 * Batch-converts raw articles, deduplicating by href.
 */
export function buildBreakingNewsItems(raws: RawNewsArticle[]): TickerItem[] {
  const seenHrefs = new Set<string>()
  return raws
    .map(buildBreakingNewsItem)
    .filter((item): item is TickerItem => {
      if (!item) return false
      const key = item.href ?? item.id
      if (seenHrefs.has(key)) return false
      seenHrefs.add(key)
      return true
    })
}

/**
 * Converts a raw TV listing to a TickerItem with type "tv_now".
 */
export function buildTvNowItem(raw: RawTvListing): TickerItem | null {
  const title = raw.title ?? null
  const channel = raw.channelName ?? null
  if (!title?.trim() && !channel) return null

  const id = String(raw.id ?? Math.random().toString(36).slice(2))
  const headline = title?.trim() ?? channel ?? "Watching now"
  const label = channel ?? undefined

  return {
    id: `tv_${id}`,
    type: "tv_now",
    channel: "secondary",
    priority: "normal",
    freshness: "live",
    headline,
    label,
    subline: raw.startsAt
      ? new Date(raw.startsAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
      : undefined,
    href: raw.matchHref ?? (raw.matchId ? `/match/${raw.matchId}` : undefined),
    source: "tv",
    sport: raw.sport?.toLowerCase() ?? undefined,
    competitionId: raw.leagueId ?? undefined,
    startsAt: raw.startsAt ?? undefined,
    featured: false,
  }
}

export function buildTvNowItems(raws: RawTvListing[]): TickerItem[] {
  return raws
    .map(buildTvNowItem)
    .filter((item): item is TickerItem => item !== null)
}

/**
 * Builds a promotional ticker item (e.g. editorial callout, feature promo).
 * Always secondary channel, low priority, static freshness.
 */
export function buildPromoItem(opts: {
  id: string
  headline: string
  subline?: string
  href?: string
  sport?: string
  expiresAt?: string
}): TickerItem {
  return {
    id:        `promo_${opts.id}`,
    type:      "promo",
    channel:   "secondary",
    priority:  "low",
    freshness: "static",
    source:    "editorial",
    headline:  opts.headline,
    subline:   opts.subline,
    href:      opts.href,
    sport:     opts.sport,
    expiresAt: opts.expiresAt,
    featured:  false,
  }
}

/**
 * Builds a venue-message ticker item (e.g. sports bar is showing X).
 * Always secondary channel, normal priority, cached freshness.
 */
export function buildVenueMessageItem(opts: {
  id: string
  venueName: string
  headline: string
  subline?: string
  href?: string
  sport?: string
}): TickerItem {
  return {
    id:        `venue_${opts.id}`,
    type:      "venue_message",
    channel:   "secondary",
    priority:  "normal",
    freshness: "stale",
    source:    "editorial",
    label:     opts.venueName,
    headline:  opts.headline,
    subline:   opts.subline,
    href:      opts.href,
    sport:     opts.sport,
    featured:  false,
  }
}
