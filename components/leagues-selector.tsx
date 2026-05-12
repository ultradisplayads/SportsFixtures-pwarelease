"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { triggerHaptic } from "@/lib/haptic-feedback"
import type { SFLeague } from "@/lib/sf-api"
import { useFixturesFilter } from "@/lib/fixtures-filter-context"

// TSDB badge URL by numeric idLeague — reliable fallback
function tsdbBadge(idLeague: string): string {
  return `https://www.thesportsdb.com/images/media/league/badge/${idLeague}.png`
}

// Known TSDB badge paths for common leagues (instant load, no API wait)
const KNOWN_BADGES: Record<string, string> = {
  "4328": "https://www.thesportsdb.com/images/media/league/badge/i6o0kh1549879062.png", // Premier League
  "4335": "https://www.thesportsdb.com/images/media/league/badge/7onmyv1534768460.png", // La Liga
  "4331": "https://www.thesportsdb.com/images/media/league/badge/yvwvry1566160718.png", // Bundesliga
  "4332": "https://www.thesportsdb.com/images/media/league/badge/xpqs5o1549880494.png", // Serie A
  "4334": "https://www.thesportsdb.com/images/media/league/badge/po7p9v1549880992.png", // Ligue 1
  "4480": "https://www.thesportsdb.com/images/media/league/badge/ehfksy1610108016.png", // Champions League
  "4346": "https://www.thesportsdb.com/images/media/league/badge/jouned1619528075.png", // Thai League 1
  "4330": "https://www.thesportsdb.com/images/media/league/badge/qd6q1e1515766168.png", // Scottish Premiership
  "4387": "https://www.thesportsdb.com/images/media/league/badge/vy0lfd1567948778.png", // NBA
  "4391": "https://www.thesportsdb.com/images/media/league/badge/pfuqu21515766159.png", // NFL
  "4424": "https://www.thesportsdb.com/images/media/league/badge/9pnq6m1624969440.png", // MLB
  "4380": "https://www.thesportsdb.com/images/media/league/badge/8g95hz1517408646.png", // NHL
}

const COMPETITION_ORDER = [
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

const COMPETITION_LABELS: Record<string, string> = {
  "uefa-champions-league": "Champions League",
  "english-premier-league": "Premier League",
  "spanish-la-liga": "La Liga",
  "german-bundesliga": "Bundesliga",
  "italian-serie-a": "Serie A",
  "french-ligue-1": "Ligue 1",
  "indian-premier-league": "IPL",
  "american-major-league-soccer": "MLS",
}

const FALLBACK: SFLeague[] = [
  { id: "4328", slug: "premier-league",    name: "Premier League",   idLeague: "4328" },
  { id: "4335", slug: "la-liga",           name: "La Liga",          idLeague: "4335" },
  { id: "4480", slug: "champions-league",  name: "Champions League", idLeague: "4480" },
  { id: "4331", slug: "bundesliga",        name: "Bundesliga",       idLeague: "4331" },
  { id: "4332", slug: "serie-a",           name: "Serie A",          idLeague: "4332" },
  { id: "4334", slug: "ligue-1",           name: "Ligue 1",          idLeague: "4334" },
  { id: "4387", slug: "nba",               name: "NBA",              idLeague: "4387" },
  { id: "4391", slug: "nfl",               name: "NFL",              idLeague: "4391" },
  { id: "4527", slug: "indian-premier-league", name: "IPL",          idLeague: "4527" },
  { id: "4346", slug: "major-league-soccer", name: "MLS",            idLeague: "4346" },
  { id: "4424", slug: "mlb",               name: "MLB",              idLeague: "4424" },
  { id: "4380", slug: "nhl",               name: "NHL",              idLeague: "4380" },
]

const COMPETITIONS_CACHE_KEY = "sf_selector_competitions_v2"

function competitionRank(league: SFLeague): number {
  const slug = String(league.slug || "")
  const rank = COMPETITION_ORDER.indexOf(slug)
  return rank === -1 ? Number.MAX_SAFE_INTEGER : rank
}

function isAllowedCompetition(league: SFLeague): boolean {
  const slug = String(league.slug || "").toLowerCase()
  const name = String(league.name || league.strLeague || "").toLowerCase()
  return !/^\s*_?\s*no league/i.test(name) && !slug.includes("israel") && !name.includes("israel")
}

function readCachedCompetitions(): SFLeague[] {
  if (typeof window === "undefined") return FALLBACK
  try {
    const cached = JSON.parse(window.localStorage.getItem(COMPETITIONS_CACHE_KEY) || "[]")
    return Array.isArray(cached) && cached.length > 0 ? cached : FALLBACK
  } catch {
    return FALLBACK
  }
}

function getBadge(league: SFLeague): string | null {
  const id = String(league.id || league.idLeague || "")
  // Priority: Strapi badge → known TSDB path → generated TSDB URL
  return league.logo || league.strBadge || KNOWN_BADGES[id] || (id ? tsdbBadge(id) : null)
}

export function LeaguesSelector() {
  const { setPinnedLeague, pinnedLeagueId } = useFixturesFilter()
  const router = useRouter()
  const [leagues, setLeagues]     = useState<SFLeague[]>(readCachedCompetitions)
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch("/api/competitions")
      .then((res) => res.json())
      .then((data) => {
        const leagues = Array.isArray(data.competitions)
          ? data.competitions
              .map((l: any) => ({
                id: l.id,
                slug: l.slug,
                name: COMPETITION_LABELS[l.slug] || l.label,
                strLeague: COMPETITION_LABELS[l.slug] || l.label,
                logo: l.logo,
                strBadge: l.logo,
              }))
              .filter(isAllowedCompetition)
              .sort((a: SFLeague, b: SFLeague) => {
                const rank = competitionRank(a) - competitionRank(b)
                if (rank !== 0) return rank
                return String(a.name || "").localeCompare(String(b.name || ""))
              })
          : []
        if (leagues.length > 0) {
          setLeagues(leagues)
          window.localStorage.setItem(COMPETITIONS_CACHE_KEY, JSON.stringify(leagues))
        }
      })
      .catch((error) => console.error("[LeaguesSelector] Failed to load competitions", error))
  }, [])

  const selected = pinnedLeagueId ?? ""

  const handleClick = (league: SFLeague) => {
    const key = String(league.id || league.idLeague)
    triggerHaptic("selection")
    // Toggle: clicking the active league deselects it (shows all for sport+country)
    setPinnedLeague(selected === key ? null : key)
    router.push(selected === key ? "/fixtures" : `/fixtures?competition=${encodeURIComponent(key)}`)
    document.querySelector('[data-section="fixtures"]')
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="w-full overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-border bg-background">
      <div className="flex min-w-full gap-1.5 px-2 py-1.5" style={{ width: "max-content" }}>
        {leagues.map((league) => {
          const key    = String(league.id)
          const name   = league.name || league.strLeague || ""
          const hasErr = imgErrors.has(key)
          const src    = !hasErr ? getBadge(league) : null
          const active = selected === key

          return (
            <button
              key={key}
              onClick={() => handleClick(league)}
              aria-label={name}
              title={name}
              style={active ? {
                boxShadow: "0 0 0 2px #378ADD, 0 0 0 3.5px var(--color-background-primary)",
                borderRadius: "10px",
                background: "var(--color-background-secondary)",
              } : {
                borderRadius: "10px",
                background: "var(--color-background-secondary)",
              }}
              className={`relative h-12 w-12 shrink-0 overflow-hidden transition duration-200 ease-out active:scale-95
                ${active ? "opacity-100" : "opacity-75 hover:scale-105 hover:opacity-100"}`}
            >
              {src ? (
                <Image
                  src={src}
                  alt={name}
                  fill
                  className="object-contain"
                  style={{ padding: "2px" }}
                  unoptimized
                  onError={() => setImgErrors(prev => new Set(prev).add(key))}
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-muted-foreground leading-tight text-center px-1">
                  {name.slice(0, 3).toUpperCase()}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
