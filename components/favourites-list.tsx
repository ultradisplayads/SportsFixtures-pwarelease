"use client"

import { Bell, CalendarDays, Headphones, Plus, Search, SlidersHorizontal, Star, Trash2, Trophy, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { SmartLogo } from "@/components/assets/smart-logo"
import { getPinnedScores, onPinnedScoresChange, type PinnedScore } from "@/lib/pinned-scores"
import {
  getCachedFavourites,
  getFavourites,
  removeFavourite,
  type Favourite as StoredFavourite,
} from "@/lib/favourites-api"

type FavouriteType = "team" | "league" | "country" | "sport" | "event" | "player" | "news"
type MainTab = "games" | "teams" | "players" | "news"
type GameFilter = "all" | "live"

interface Favourite {
  id: string
  type: FavouriteType
  name: string
  logo: string | null
  league: string
  nextMatch: string
}

interface SavedGame {
  id: string
  home: string
  away: string
  homeLogo: string | null
  awayLogo: string | null
  league: string
  sport: string
  country?: string
  score: string
  status: string
  isLive: boolean
  startsAt?: string
  source: "pinned" | "favourite"
}

const MAIN_TABS: { id: MainTab; label: string }[] = [
  { id: "games", label: "Games" },
  { id: "teams", label: "Teams" },
  { id: "players", label: "Players" },
  { id: "news", label: "News" },
]

function labelFromId(id: string): string {
  const known: Record<string, string> = {
    football: "Football",
    basketball: "Basketball",
    cricket: "Cricket",
    rugby: "Rugby",
    tennis: "Tennis",
    "american-football": "NFL",
    england: "England",
    scotland: "Scotland",
    spain: "Spain",
    usa: "USA",
    thailand: "Thailand",
    india: "India",
    "premier-league": "Premier League",
    "champions-league": "Champions League",
    "la-liga": "La Liga",
    "scottish-premiership": "Scottish Premiership",
    nba: "NBA",
    ipl: "IPL",
    "world-cup": "World Cup",
    euros: "Euros",
    "fa-cup": "FA Cup",
    "super-bowl": "Super Bowl",
    wimbledon: "Wimbledon",
    "six-nations": "Six Nations",
  }
  return known[id] || id.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
}

function mapStoredFavourite(fav: StoredFavourite): Favourite | null {
  if (
    fav.entity_type !== "team" &&
    fav.entity_type !== "league" &&
    fav.entity_type !== "competition" &&
    fav.entity_type !== "country" &&
    fav.entity_type !== "sport" &&
    fav.entity_type !== "event" &&
    fav.entity_type !== "player" &&
    fav.entity_type !== "news"
  ) {
    return null
  }

  const type = fav.entity_type === "competition" ? "league" : fav.entity_type
  const meta = fav.entity_meta || {}

  return {
    id: fav.entity_id,
    type: type as FavouriteType,
    name: fav.entity_name || fav.entity_id,
    logo: fav.entity_logo || null,
    league:
      meta.league ||
      meta.sport ||
      meta.country ||
      (type === "team" ? "Team" : type === "player" ? "Player" : type === "news" ? "Saved news" : "Saved"),
    nextMatch: meta.nextMatch || meta.description || "Fixtures and alerts will appear here",
  }
}

function gameFromPinned(score: PinnedScore): SavedGame {
  return {
    id: score.id,
    home: score.home,
    away: score.away,
    homeLogo: score.homeLogo || null,
    awayLogo: score.awayLogo || null,
    league: "Pinned score",
    sport: "Football",
    score: score.score,
    status: score.status,
    isLive: score.isLive,
    startsAt: score.startsAt,
    source: "pinned",
  }
}

function gameFromFavourite(fav: Favourite): SavedGame | null {
  if (fav.type !== "event") return null
  const [home, away] = fav.name.includes(" vs ") ? fav.name.split(" vs ") : [fav.name, ""]
  return {
    id: fav.id,
    home,
    away,
    homeLogo: fav.logo,
    awayLogo: null,
    league: fav.league || "Saved event",
    sport: "Football",
    score: "- - -",
    status: fav.nextMatch,
    isLive: /live|\d+'\b/i.test(fav.nextMatch),
    source: "favourite",
  }
}

function formatGameDate(game: SavedGame): string {
  if (!game.startsAt) return "Saved Games"
  const date = new Date(game.startsAt)
  if (Number.isNaN(date.getTime())) return "Saved Games"
  return date.toLocaleDateString([], { weekday: "long", day: "2-digit", month: "2-digit" })
}

function seedFromOnboarding(): Favourite[] {
  const seeded: Favourite[] = []

  try {
    const interests = JSON.parse(localStorage.getItem("sf_onboarding_interests") || "{}")
    const sections: { key: string; type: FavouriteType; meta: string; next: string }[] = [
      { key: "sports", type: "sport", meta: "Sport interest", next: "Personalised fixtures and news" },
      { key: "countries", type: "country", meta: "Country interest", next: "National and local fixtures" },
      { key: "leagues", type: "league", meta: "Competition", next: "Competition fixtures will appear here" },
      { key: "events", type: "event", meta: "Event watchlist", next: "Event fixtures and alerts will appear here" },
    ]

    sections.forEach((section) => {
      const ids = Array.isArray(interests[section.key]) ? interests[section.key] : []
      ids.forEach((id: string) => {
        seeded.push({
          id,
          type: section.type,
          name: labelFromId(id),
          logo: null,
          league: section.meta,
          nextMatch: section.next,
        })
      })
    })

    const followedTeams = JSON.parse(localStorage.getItem("followedTeams") || "[]")
    if (Array.isArray(followedTeams)) {
      followedTeams.forEach((id: string) => {
      seeded.push({
        id,
          type: "team",
          name: labelFromId(id),
        logo: null,
          league: "Team",
          nextMatch: "Fixtures will appear here",
      })
    })
    }
  } catch {}

  return seeded.filter((item, index, items) => items.findIndex((candidate) => candidate.type === item.type && candidate.id === item.id) === index)
}

export function FavouritesList() {
  const [favourites, setFavourites] = useState<Favourite[]>([])
  const [pinnedScores, setPinnedScores] = useState<PinnedScore[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<MainTab>("games")
  const [gameFilter, setGameFilter] = useState<GameFilter>("all")
  const [sortingOpen, setSortingOpen] = useState(false)
  const [orderGamesBySport, setOrderGamesBySport] = useState(false)
  const [separateGamesAndTeams, setSeparateGamesAndTeams] = useState(true)

  useEffect(() => {
    loadFavourites()
    setPinnedScores(getPinnedScores())
    return onPinnedScoresChange(setPinnedScores)
  }, [])

  useEffect(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem("sf_saved_sorting") || "{}")
      setOrderGamesBySport(Boolean(prefs.orderGamesBySport))
      setSeparateGamesAndTeams(prefs.separateGamesAndTeams !== false)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("sf_saved_sorting", JSON.stringify({ orderGamesBySport, separateGamesAndTeams }))
    } catch {}
  }, [orderGamesBySport, separateGamesAndTeams])

  const loadFavourites = async () => {
    const cached = getCachedFavourites().map(mapStoredFavourite).filter((fav): fav is Favourite => Boolean(fav))
    if (cached.length) setFavourites(cached)

    try {
      const fresh = await getFavourites()
      const mapped = fresh.map(mapStoredFavourite).filter((fav): fav is Favourite => Boolean(fav))
      setFavourites(mapped.length ? mapped : seedFromOnboarding())
    } catch {
      if (!cached.length) setFavourites(seedFromOnboarding())
    }
  }

  const handleRemoveFavourite = async (item: Favourite) => {
    triggerHaptic("medium")
    setFavourites((current) => current.filter((fav) => !(fav.id === item.id && fav.type === item.type)))
    await removeFavourite(item.type, item.id)

    if (item.type === "team") {
      const followedTeamsStr = localStorage.getItem("followedTeams")
      if (followedTeamsStr) {
        const followedIds = JSON.parse(followedTeamsStr)
        localStorage.setItem("followedTeams", JSON.stringify(followedIds.filter((id: string) => id !== item.id)))
      }
    }
  }

  const setReminder = () => {
    triggerHaptic("success")
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Reminder set!", {
        body: "You will be reminded before the match.",
        icon: "/icons/icon-192x192.png",
      })
    }
  }

  const savedGames = [
    ...pinnedScores.map(gameFromPinned),
    ...favourites.map(gameFromFavourite).filter((game): game is SavedGame => Boolean(game)),
  ].filter((game, index, games) => games.findIndex((candidate) => candidate.id === game.id) === index)

  const filteredGames = savedGames
    .filter((game) => gameFilter === "all" || game.isLive)
    .filter((game) => `${game.home} ${game.away} ${game.league} ${game.sport}`.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => orderGamesBySport
      ? `${a.sport}${a.league}${a.startsAt || ""}`.localeCompare(`${b.sport}${b.league}${b.startsAt || ""}`)
      : String(a.startsAt || "").localeCompare(String(b.startsAt || "")))

  const tabFavourites = favourites
    .filter((fav) => {
      if (activeTab === "teams") return fav.type === "team" || (!separateGamesAndTeams && fav.type === "event")
      if (activeTab === "players") return fav.type === "player"
      if (activeTab === "news") return fav.type === "news"
      return fav.type === "league" || fav.type === "country" || fav.type === "sport"
    })
    .filter((fav) => fav.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const groupedGames = filteredGames.reduce<Record<string, SavedGame[]>>((groups, game) => {
    const key = orderGamesBySport ? `${game.sport}: ${game.league}` : formatGameDate(game)
    groups[key] = groups[key] || []
    groups[key].push(game)
    return groups
  }, {})

  return (
    <div className="flex-1 overflow-y-auto bg-secondary/20">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h1 className="text-3xl font-black tracking-normal">Favourites</h1>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm"
          onClick={() => {
            triggerHaptic("light")
            window.location.href = "/onboarding/follow-teams"
          }}
          aria-label="Add favourites"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 backdrop-blur">
        <div className="flex gap-8 overflow-x-auto">
          {MAIN_TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`shrink-0 px-1 py-4 text-sm font-black uppercase tracking-[0.16em] transition-colors ${
                activeTab === id ? "border-b-4 border-primary text-primary" : "text-muted-foreground"
              }`}
              onClick={() => {
                setActiveTab(id)
                triggerHaptic("selection")
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search saved games, teams, players, news..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {activeTab === "games" && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {(["all", "live"] as GameFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setGameFilter(filter)
                  triggerHaptic("selection")
                }}
                className={`rounded-xl px-4 py-3 text-sm font-black uppercase ${
                  gameFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground"
                }`}
              >
                {filter === "all" ? "All Games" : "Live"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setSortingOpen(true)
              triggerHaptic("light")
            }}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card"
            aria-label="Sorting options"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>
      )}

      {activeTab === "games" && filteredGames.length > 0 ? (
        <div className="space-y-5">
          {Object.entries(groupedGames).map(([group, games]) => (
            <section key={group}>
              <h2 className="mb-3 text-xl font-black">{group}</h2>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {games.map((game) => (
                  <a
                    key={game.id}
                    href={`/match/${game.id}`}
                    className="grid grid-cols-[28px_1fr_auto] items-center gap-3 border-b border-border/70 px-3 py-3 last:border-b-0"
                    onClick={() => triggerHaptic("light")}
                  >
                    <Star className="h-5 w-5 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <SmartLogo name={game.home} src={game.homeLogo} className="h-6 w-6 object-contain" />
                        <p className="truncate text-sm font-semibold">{game.home}</p>
                      </div>
                      {game.away && (
                        <div className="mt-1 flex items-center gap-2">
                          <SmartLogo name={game.away} src={game.awayLogo} className="h-6 w-6 object-contain" />
                          <p className="truncate text-sm font-semibold">{game.away}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      {game.source === "pinned" && <Headphones className="h-4 w-4 text-muted-foreground" />}
                      <div>
                        <p className={game.isLive ? "text-sm font-black text-primary" : "text-sm font-bold"}>
                          {game.isLive ? game.score : game.startsAt ? new Date(game.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : game.score}
                        </p>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">{game.status}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : activeTab !== "games" && tabFavourites.length > 0 ? (
        <div className="space-y-3">
          {tabFavourites.map((item) => (
            <div key={`${item.type}:${item.id}`} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <SmartLogo name={item.name} src={item.logo} className="h-12 w-12 rounded-full object-contain" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-bold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.league}</p>
                    </div>
                    <Star className="h-5 w-5 shrink-0 fill-yellow-500 text-yellow-500" />
                  </div>

                  <div className="mt-2 rounded-lg bg-accent/50 p-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {item.type === "team" ? "Next Match" : `Saved ${item.type}`}
                    </p>
                    <p className="text-sm font-semibold">{item.nextMatch}</p>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={setReminder}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                    >
                      <Bell className="h-3 w-3" />
                      Remind Me
                    </button>
                    <button
                      onClick={() => handleRemoveFavourite(item)}
                      className="flex items-center gap-1 rounded-lg border border-destructive bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
          {activeTab === "games" ? (
            <CalendarDays className="mb-4 h-16 w-16 text-muted-foreground" />
          ) : (
            <Trophy className="mb-4 h-16 w-16 text-muted-foreground" />
          )}
          <h2 className="mb-2 text-xl font-bold">No Saved {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Yet</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            Star teams, events, players or news to build this section. Pinned scores also appear in Games.
          </p>
        </div>
      )}
      </div>

      {sortingOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/45" onClick={() => setSortingOpen(false)}>
          <div
            className="w-full rounded-t-2xl bg-background shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-4 border-b border-border p-5">
              <button
                type="button"
                onClick={() => setSortingOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent"
                aria-label="Close sorting options"
              >
                <X className="h-7 w-7" />
              </button>
              <h2 className="text-2xl font-black">Sorting options</h2>
            </div>
            <div className="divide-y divide-border">
              <ToggleRow
                title="Order games by sport"
                checked={orderGamesBySport}
                onChange={setOrderGamesBySport}
              />
              <ToggleRow
                title="Separate My Games and My Teams"
                description="My Games and My Teams matches will be separated"
                checked={separateGamesAndTeams}
                onChange={setSeparateGamesAndTeams}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-4 p-5 text-left"
      onClick={() => {
        onChange(!checked)
        triggerHaptic("selection")
      }}
    >
      <span>
        <span className="block text-lg font-semibold">{title}</span>
        {description && <span className="mt-1 block text-sm text-muted-foreground">{description}</span>}
      </span>
      <span className={`relative h-9 w-16 rounded-full border-2 transition-colors ${checked ? "border-primary bg-primary/20" : "border-muted-foreground/50 bg-muted"}`}>
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-foreground transition-transform ${checked ? "translate-x-8" : "translate-x-1"}`} />
      </span>
    </button>
  )
}
