"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { getSFSports, type SFSport } from "@/lib/sf-api"
import { useFixturesFilter } from "@/lib/fixtures-filter-context"

const SPORT_EMOJI: Record<string, string> = {
  football: "⚽", soccer: "⚽", basketball: "🏀", tennis: "🎾",
  cricket: "🏏", "american football": "🏈", "ice hockey": "🏒",
  rugby: "🏉", "rugby league": "🏉", "rugby union": "🏉",
  baseball: "⚾", golf: "⛳", cycling: "🚴", boxing: "🥊",
  mma: "🥊", motorsport: "🏎", swimming: "🏊", athletics: "🏃",
  volleyball: "🏐", handball: "🤾",
}

const SPORT_BG: Record<string, string> = {
  football: "#1a5276", soccer: "#1a5276", basketball: "#1a3a4a",
  tennis: "#154360", cricket: "#784212", "american football": "#2c3e50",
  "ice hockey": "#0e2f44", rugby: "#2c3e50", "rugby league": "#2c3e50",
  "rugby union": "#2c3e50", baseball: "#1b2631", golf: "#1a3a2a",
  motorsport: "#212121", boxing: "#4a1a1a", mma: "#2a1a2a",
  swimming: "#0e3a5e", athletics: "#3a2a0e", volleyball: "#1a3a5a",
  handball: "#3a1a4a",
}

// Verified TSDB media thumb URLs (tested — these exist and return images)
const SPORT_THUMBS: Record<string, string> = {
  football:            "https://www.thesportsdb.com/images/media/sport/thumb/vrpn2g1549861615.jpg",
  soccer:              "https://www.thesportsdb.com/images/media/sport/thumb/vrpn2g1549861615.jpg",
  basketball:          "https://www.thesportsdb.com/images/media/sport/thumb/basketball1519143426.jpg",
  tennis:              "https://www.thesportsdb.com/images/media/sport/thumb/tennis1519142844.jpg",
  cricket:             "https://www.thesportsdb.com/images/media/sport/thumb/cricket1528185337.jpg",
  "ice hockey":        "https://www.thesportsdb.com/images/media/sport/thumb/hockey1519143864.jpg",
  "ice-hockey":        "https://www.thesportsdb.com/images/media/sport/thumb/hockey1519143864.jpg",
  motorsport:          "https://www.thesportsdb.com/images/media/sport/thumb/motorsport1519142960.jpg",
  rugby:               "https://www.thesportsdb.com/images/media/sport/thumb/rugby1519143174.jpg",
  "rugby league":      "https://www.thesportsdb.com/images/media/sport/thumb/rugby1519143174.jpg",
  "rugby union":       "https://www.thesportsdb.com/images/media/sport/thumb/rugby1519143174.jpg",
  baseball:            "https://www.thesportsdb.com/images/media/sport/thumb/baseball1519143666.jpg",
  "american football": "https://www.thesportsdb.com/images/media/sport/thumb/American_Football1516393627.jpg",
  "american-football": "https://www.thesportsdb.com/images/media/sport/thumb/American_Football1516393627.jpg",
  golf:                "https://www.thesportsdb.com/images/media/sport/thumb/golf1519143047.jpg",
  boxing:              "https://www.thesportsdb.com/images/media/sport/thumb/boxing1519143563.jpg",
  volleyball:          "https://www.thesportsdb.com/images/media/sport/thumb/volleyball1520083851.jpg",
  handball:            "https://www.thesportsdb.com/images/media/sport/thumb/handball1518114681.jpg",
  cycling:             "https://www.thesportsdb.com/images/media/sport/thumb/cycling1519142672.jpg",
  swimming:            "https://www.thesportsdb.com/images/media/sport/thumb/swimming1519143408.jpg",
}

const FALLBACK: SFSport[] = [
  { id: "1", slug: "football",            name: "Football",          strSport: "Football" },
  { id: "2", slug: "basketball",          name: "Basketball",        strSport: "Basketball" },
  { id: "3", slug: "tennis",              name: "Tennis",            strSport: "Tennis" },
  { id: "4", slug: "cricket",             name: "Cricket",           strSport: "Cricket" },
  { id: "5", slug: "ice-hockey",          name: "Ice Hockey",        strSport: "Ice Hockey" },
  { id: "6", slug: "american-football",   name: "American Football", strSport: "American Football" },
  { id: "7", slug: "rugby",               name: "Rugby",             strSport: "Rugby" },
  { id: "8", slug: "baseball",            name: "Baseball",          strSport: "Baseball" },
  { id: "9", slug: "golf",                name: "Golf",              strSport: "Golf" },
  { id: "10", slug: "motorsport",         name: "Motorsport",        strSport: "Motorsport" },
]

export function SportsSelector() {
  const [sports, setSports]       = useState<SFSport[]>(FALLBACK)
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set())
  const { selectedSport, setSport } = useFixturesFilter()

  useEffect(() => {
    getSFSports().then((data) => {
      const active = data.filter((s) => {
        const name = s.name || s.strSport || ""
        return name.length > 1 && name !== "AAAAAA" && s.isActive !== false
      })
      if (active.length > 0) setSports(active)
    })
  }, [])

  const handleClick = (key: string) => {
    triggerHaptic("selection")
    setSport(key)
    document.querySelector('[data-section="fixtures"]')
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-border bg-background">
      <div className="flex gap-1 px-1 py-1" style={{ width: "max-content" }}>
        {sports.map((sport) => {
          const key    = sport.slug || String(sport.id)
          const name   = sport.name || sport.strSport || ""
          const nameLc = name.toLowerCase()
          const imgSrc = imgErrors.has(key)
            ? null
            : (sport.icon || sport.strSportThumb || SPORT_THUMBS[nameLc] || SPORT_THUMBS[key] || null)
          const emoji  = SPORT_EMOJI[nameLc] || "🏆"
          const bg     = SPORT_BG[nameLc] || "#1a2a3a"
          const active = selectedSport === key

          return (
            <button
              key={key}
              onClick={() => handleClick(key)}
              aria-label={name}
              title={name}
              style={active ? {
                boxShadow: "0 0 0 2px #378ADD, 0 0 0 3.5px var(--color-background-primary)",
                borderRadius: "10px",
              } : { borderRadius: "10px" }}
              className={`relative shrink-0 h-12 w-12 overflow-hidden transition-opacity
                ${active ? "opacity-100" : "opacity-60 hover:opacity-90"}`}
            >
              {imgSrc ? (
                <Image
                  src={imgSrc}
                  alt={name}
                  fill
                  className="object-cover"
                  style={{ padding: "4px", background: bg, boxSizing: "border-box" }}
                  unoptimized
                  onError={() => setImgErrors(prev => new Set(prev).add(key))}
                />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center text-2xl"
                  style={{ background: bg, padding: "4px" }}
                >
                  {emoji}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
