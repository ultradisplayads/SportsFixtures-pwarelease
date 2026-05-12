"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ChevronRight, Search, Trophy, X } from "lucide-react"
import { LiveTicker } from "@/components/live-ticker"
import { HeaderMenu } from "@/components/header-menu"
import { SearchBar } from "@/components/search-bar"
import { BottomNav } from "@/components/bottom-nav"
import { analytics } from "@/lib/analytics"

type Competition = {
  id: string
  label: string
  slug: string
  sport?: string
  country?: string
}

const FEATURED_ORDER = [
  "uefa-champions-league",
  "english-premier-league",
  "spanish-la-liga",
  "german-bundesliga",
  "italian-serie-a",
  "french-ligue-1",
  "nba",
  "nfl",
  "indian-premier-league",
  "american-major-league-soccer",
  "nhl",
]

const SHORT_LABELS: Record<string, string> = {
  "uefa-champions-league": "Champions League",
  "english-premier-league": "Premier League",
  "spanish-la-liga": "La Liga",
  "german-bundesliga": "Bundesliga",
  "italian-serie-a": "Serie A",
  "french-ligue-1": "Ligue 1",
  "indian-premier-league": "IPL",
  "american-major-league-soccer": "MLS",
}

function labelFor(item: Competition): string {
  return SHORT_LABELS[item.slug] || item.label
}

function sortCompetitions(items: Competition[]): Competition[] {
  return [...items].sort((a, b) => {
    const aIndex = FEATURED_ORDER.indexOf(a.slug)
    const bIndex = FEATURED_ORDER.indexOf(b.slug)
    if (aIndex !== -1 || bIndex !== -1) {
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    }
    return a.label.localeCompare(b.label)
  })
}

function searchText(item: Competition): string {
  return [labelFor(item), item.label, item.slug, item.sport, item.country]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

function uniqueValues(items: Competition[], key: "sport" | "country"): string[] {
  return Array.from(new Set(items.map((item) => item[key]).filter(Boolean) as string[]))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 8)
}

export default function StandingsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [sportFilter, setSportFilter] = useState<string | null>(null)
  const [countryFilter, setCountryFilter] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch("/api/competitions")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setCompetitions(Array.isArray(data.competitions) ? data.competitions : [])
        }
      })
      .catch((error) => console.error("[StandingsPage] Failed to load competitions", error))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const sorted = useMemo(() => sortCompetitions(competitions), [competitions])
  const sports = useMemo(() => uniqueValues(sorted, "sport"), [sorted])
  const countries = useMemo(() => uniqueValues(sorted, "country"), [sorted])
  const filtered = useMemo(() => {
    const words = query
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)

    return sorted.filter((item) => {
      if (sportFilter && item.sport !== sportFilter) return false
      if (countryFilter && item.country !== countryFilter) return false
      if (words.length === 0) return true

      const haystack = searchText(item)
      return words.every((word) => haystack.includes(word))
    })
  }, [countryFilter, query, sorted, sportFilter])

  const hasActiveSearch = query.trim().length > 0 || sportFilter || countryFilter
  const featured = hasActiveSearch
    ? filtered
    : filtered.filter((item) => FEATURED_ORDER.includes(item.slug)).slice(0, 12)
  const rest = hasActiveSearch
    ? []
    : filtered.filter((item) => !FEATURED_ORDER.includes(item.slug)).slice(0, 80)

  useEffect(() => {
    const cleanQuery = query.trim()
    if (!cleanQuery) return

    const timeout = window.setTimeout(() => {
      analytics.standingsSearch(cleanQuery, filtered.length, {
        sportFilter: sportFilter || null,
        countryFilter: countryFilter || null,
      })
    }, 600)

    return () => window.clearTimeout(timeout)
  }, [countryFilter, filtered.length, query, sportFilter])

  const handleSportFilter = (sport: string) => {
    const next = sportFilter === sport ? null : sport
    setSportFilter(next)
    analytics.filter("sport", next, "standings", filtered.length)
  }

  const handleCountryFilter = (country: string) => {
    const next = countryFilter === country ? null : country
    setCountryFilter(next)
    analytics.filter("country", next, "standings", filtered.length)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <LiveTicker />
      <HeaderMenu />
      <SearchBar />

      <main className="flex-1">
        <section className="border-b border-border bg-card px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Tables & Standings</h1>
              <p className="text-xs text-muted-foreground">League tables for major competitions</p>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background px-3 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tables, leagues, sports, countries..."
              className="h-11 w-full rounded-lg border border-border bg-card px-10 pr-11 text-sm font-medium outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              type="search"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Clear standings search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                setSportFilter(null)
                setCountryFilter(null)
                analytics.filter("all", null, "standings", filtered.length)
              }}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                !sportFilter && !countryFilter ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
              }`}
            >
              All
            </button>
            {sports.map((sport) => (
              <button
                key={sport}
                type="button"
                onClick={() => handleSportFilter(sport)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  sportFilter === sport ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
                }`}
              >
                {sport}
              </button>
            ))}
            {countries.map((country) => (
              <button
                key={country}
                type="button"
                onClick={() => handleCountryFilter(country)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  countryFilter === country ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"
                }`}
              >
                {country}
              </button>
            ))}
          </div>

          <p className="mt-2 px-1 text-xs text-muted-foreground">
            {loading ? "Loading competitions..." : `${filtered.length} tables available`}
          </p>
        </section>

        {loading ? (
          <div className="space-y-2 px-3 py-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-14 rounded-lg border border-border bg-card/70" />
            ))}
          </div>
        ) : (
          <>
            <section className="px-3 py-3" data-section="standings-results">
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {hasActiveSearch ? "Matching Tables" : "Featured"}
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {featured.map((item) => (
                  <Link
                    key={item.id}
                    href={`/league/${item.id}`}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-3 transition-colors hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{labelFor(item)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[item.sport, item.country].filter(Boolean).join(" - ") || "Competition"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
                {featured.length === 0 && (
                  <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
                    <p className="text-sm font-semibold">No tables found</p>
                    <p className="mt-1 text-xs text-muted-foreground">Try another league, sport, or country.</p>
                  </div>
                )}
              </div>
            </section>

            {rest.length > 0 && (
              <section className="px-3 pb-6" data-section="standings-more">
                <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  More Competitions
                </h2>
                <div className="grid grid-cols-1 gap-2">
                  {rest.map((item) => (
                    <Link
                      key={item.id}
                      href={`/league/${item.id}`}
                      className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{labelFor(item)}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[item.sport, item.country].filter(Boolean).join(" - ") || "Competition"}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
