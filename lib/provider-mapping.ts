// lib/provider-mapping.ts
// Explicit, canonical ownership table for every data class in the SF PWA.
//
// Rules:
//  - provider precedence is declared here, not guessed page by page
//  - the frontend must never read this directly — it is service-layer only
//  - when a primary provider returns partial data, the service layer consults
//    this table to decide whether to attempt the fallback
//  - null fallback means no alternative is available — return empty/unavailable

import type { ProviderName } from "@/types/contracts";

export type ProviderEntry = {
  primary: ProviderName;
  fallback: ProviderName | null;
  notes?: string;
};

// ── Canonical ownership table ─────────────────────────────────────────────

export const PROVIDER_RESPONSIBILITY = {
  // Match data
  fixtures: {
    primary: "api-sports",
    fallback: "thesportsdb",
    notes: "api-sports is canonical for fixtures; TSDB used when api-sports key absent",
  },
  results: {
    primary: "api-sports",
    fallback: "thesportsdb",
    notes: "api-sports for completed match results; TSDB fallback",
  },
  live_scores: {
    primary: "api-sports",
    fallback: "thesportsdb",
    notes: "SF backend proxies api-sports live data; TSDB v2 is secondary",
  },
  lineups: {
    primary: "api-sports",
    fallback: "thesportsdb",
    notes: "api-sports lineup data; TSDB has limited lineup support",
  },
  timeline: {
    primary: "api-sports",
    fallback: "thesportsdb",
    notes: "api-sports events timeline (goals, cards, subs)",
  },
  stats: {
    primary: "api-sports",
    fallback: "thesportsdb",
    notes: "api-sports match stats (shots, possession, etc.)",
  },
  standings: {
    primary: "api-sports",
    fallback: "thesportsdb",
    notes: "api-sports league tables; TSDB as fallback",
  },
  head_to_head: {
    primary: "api-sports",
    fallback: "thesportsdb",
    notes: "h2h history; TSDB filtered past events used as fallback",
  },
  predictions: {
    primary: "api-sports",
    fallback: null,
    notes: "api-sports predictions endpoint only; no TSDB equivalent",
  },
  injuries: {
    primary: "api-sports",
    fallback: null,
    notes: "api-sports injuries/suspensions only",
  },

  // Broadcast / media
  tv: {
    primary: "thesportsdb",
    fallback: null,
    notes: "TSDB is the sole TV listings provider currently",
  },
  highlights: {
    primary: "thesportsdb",
    fallback: null,
    notes: "TSDB strVideo/strHighlight fields only",
  },

  // Content / editorial
  news: {
    primary: "strapi",
    fallback: null,
    notes: "SF Strapi CMS is the sole news source",
  },
  editorial_modules: {
    primary: "strapi",
    fallback: null,
    notes: "Homepage module config, ticker config, promo slots — Strapi only",
  },
  ads: {
    primary: "strapi",
    fallback: null,
    notes: "Ad creatives served from Strapi; no external ad server currently",
  },

  // Venues
  venue_enrichment: {
    primary: "strapi",
    fallback: "thesportsdb",
    notes: "SF Strapi venue records are canonical; TSDB strVenue used for name/geo fallback",
  },
  venue_discovery: {
    primary: "strapi",
    fallback: null,
    notes: "Geo-proximity venue discovery is Strapi-only",
  },

  // Reference data
  sports_reference: {
    primary: "strapi",
    fallback: "thesportsdb",
    notes: "Sports list from Strapi; TSDB as fallback for unknown sports",
  },
  countries_reference: {
    primary: "strapi",
    fallback: "thesportsdb",
    notes: "Country list from Strapi; TSDB as enrichment fallback",
  },
  leagues_reference: {
    primary: "strapi",
    fallback: "thesportsdb",
    notes: "League list from Strapi with idLeague cross-reference to TSDB",
  },
  teams_reference: {
    primary: "strapi",
    fallback: "thesportsdb",
    notes: "Team detail from Strapi; TSDB lookupteam as fallback",
  },

  // Account / entitlements
  entitlements: {
    primary: "strapi",
    fallback: "internal",
    notes: "Strapi user record drives entitlements; internal device-local fallback when unauthenticated",
  },
  account: {
    primary: "strapi",
    fallback: null,
    notes: "Account data exclusively from Strapi /users/me",
  },
} as const;

export type DataClass = keyof typeof PROVIDER_RESPONSIBILITY;

// ── Lookup helpers ────────────────────────────────────────────────────────

/** Return the primary provider for a data class. */
export function getPrimaryProvider(dataClass: DataClass): ProviderName {
  return PROVIDER_RESPONSIBILITY[dataClass].primary;
}

/** Return the fallback provider for a data class, or null if none. */
export function getFallbackProvider(dataClass: DataClass): ProviderName | null {
  return PROVIDER_RESPONSIBILITY[dataClass].fallback;
}

/** Return true if this data class has a fallback provider. */
export function hasFallback(dataClass: DataClass): boolean {
  return PROVIDER_RESPONSIBILITY[dataClass].fallback !== null;
}

/**
 * Return the canonical ProviderName to use as the envelope `source` field
 * when a given provider was the one that actually served data.
 */
export function resolveEnvelopeSource(
  dataClass: DataClass,
  usedFallback = false,
): ProviderName {
  if (usedFallback) {
    return PROVIDER_RESPONSIBILITY[dataClass].fallback ?? "internal";
  }
  return PROVIDER_RESPONSIBILITY[dataClass].primary;
}
