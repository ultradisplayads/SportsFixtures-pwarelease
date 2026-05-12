"use client"

import Link from "next/link"
import { useEffect } from "react"
import { CalendarDays, Globe2, MapPin, Shield, Tag, Trophy, User, Users } from "lucide-react"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { SmartLogo } from "@/components/assets/smart-logo"
import { SmartAvatar } from "@/components/assets/smart-avatar"
import { analytics } from "@/lib/analytics"
import type { GlobalSearchResults } from "@/app/actions/global-search"

interface SearchResultsProps {
  teams: any[]
  players: any[]
  global: GlobalSearchResults
  query: string
}

function resultTotal(global: GlobalSearchResults, teams: any[], players: any[]) {
  return teams.length + players.length + global.sports.length + global.countries.length + global.leagues.length + global.events.length + global.venues.length + global.offers.length
}

function Section({
  icon,
  title,
  count,
  children,
}: {
  icon: React.ReactNode
  title: string
  count: number
  children: React.ReactNode
}) {
  if (count === 0) return null
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h2 className="text-base font-bold">{title} ({count})</h2>
      </div>
      {children}
    </div>
  )
}

export function SearchResults({ teams, players, global, query }: SearchResultsProps) {
  const total = resultTotal(global, teams, players)
  const hasResults = total > 0

  useEffect(() => {
    analytics.search(query, total, "search_results")
  }, [query, total])

  if (!hasResults) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="text-lg font-semibold">No results found</p>
        <p className="mt-2 text-sm text-muted-foreground">Try a different search term</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <Section icon={<Trophy className="h-5 w-5" />} title="Sports" count={global.sports.length}>
        <div className="grid grid-cols-2 gap-2">
          {global.sports.map((sport) => (
            <Link
              key={String(sport.id)}
              href={`/fixtures?sport=${encodeURIComponent(sport.slug || sport.name || "")}`}
              onClick={() => triggerHaptic("light")}
              className="rounded-lg border border-border bg-card p-3 hover:bg-accent"
            >
              <div className="font-semibold">{sport.name || sport.strSport}</div>
              <div className="text-xs text-muted-foreground">Sport</div>
            </Link>
          ))}
        </div>
      </Section>

      <Section icon={<Globe2 className="h-5 w-5" />} title="Countries" count={global.countries.length}>
        <div className="grid grid-cols-2 gap-2">
          {global.countries.map((country) => (
            <Link
              key={String(country.id)}
              href={`/fixtures?country=${encodeURIComponent(country.slug || country.name || "")}`}
              onClick={() => triggerHaptic("light")}
              className="rounded-lg border border-border bg-card p-3 hover:bg-accent"
            >
              <div className="font-semibold">{country.name || country.strCountry}</div>
              <div className="text-xs text-muted-foreground">{country.countryCode || "Country"}</div>
            </Link>
          ))}
        </div>
      </Section>

      <Section icon={<Shield className="h-5 w-5" />} title="Leagues & Competitions" count={global.leagues.length}>
        <div className="space-y-2">
          {global.leagues.map((league) => (
            <Link
              key={String(league.id)}
              href={`/league/${league.idLeague || league.id}`}
              onClick={() => triggerHaptic("light")}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-accent"
            >
              <SmartLogo
                name={league.name || league.strLeague || "League"}
                src={league.logo || league.strBadge || null}
                className="h-10 w-10 object-contain"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{league.name || league.strLeague}</div>
                <div className="text-sm text-muted-foreground">{league.country?.name || league.sport?.name || "Competition"}</div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section icon={<CalendarDays className="h-5 w-5" />} title="Events" count={global.events.length}>
        <div className="space-y-2">
          {global.events.map((event) => (
            <Link
              key={String(event.id)}
              href={`/match/${event.idEvent || event.id}`}
              onClick={() => triggerHaptic("light")}
              className="rounded-lg border border-border bg-card p-3 hover:bg-accent"
            >
              <div className="font-semibold">{event.strEvent || event.name || `${event.strHomeTeam} vs ${event.strAwayTeam}`}</div>
              <div className="text-sm text-muted-foreground">{event.strLeague || event.league?.name || "Event"}</div>
              <div className="text-xs text-muted-foreground">{event.dateEvent || ""} {event.strTime || ""}</div>
            </Link>
          ))}
        </div>
      </Section>

      <Section icon={<MapPin className="h-5 w-5" />} title="Venues" count={global.venues.length}>
        <div className="space-y-2">
          {global.venues.map((venue) => (
            <Link
              key={String(venue.id)}
              href={`/venues/${venue.id}`}
              onClick={() => triggerHaptic("light")}
              className="rounded-lg border border-border bg-card p-3 hover:bg-accent"
            >
              <div className="font-semibold">{venue.name || venue.strVenue}</div>
              <div className="text-sm text-muted-foreground">{[venue.city, venue.country].filter(Boolean).join(", ") || venue.address}</div>
            </Link>
          ))}
        </div>
      </Section>

      <Section icon={<Tag className="h-5 w-5" />} title="Offers" count={global.offers.length}>
        <div className="space-y-2">
          {global.offers.map((offer) => (
            <Link
              key={String(offer.id)}
              href={offer.url}
              onClick={() => triggerHaptic("light")}
              className="rounded-lg border border-border bg-card p-3 hover:bg-accent"
            >
              <div className="font-semibold">{offer.headline}</div>
              <div className="text-sm text-muted-foreground">{offer.sub}</div>
              <div className="mt-1 text-xs font-semibold text-primary">{offer.badgeLabel}</div>
            </Link>
          ))}
        </div>
      </Section>

      {teams.length > 0 && (
        <Section icon={<Users className="h-5 w-5" />} title="Teams" count={teams.length}>
          <div className="space-y-2">
            {teams.map((team) => (
              <Link
                key={team.idTeam}
                href={`/team/${team.idTeam}`}
                onClick={() => triggerHaptic("light")}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-accent"
              >
                <SmartLogo
                  name={team.strTeam}
                  src={team.strTeamBadge || null}
                  className="h-12 w-12 object-contain"
                />
                <div className="flex-1">
                  <div className="font-semibold">{team.strTeam}</div>
                  <div className="text-sm text-muted-foreground">{team.strLeague}</div>
                  {team.strStadium && <div className="text-xs text-muted-foreground">{team.strStadium}</div>}
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {players.length > 0 && (
        <Section icon={<User className="h-5 w-5" />} title="Players" count={players.length}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {players.map((player) => (
              <Link
                key={player.idPlayer}
                href={`/player/${player.idPlayer}`}
                onClick={() => triggerHaptic("light")}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-accent"
              >
                <SmartAvatar
                  name={player.strPlayer}
                  variant="player"
                  src={player.strThumb || null}
                  candidates={[player.strCutout]}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="flex-1 overflow-hidden">
                  <div className="truncate font-semibold">{player.strPlayer}</div>
                  <div className="text-sm text-muted-foreground">{player.strPosition}</div>
                  <div className="text-xs text-muted-foreground">{player.strTeam}</div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}
