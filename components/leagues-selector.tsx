"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { getSFLeagues, type SFLeague } from "@/lib/sf-api"
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
}

const FALLBACK: SFLeague[] = [
  { id: "4328", slug: "premier-league",    name: "Premier League",   idLeague: "4328" },
  { id: "4335", slug: "la-liga",           name: "La Liga",          idLeague: "4335" },
  { id: "4480", slug: "champions-league",  name: "Champions League", idLeague: "4480" },
  { id: "4331", slug: "bundesliga",        name: "Bundesliga",       idLeague: "4331" },
  { id: "4332", slug: "serie-a",           name: "Serie A",          idLeague: "4332" },
  { id: "4334", slug: "ligue-1",           name: "Ligue 1",          idLeague: "4334" },
  { id: "4346", slug: "thai-league-1",     name: "Thai League 1",    idLeague: "4346" },
  { id: "4330", slug: "scottish-prem",     name: "Scottish Prem",    idLeague: "4330" },
  { id: "4387", slug: "nba",               name: "NBA",              idLeague: "4387" },
  { id: "4391", slug: "nfl",               name: "NFL",              idLeague: "4391" },
]

function getBadge(league: SFLeague): string | null {
  const id = String(league.id || league.idLeague || "")
  // Priority: Strapi badge → known TSDB path → generated TSDB URL
  return league.logo || league.strBadge || KNOWN_BADGES[id] || (id ? tsdbBadge(id) : null)
}

export function LeaguesSelector() {
  const { setPinnedLeague, pinnedLeagueId } = useFixturesFilter()
  const [leagues, setLeagues]     = useState<SFLeague[]>(FALLBACK)
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set())

  useEffect(() => {
    getSFLeagues().then((data) => {
      if (data.length > 0) setLeagues(data)
    })
  }, [])

  const selected = pinnedLeagueId ?? ""

  const handleClick = (league: SFLeague) => {
    const key = String(league.id || league.idLeague)
    triggerHaptic("selection")
    // Toggle: clicking the active league deselects it (shows all for sport+country)
    setPinnedLeague(selected === key ? null : key)
    document.querySelector('[data-section="fixtures"]')
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-border bg-background">
      <div className="flex gap-1 px-1 py-1" style={{ width: "max-content" }}>
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
              className={`relative shrink-0 h-12 w-12 overflow-hidden transition-opacity
                ${active ? "opacity-100" : "opacity-60 hover:opacity-90"}`}
            >
              {src ? (
                <Image
                  src={src}
                  alt={name}
                  fill
                  className="object-contain"
                  style={{ padding: "4px" }}
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
