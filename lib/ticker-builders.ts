// lib/ticker-builders.ts
// Section 15.B — Convenience re-export of all TickerItem builder functions.
//
// Consumers that need multiple builder types can import from this single module
// instead of reaching into ticker-live.ts and ticker-news.ts individually.
// The canonical implementations remain in their originating modules.

export {
  buildLiveScoreItem,
  buildLiveScoreItems,
  buildKickoffItem,
  buildResultItems,
  type RawLiveEvent,
} from "@/lib/ticker-live"

export {
  buildBreakingNewsItems,
  buildTvNowItems,
  buildPromoItem,
  buildVenueMessageItem,
  type RawNewsArticle,
  type RawTvListing,
} from "@/lib/ticker-news"

// ── Canonical builder name aliases per Section 15.B spec ─────────────────────
// New code should import these names. The originating functions above remain
// available for backward compatibility.

import { buildLiveScoreItem } from "@/lib/ticker-live"
import { buildBreakingNewsItems, buildTvNowItems, buildPromoItem, buildVenueMessageItem } from "@/lib/ticker-news"
import type { TickerItem } from "@/types/ticker"

/** Single live-score item builder (canonical name). */
export const buildLiveScoreTickerItem = buildLiveScoreItem

/** Single breaking-news item builder (canonical name). */
export function buildBreakingNewsTickerItem(article: Parameters<typeof buildBreakingNewsItems>[0][0]): TickerItem {
  return buildBreakingNewsItems([article])[0]
}

/** Single TV-now item builder (canonical name). */
export function buildTvNowTickerItem(listing: Parameters<typeof buildTvNowItems>[0][0]): TickerItem {
  return buildTvNowItems([listing])[0]
}

/** Promo item builder (canonical name — direct alias). */
export const buildPromoTickerItem = buildPromoItem

/** Venue-message item builder (canonical name — direct alias). */
export const buildVenueMessageTickerItem = buildVenueMessageItem

/** Sponsor item builder — creates a sponsor disclosure item from a plain object. */
export function buildSponsorTickerItem(opts: {
  id: string
  headline: string
  subline?: string
  href?: string
  sport?: string
  expiresAt?: string
}): TickerItem {
  return {
    id:          opts.id,
    type:        "sponsor",
    channel:     "secondary",
    priority:    "low",
    freshness:   "static",
    source:      "editorial",
    headline:    opts.headline,
    subline:     opts.subline,
    href:        opts.href,
    sport:       opts.sport,
    expiresAt:   opts.expiresAt,
    disclosure:  "sponsored",
  }
}
