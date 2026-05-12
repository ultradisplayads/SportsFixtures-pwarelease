"use server"

import {
  getSFCountries,
  getSFEvents,
  getSFLeagues,
  getSFSports,
  getSFVenues,
  type SFCountry,
  type SFEvent,
  type SFLeague,
  type SFSport,
  type SFVenue,
} from "@/lib/sf-api"
import { fetchStrapiAds, type StrapiAdSlot } from "@/lib/strapi-ads"

export interface GlobalSearchResults {
  sports: SFSport[]
  countries: SFCountry[]
  leagues: SFLeague[]
  events: SFEvent[]
  venues: SFVenue[]
  offers: StrapiAdSlot[]
}

function text(value: unknown): string {
  return String(value || "").toLowerCase()
}

function matches(query: string, ...values: unknown[]): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return false
  return values.some((value) => text(value).includes(needle))
}

export async function globalSearch(query: string): Promise<GlobalSearchResults> {
  const q = query.trim()
  if (q.length < 2) {
    return { sports: [], countries: [], leagues: [], events: [], venues: [], offers: [] }
  }

  const [sports, countries, leagues, events, venues, offers] = await Promise.all([
    getSFSports().catch(() => []),
    getSFCountries().catch(() => []),
    getSFLeagues().catch(() => []),
    getSFEvents({ limit: 80 }).catch(() => []),
    getSFVenues({}).catch(() => []),
    fetchStrapiAds().catch(() => []),
  ])

  return {
    sports: sports
      .filter((sport) => matches(q, sport.name, sport.strSport, sport.slug))
      .slice(0, 8),
    countries: countries
      .filter((country) => matches(q, country.name, country.strCountry, country.slug, country.countryCode))
      .slice(0, 8),
    leagues: leagues
      .filter((league) => matches(q, league.name, league.strLeague, league.slug, league.country?.name, league.sport?.name))
      .slice(0, 12),
    events: events
      .filter((event) =>
        matches(
          q,
          event.name,
          event.strEvent,
          event.strHomeTeam,
          event.strAwayTeam,
          event.strLeague,
          event.league?.name,
          event.strVenue,
        ),
      )
      .slice(0, 12),
    venues: venues
      .filter((venue) => matches(q, venue.name, venue.strVenue, venue.address, venue.city, venue.country, venue.sports?.join(" ")))
      .slice(0, 8),
    offers: offers
      .filter((offer) => matches(q, offer.headline, offer.sub, offer.badgeLabel, offer.placement, offer.ctaLabel))
      .slice(0, 8),
  }
}
