"use client"

import { useState, useEffect } from "react"
import type { Dispatch, ReactNode, SetStateAction } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, ChevronLeft, Check, Bell, Zap, Shield, Crown, Star, Ticket, UtensilsCrossed, Trophy, Globe2, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLocation } from "@/components/location-provider"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { addFavourite, getDeviceToken, getCachedFavourites, type Favourite } from "@/lib/favourites-api"
import Image from "next/image"
import { SmartLogo } from "@/components/assets/smart-logo"

interface Team {
  id: string
  name: string
  badge: string
  type: "club" | "country"
  sport: string
  country?: string
  priority?: number // lower = higher in list
}

interface InterestOption {
  id: string
  label: string
  helper?: string
}

// Teams always shown in suggested — Celtic pinned at position 0
const SUGGESTED_TEAMS: Team[] = [
  { id: "133714", name: "Celtic FC",           badge: "/celtic-logo.png",         type: "club",    sport: "Soccer",   country: "Scotland",  priority: 0 },
  { id: "133616", name: "Liverpool",            badge: "/liverpool-logo.png",      type: "club",    sport: "Soccer",   country: "England",   priority: 1 },
  { id: "133604", name: "Arsenal",              badge: "/arsenal-logo.png",        type: "club",    sport: "Soccer",   country: "England",   priority: 2 },
  { id: "133613", name: "Manchester United",    badge: "/man-utd-logo.png",        type: "club",    sport: "Soccer",   country: "England",   priority: 3 },
  { id: "133601", name: "Barcelona",            badge: "/barcelona-logo.png",      type: "club",    sport: "Soccer",   country: "Spain",     priority: 4 },
  { id: "133600", name: "Real Madrid",          badge: "/real-madrid-logo.png",    type: "club",    sport: "Soccer",   country: "Spain",     priority: 5 },
  { id: "133615", name: "Manchester City",      badge: "/man-city-logo.png",       type: "club",    sport: "Soccer",   country: "England",   priority: 6 },
  { id: "133712", name: "Rangers FC",           badge: "/rangers-logo.png",        type: "club",    sport: "Soccer",   country: "Scotland",  priority: 7 },
  { id: "134869", name: "Los Angeles Lakers",   badge: "/lakers-logo.png",         type: "club",    sport: "Basketball", country: "USA",    priority: 8 },
  { id: "134868", name: "Golden State Warriors",badge: "/warriors-logo.png",       type: "club",    sport: "Basketball", country: "USA",    priority: 9 },
  { id: "134920", name: "Kansas City Chiefs",   badge: "/chiefs-logo.png",         type: "club",    sport: "American Football", country: "USA", priority: 10 },
  { id: "135780", name: "India Cricket",        badge: "/india-cricket-logo.png",  type: "country", sport: "Cricket",            priority: 11 },
  { id: "135781", name: "England Cricket",      badge: "/england-cricket-logo.png",type: "country", sport: "Cricket",            priority: 12 },
  { id: "rugby-nz", name: "All Blacks",         badge: "/all-blacks-logo.png",     type: "country", sport: "Rugby",              priority: 13 },
]

// Local teams by country — shown under "Local" tab when location is Thailand
const LOCAL_TEAMS_BY_COUNTRY: Record<string, Team[]> = {
  thailand: [
    { id: "134178", name: "Buriram United",     badge: "/buriram-logo.png",        type: "club",    sport: "Soccer",   country: "Thailand" },
    { id: "134179", name: "Muang Thong United", badge: "/muang-thong-logo.png",    type: "club",    sport: "Soccer",   country: "Thailand" },
    { id: "134180", name: "Chiang Rai United",  badge: "/chiang-rai-logo.png",     type: "club",    sport: "Soccer",   country: "Thailand" },
    { id: "134181", name: "BG Pathum United",   badge: "/bg-pathum-logo.png",      type: "club",    sport: "Soccer",   country: "Thailand" },
    { id: "134182", name: "Port FC",            badge: "/port-fc-logo.png",        type: "club",    sport: "Soccer",   country: "Thailand" },
    { id: "134183", name: "Ratchaburi FC",      badge: "/ratchaburi-logo.png",     type: "club",    sport: "Soccer",   country: "Thailand" },
    { id: "134184", name: "PTT Rayong",         badge: "/ptt-rayong-logo.png",     type: "club",    sport: "Soccer",   country: "Thailand" },
    { id: "th-national", name: "Thailand National", badge: "/thailand-flag.png",   type: "country", sport: "Soccer" },
  ],
  scotland: [
    { id: "133714", name: "Celtic FC",   badge: "/celtic-logo.png",  type: "club", sport: "Soccer", country: "Scotland" },
    { id: "133712", name: "Rangers FC",  badge: "/rangers-logo.png", type: "club", sport: "Soccer", country: "Scotland" },
    { id: "133720", name: "Hearts",      badge: "/hearts-logo.png",  type: "club", sport: "Soccer", country: "Scotland" },
    { id: "133721", name: "Hibernian",   badge: "/hibs-logo.png",    type: "club", sport: "Soccer", country: "Scotland" },
    { id: "133722", name: "Aberdeen",    badge: "/aberdeen-logo.png",type: "club", sport: "Soccer", country: "Scotland" },
  ],
  england: [
    { id: "133616", name: "Liverpool",         badge: "/liverpool-logo.png",   type: "club", sport: "Soccer", country: "England" },
    { id: "133604", name: "Arsenal",           badge: "/arsenal-logo.png",     type: "club", sport: "Soccer", country: "England" },
    { id: "133613", name: "Manchester United", badge: "/man-utd-logo.png",     type: "club", sport: "Soccer", country: "England" },
    { id: "133615", name: "Manchester City",   badge: "/man-city-logo.png",    type: "club", sport: "Soccer", country: "England" },
    { id: "133610", name: "Chelsea",           badge: "/chelsea-logo.png",     type: "club", sport: "Soccer", country: "England" },
    { id: "133612", name: "Tottenham Hotspur", badge: "/spurs-logo.png",       type: "club", sport: "Soccer", country: "England" },
  ],
}

const SPORTS_OPTIONS: InterestOption[] = [
  { id: "football", label: "Football", helper: "Fixtures, TV and alerts" },
  { id: "basketball", label: "Basketball", helper: "NBA and global games" },
  { id: "cricket", label: "Cricket", helper: "International and franchise" },
  { id: "rugby", label: "Rugby", helper: "Union and major events" },
  { id: "tennis", label: "Tennis", helper: "Tours and grand slams" },
  { id: "american-football", label: "NFL", helper: "Games and reminders" },
  { id: "formula-1", label: "Formula 1", helper: "Race weekends" },
  { id: "golf", label: "Golf", helper: "Majors and tours" },
  { id: "baseball", label: "Baseball", helper: "MLB and postseason" },
  { id: "ice-hockey", label: "Ice Hockey", helper: "NHL and internationals" },
]

const COUNTRY_OPTIONS: InterestOption[] = [
  { id: "england", label: "England" },
  { id: "scotland", label: "Scotland" },
  { id: "spain", label: "Spain" },
  { id: "usa", label: "USA" },
  { id: "thailand", label: "Thailand" },
  { id: "india", label: "India" },
  { id: "germany", label: "Germany" },
  { id: "italy", label: "Italy" },
  { id: "france", label: "France" },
  { id: "australia", label: "Australia" },
]

const LEAGUE_OPTIONS: InterestOption[] = [
  { id: "premier-league", label: "Premier League" },
  { id: "champions-league", label: "Champions League" },
  { id: "la-liga", label: "La Liga" },
  { id: "scottish-premiership", label: "Scottish Premiership" },
  { id: "nba", label: "NBA" },
  { id: "ipl", label: "IPL" },
  { id: "bundesliga", label: "Bundesliga" },
  { id: "serie-a", label: "Serie A" },
  { id: "ligue-1", label: "Ligue 1" },
  { id: "mls", label: "MLS" },
]

const EVENT_OPTIONS: InterestOption[] = [
  { id: "world-cup", label: "World Cup" },
  { id: "euros", label: "Euros" },
  { id: "fa-cup", label: "FA Cup" },
  { id: "super-bowl", label: "Super Bowl" },
  { id: "wimbledon", label: "Wimbledon" },
  { id: "six-nations", label: "Six Nations" },
  { id: "champions-league-final", label: "UCL Final" },
  { id: "nba-finals", label: "NBA Finals" },
  { id: "ashes", label: "The Ashes" },
  { id: "monaco-gp", label: "Monaco GP" },
]

const SPORT_VISUALS: Record<string, string> = {
  football: "⚽",
  basketball: "🏀",
  cricket: "🏏",
  rugby: "🏉",
  tennis: "🎾",
  "american-football": "🏈",
  "formula-1": "🏎️",
  golf: "⛳",
  baseball: "⚾",
  "ice-hockey": "🏒",
}

const COUNTRY_FLAGS: Record<string, string> = {
  england: "🏴",
  scotland: "🏴",
  spain: "🇪🇸",
  usa: "🇺🇸",
  thailand: "🇹🇭",
  india: "🇮🇳",
  germany: "🇩🇪",
  italy: "🇮🇹",
  france: "🇫🇷",
  australia: "🇦🇺",
}

const LEAGUE_MARKS: Record<string, string> = {
  "premier-league": "PL",
  "champions-league": "UCL",
  "la-liga": "LL",
  "scottish-premiership": "SPL",
  nba: "NBA",
  ipl: "IPL",
  bundesliga: "BUN",
  "serie-a": "SA",
  "ligue-1": "L1",
  mls: "MLS",
}

const EVENT_MARKS: Record<string, string> = {
  "world-cup": "WC",
  euros: "EU",
  "fa-cup": "FA",
  "super-bowl": "SB",
  wimbledon: "W",
  "six-nations": "6N",
  "champions-league-final": "UCL",
  "nba-finals": "NBA",
  ashes: "ASH",
  "monaco-gp": "GP",
}

function interestVisual(section: string, option: InterestOption) {
  if (section === "Sports") {
    return <span className="text-[22px] leading-none">{SPORT_VISUALS[option.id] || "🏆"}</span>
  }
  if (section === "Countries") {
    return <span className="text-[22px] leading-none">{COUNTRY_FLAGS[option.id] || "🌍"}</span>
  }
  if (section === "Leagues") {
    return <span className="text-[10px] font-black leading-none">{LEAGUE_MARKS[option.id] || option.label.slice(0, 3).toUpperCase()}</span>
  }
  return <span className="text-[10px] font-black leading-none">{EVENT_MARKS[option.id] || option.label.slice(0, 3).toUpperCase()}</span>
}

const LEAGUE_ALIAS_IDS: Record<string, string> = {
  "english-premier-league": "premier-league",
  "uefa-champions-league": "champions-league",
  "spanish-la-liga": "la-liga",
  "scottish-premier-league": "scottish-premiership",
  "scottish-premiership": "scottish-premiership",
  "indian-premier-league": "ipl",
}

function normaliseLeagueId(slug: string, label: string): string {
  const key = slug || label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  return LEAGUE_ALIAS_IDS[key] || key
}

function leagueRank(option: InterestOption): number {
  const rank = LEAGUE_OPTIONS.findIndex((item) => item.id === option.id)
  return rank === -1 ? Number.MAX_SAFE_INTEGER : rank
}

const SMART_TEAM_RECOMMENDATIONS: Team[] = [
  { id: "133610", name: "Chelsea", badge: "/chelsea-logo.png", type: "club", sport: "Soccer", country: "England", priority: 20 },
  { id: "133612", name: "Tottenham Hotspur", badge: "/spurs-logo.png", type: "club", sport: "Soccer", country: "England", priority: 21 },
  { id: "133720", name: "Hearts", badge: "/hearts-logo.png", type: "club", sport: "Soccer", country: "Scotland", priority: 22 },
  { id: "133721", name: "Hibernian", badge: "/hibs-logo.png", type: "club", sport: "Soccer", country: "Scotland", priority: 23 },
  { id: "134178", name: "Buriram United", badge: "/buriram-logo.png", type: "club", sport: "Soccer", country: "Thailand", priority: 24 },
  { id: "134179", name: "Muang Thong United", badge: "/muang-thong-logo.png", type: "club", sport: "Soccer", country: "Thailand", priority: 25 },
  { id: "134872", name: "Boston Celtics", badge: "/celtics-logo.png", type: "club", sport: "Basketball", country: "USA", priority: 26 },
  { id: "134874", name: "New York Knicks", badge: "/knicks-logo.png", type: "club", sport: "Basketball", country: "USA", priority: 27 },
  { id: "134922", name: "Dallas Cowboys", badge: "/cowboys-logo.png", type: "club", sport: "American Football", country: "USA", priority: 28 },
  { id: "134923", name: "San Francisco 49ers", badge: "/49ers-logo.png", type: "club", sport: "American Football", country: "USA", priority: 29 },
  { id: "135782", name: "Australia Cricket", badge: "/australia-cricket-logo.png", type: "country", sport: "Cricket", country: "Australia", priority: 30 },
]

// Detect country from browser timezone (no UTC — use locale only)
function detectLocalCountry(): string {
  if (typeof window === "undefined") return "england"
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz.startsWith("Asia/Bangkok") || tz.startsWith("Asia/Phnom_Penh")) return "thailand"
    if (tz.startsWith("Europe/Edinburgh") || tz.startsWith("Europe/Glasgow")) return "scotland"
    if (tz.startsWith("Europe/London") || tz.startsWith("Europe/Belfast")) return "england"
    if (tz.startsWith("Europe/Madrid")) return "spain"
    if (tz.startsWith("Europe/Berlin")) return "germany"
    if (tz.startsWith("Europe/Rome")) return "italy"
    if (tz.startsWith("Europe/Paris")) return "france"
  } catch {}
  return "england"
}

const PAGES = ["sports", "follow-teams", "notification-types", "complete"] as const
type Page = (typeof PAGES)[number]
type PlanId = "bronze" | "silver" | "gold" | "founder_vip"

export default function FollowTeamsPage() {
  const router = useRouter()
  const { location, requestLocation } = useLocation()
  const [activeTab, setActiveTab] = useState<"local" | "suggested">("suggested")
  const [searchQuery, setSearchQuery] = useState("")
  const [followedTeams, setFollowedTeams] = useState<Set<string>>(new Set())
  const [selectedSports, setSelectedSports] = useState<Set<string>>(new Set(["football"]))
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set())
  const [selectedLeagues, setSelectedLeagues] = useState<Set<string>>(new Set())
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [leagueOptions, setLeagueOptions] = useState<InterestOption[]>(LEAGUE_OPTIONS)
  const [interestSearch, setInterestSearch] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState<Page>("sports")
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("gold")
  const [localCountry, setLocalCountry] = useState<string>("england")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState({
    matchStart: true,
    goals: true,
    halftime: true,
    fulltime: true,
    cards: true,
    lineups: true,
  })

  useEffect(() => {
    const saved = localStorage.getItem("followedTeams")
    if (saved) {
      const parsed = new Set<string>(JSON.parse(saved))
      setFollowedTeams(parsed)
    }
    const savedInterests = localStorage.getItem("sf_onboarding_interests")
    if (savedInterests) {
      try {
        const parsed = JSON.parse(savedInterests)
        setSelectedSports(new Set(parsed.sports || ["football"]))
        setSelectedCountries(new Set(parsed.countries || []))
        setSelectedLeagues(new Set(parsed.leagues || []))
        setSelectedEvents(new Set(parsed.events || []))
      } catch {}
    }
    if (!location) requestLocation()
    const country = detectLocalCountry()
    setLocalCountry(country)
  }, [])

  useEffect(() => {
    fetch("/api/competitions")
      .then((res) => res.json())
      .then((data) => {
        const competitions = Array.isArray(data.competitions) ? data.competitions : []
        const mapped = competitions
          .map((item: any) => {
            const label = String(item.label || item.name || item.strLeague || "").trim()
            const slug = String(item.slug || "").trim()
            return label
              ? {
                  id: normaliseLeagueId(slug, label),
                  label,
                }
              : null
          })
          .filter((item: InterestOption | null): item is InterestOption => {
            if (!item) return false
            const text = `${item.id} ${item.label}`.toLowerCase()
            return !text.includes("israel") && !/^\s*_?\s*no league/i.test(item.label)
          })
          .filter((item: InterestOption, index: number, list: InterestOption[]) =>
            list.findIndex((candidate) => candidate.id === item.id) === index,
          )
          .sort((a: InterestOption, b: InterestOption) => {
            const rank = leagueRank(a) - leagueRank(b)
            if (rank !== 0) return rank
            return a.label.localeCompare(b.label)
          })

        if (mapped.length > 0) {
          setLeagueOptions(mapped)
        }
      })
      .catch(() => {})
  }, [])

  const localTeams = LOCAL_TEAMS_BY_COUNTRY[localCountry] || LOCAL_TEAMS_BY_COUNTRY["england"]
  const selectedSportLabels = new Set(
    [...selectedSports].map((sport) => {
      if (sport === "football") return "Soccer"
      if (sport === "american-football") return "American Football"
      return SPORTS_OPTIONS.find((option) => option.id === sport)?.label || sport
    }),
  )
  const selectedCountryLabels = new Set(
    [...selectedCountries].map((country) => COUNTRY_OPTIONS.find((option) => option.id === country)?.label || country),
  )
  const smartSuggestedTeams = [...SUGGESTED_TEAMS, ...SMART_TEAM_RECOMMENDATIONS]
    .filter((team, index, teams) => teams.findIndex((candidate) => candidate.id === team.id) === index)
    .map((team) => {
      let score = team.priority ?? 99
      if (selectedSportLabels.has(team.sport)) score -= 40
      if (team.country && selectedCountryLabels.has(team.country)) score -= 30
      if (selectedLeagues.has("premier-league") && team.country === "England" && team.sport === "Soccer") score -= 18
      if (selectedLeagues.has("scottish-premiership") && team.country === "Scotland") score -= 18
      if (selectedLeagues.has("la-liga") && team.country === "Spain") score -= 18
      if (selectedLeagues.has("nba") && team.sport === "Basketball") score -= 18
      if (selectedLeagues.has("ipl") && team.sport === "Cricket") score -= 18
      if (selectedEvents.has("super-bowl") && team.sport === "American Football") score -= 15
      if (selectedEvents.has("six-nations") && team.sport === "Rugby") score -= 15
      return { ...team, priority: score }
    })
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))

  const displayTeams = activeTab === "local" ? localTeams : smartSuggestedTeams
  const filteredTeams = displayTeams.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const smartLeagueLabels = [
    ...[...selectedLeagues].map((id) => LEAGUE_OPTIONS.find((option) => option.id === id)?.label).filter(Boolean),
    selectedSports.has("football") && selectedCountries.has("scotland") ? "Scottish Premiership" : null,
    selectedSports.has("football") && selectedCountries.has("england") ? "Premier League" : null,
    selectedSports.has("football") ? "Champions League" : null,
    selectedSports.has("basketball") ? "NBA" : null,
    selectedSports.has("cricket") ? "IPL" : null,
  ].filter((label, index, labels): label is string => Boolean(label) && labels.indexOf(label) === index).slice(0, 4)

  const toggleFollow = (teamId: string) => {
    triggerHaptic("selection")
    const next = new Set(followedTeams)
    next.has(teamId) ? next.delete(teamId) : next.add(teamId)
    setFollowedTeams(next)
    localStorage.setItem("followedTeams", JSON.stringify([...next]))
  }

  const toggleSetValue = (
    value: string,
    setter: Dispatch<SetStateAction<Set<string>>>,
  ) => {
    triggerHaptic("selection")
    setter((prev) => {
      const next = new Set(prev)
      next.has(value) ? next.delete(value) : next.add(value)
      return next
    })
  }

  const toggleExpandedSection = (section: string) => {
    triggerHaptic("light")
    setExpandedSections((prev) => {
      const next = new Set(prev)
      next.has(section) ? next.delete(section) : next.add(section)
      return next
    })
  }

  const visibleInterestOptions = (section: { title: string; options: InterestOption[] }) => {
    const expanded = expandedSections.has(section.title)
    if (!expanded) return section.options.slice(0, 6)

    const query = (interestSearch[section.title] || "").trim().toLowerCase()
    const filtered = query
      ? section.options.filter((option) =>
          `${option.label} ${option.helper || ""} ${option.id}`.toLowerCase().includes(query),
        )
      : section.options

    return section.title === "Leagues" ? filtered.slice(0, query ? 40 : 18) : filtered
  }

  const toggleNotif = (key: keyof typeof notifPrefs) => {
    triggerHaptic("light")
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const interestPayload = () => ({
    sports: [...selectedSports],
    countries: [...selectedCountries],
    leagues: [...selectedLeagues],
    events: [...selectedEvents],
  })

  const saveOnboardingInterests = async () => {
    const payload = interestPayload()
    localStorage.setItem("sf_onboarding_interests", JSON.stringify(payload))
    fetch("/api/onboarding/interests", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-device-token": getDeviceToken() },
      body: JSON.stringify(payload),
    }).catch(() => {})
  }

  const recordOnboardingTermsAcceptance = () => {
    const acceptedAt = new Date().toISOString()
    localStorage.setItem("sf_terms_cookie_acceptance", JSON.stringify({
      accepted: true,
      acceptedAt,
      source: "onboarding",
      version: "2026-05-05",
      includesCookies: true,
      includesTerms: true,
      includesPrivacy: true,
    }))
    localStorage.setItem("sf_cookie_consent", JSON.stringify({
      accepted: true,
      acceptedAt,
      source: "onboarding_terms",
    }))
  }

  const handleNext = async () => {
    triggerHaptic("light")
    const idx = PAGES.indexOf(currentPage)
    if (idx < PAGES.length - 1) {
      if (currentPage === "sports") {
        await saveOnboardingInterests()
      }
      if (currentPage === "follow-teams") {
        // Save prefs before advancing
        localStorage.setItem("followedTeams", JSON.stringify([...followedTeams]))
        const teamFavourites: Omit<Favourite, "created_at">[] = smartSuggestedTeams
          .filter((team) => followedTeams.has(team.id))
          .map((team) => ({
            entity_type: "team",
            entity_id: team.id,
            entity_name: team.name,
            entity_logo: team.badge,
            entity_meta: { sport: team.sport, country: team.country || "" },
          }))
        const leagueFavourites: Omit<Favourite, "created_at">[] = [...selectedLeagues].map((id) => {
          const league = LEAGUE_OPTIONS.find((option) => option.id === id)
          return {
            entity_type: "league",
            entity_id: id,
            entity_name: league?.label || id,
            entity_logo: "",
            entity_meta: { source: "onboarding" },
          }
        })
        const currentCache = getCachedFavourites()
        const nextCache: Favourite[] = [...teamFavourites, ...leagueFavourites].map((fav) => ({
          ...fav,
          created_at: new Date().toISOString(),
        }))
        const merged = [
          ...nextCache,
          ...currentCache.filter(
            (fav) => !nextCache.some((next) => next.entity_type === fav.entity_type && next.entity_id === fav.entity_id),
          ),
        ]
        localStorage.setItem("sf_favourites_cache", JSON.stringify(merged))
        ;[...teamFavourites, ...leagueFavourites].forEach((fav) => {
          addFavourite(fav).catch(() => {})
        })
      }
      setCurrentPage(PAGES[idx + 1])
    } else {
      if (!termsAccepted) {
        triggerHaptic("error")
        return
      }
      recordOnboardingTermsAcceptance()
      localStorage.setItem("onboardingComplete", "true")
      localStorage.setItem("notifPrefs", JSON.stringify({
        ...notifPrefs,
        venueOffers: true,
        advertising: true,
      }))
      localStorage.setItem("sf_push_onboarding_choice", "settings_deferred")
      triggerHaptic("success")

      // Persist followed teams to DB (fire-and-forget — localStorage is fallback if offline/unauthed)
      if (followedTeams.size > 0) {
        const teams = [...SUGGESTED_TEAMS, ...SMART_TEAM_RECOMMENDATIONS, ...localTeams]
          .filter((team, index, teams) => followedTeams.has(team.id) && teams.findIndex((candidate) => candidate.id === team.id) === index)
          .map((team) => ({ id: team.id, name: team.name, logo: team.badge }))
        fetch("/api/favourites", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-device-token": getDeviceToken() },
          body: JSON.stringify({ teams }),
        }).catch(() => {})
      }

      router.push("/")
    }
  }

  const handleBack = () => {
    triggerHaptic("light")
    const idx = PAGES.indexOf(currentPage)
    if (idx > 0) setCurrentPage(PAGES[idx - 1])
    else router.push("/onboarding")
  }

  const handleSkip = () => {
    triggerHaptic("light")
    localStorage.setItem("onboardingComplete", "true")
    router.push("/")
  }

  const pageIndex = PAGES.indexOf(currentPage)
  const totalPages = PAGES.length
  const primarySportLabel =
    SPORTS_OPTIONS.find((option) => selectedSports.has(option.id))?.label || "your sports"
  const primaryCountryLabel =
    COUNTRY_OPTIONS.find((option) => selectedCountries.has(option.id))?.label || localCountry.replace("-", " ")

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 px-3 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="flex min-h-11 items-center justify-between">
        <button
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 text-center">
          <h1 className="truncate text-base font-bold leading-tight">
            {currentPage === "sports" && "Choose Sports"}
            {currentPage === "follow-teams" && "Follow Teams"}
            {currentPage === "notification-types" && "Notifications"}
            {currentPage === "complete" && "All Set!"}
          </h1>
          <p className="text-xs text-muted-foreground">Step {pageIndex + 1} of {totalPages}</p>
        </div>
        <button
          onClick={handleSkip}
          className="h-10 rounded-full px-3 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          Skip
        </button>
        </div>
        <div className="mt-2 flex gap-1.5">
        {PAGES.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= pageIndex ? "bg-primary" : "bg-muted"}`}
          />
        ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-3 pb-6 pt-3 [-webkit-overflow-scrolling:touch] sm:px-4">

        {/* ── Sports, countries, leagues and events page ── */}
        {currentPage === "sports" && (
          <div className="space-y-5">
            <p className="text-sm leading-5 text-muted-foreground text-balance">
              Choose what you care about first. Pick a few now; you can refine teams on the next step.
            </p>

            {([
              {
                title: "Sports",
                icon: <Trophy className="h-4 w-4" />,
                options: SPORTS_OPTIONS,
                selected: selectedSports,
                setter: setSelectedSports,
              },
              {
                title: "Countries",
                icon: <Globe2 className="h-4 w-4" />,
                options: COUNTRY_OPTIONS,
                selected: selectedCountries,
                setter: setSelectedCountries,
              },
              {
                title: "Leagues",
                icon: <Shield className="h-4 w-4" />,
                options: leagueOptions,
                selected: selectedLeagues,
                setter: setSelectedLeagues,
              },
              {
                title: "Events",
                icon: <CalendarDays className="h-4 w-4" />,
                options: EVENT_OPTIONS,
                selected: selectedEvents,
                setter: setSelectedEvents,
              },
            ] as {
              title: string
              icon: ReactNode
              options: InterestOption[]
              selected: Set<string>
              setter: Dispatch<SetStateAction<Set<string>>>
            }[]).map((section) => (
              <section key={section.title} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex min-w-0 items-center gap-2 text-sm font-bold">
                      <span className="shrink-0 text-primary">{section.icon}</span>
                      <span className="truncate">{section.title}</span>
                    </div>
                    {section.options.length > 6 && (
                      <button
                        type="button"
                        onClick={() => toggleExpandedSection(section.title)}
                        aria-expanded={expandedSections.has(section.title)}
                        className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-bold leading-none text-primary transition-colors hover:bg-primary/15 active:scale-95"
                      >
                        {expandedSections.has(section.title) ? "Show less" : "Click for more"}
                      </button>
                    )}
                  </div>
                  <span className="shrink-0 pl-2 text-xs text-muted-foreground">{section.selected.size} picked</span>
                </div>
                {expandedSections.has(section.title) && section.title === "Leagues" && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={interestSearch[section.title] || ""}
                      onChange={(event) => setInterestSearch((prev) => ({ ...prev, [section.title]: event.target.value }))}
                      placeholder="Search leagues and competitions"
                      className="h-10 rounded-full pl-9 text-sm"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Showing {visibleInterestOptions(section).length} best matches. Type to narrow the Strapi list.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {visibleInterestOptions(section).map((option) => {
                    const active = section.selected.has(option.id)
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleSetValue(option.id, section.setter)}
                        className={`flex min-h-[58px] items-center justify-between gap-2 rounded-xl border p-3 text-left transition-all active:scale-[0.99] ${
                          active
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                            active ? "border-primary/30 bg-primary/15 text-primary" : "border-border bg-muted text-foreground"
                          }`}>
                            {interestVisual(section.title, option)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{option.label}</span>
                            {option.helper && (
                              <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                                {option.helper}
                              </span>
                            )}
                          </span>
                        </span>
                        {active && (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3.5 w-3.5" />
                            </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* ── Notification types page ── */}
        {currentPage === "notification-types" && (
          <div className="mt-1 space-y-4">
            <p className="text-sm text-muted-foreground text-balance">
              Choose which updates you want pushed to your device. You can change these any time in Settings.
            </p>

            <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
              {([
                { key: "matchStart",   label: "Match Start",    desc: "Notified when your teams kick off" },
                { key: "goals",        label: "Goals",          desc: "Instant alert for every goal" },
                { key: "halftime",     label: "Half Time",      desc: "Score update at the break" },
                { key: "fulltime",     label: "Full Time",      desc: "Final score as soon as the whistle blows" },
                { key: "cards",        label: "Cards",          desc: "Yellow and red card alerts" },
                { key: "lineups",      label: "Team Lineups",   desc: "When confirmed line-ups are published" },
              ] as { key: keyof typeof notifPrefs; label: string; desc: string }[]).map(({ key, label, desc }) => (
                <button
                  key={key}
                  onClick={() => toggleNotif(key)}
                  className="flex min-h-16 w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <div className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${notifPrefs[key] ? "bg-primary" : "bg-muted"}`}>
                    <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notifPrefs[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                </button>
              ))}
            </div>

          </div>
        )}

        {/* ── Follow teams page ── */}
        {currentPage === "follow-teams" && (
          <>
            <p className="mb-3 text-sm leading-5 text-muted-foreground text-balance">
              Pick a few favourites. We will use them for fixtures, TV listings, and smarter alerts.
            </p>

            <div className="mb-2 grid grid-cols-2 rounded-full bg-muted p-1">
              {(["suggested", "local"] as const).map((tab) => (
                <button
                  key={tab}
                  className={`min-h-10 rounded-full px-2 text-center text-sm font-semibold capitalize transition-colors ${
                    activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                  onClick={() => { setActiveTab(tab); triggerHaptic("selection") }}
                >
                  {tab === "local" ? "Local" : "Suggested"}
                </button>
              ))}
            </div>
            <p className="mb-3 text-center text-xs text-muted-foreground">
              {activeTab === "local" ? `Showing ${localCountry.replace("-", " ")}` : "Matched to your sports, countries and leagues"}
            </p>

            {activeTab === "suggested" && smartLeagueLabels.length > 0 && (
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {smartLeagueLabels.map((label) => (
                  <span key={label} className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {label}
                  </span>
                ))}
              </div>
            )}

            <div className="sticky top-[82px] z-10 -mx-3 mb-3 bg-background/95 px-3 pb-2 backdrop-blur sm:-mx-4 sm:px-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search teams"
                className="h-11 rounded-full pl-9 text-base sm:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            </div>

            <div className="space-y-2">
              {filteredTeams.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No teams found</p>
              ) : (
                filteredTeams.map((team) => {
                  const isCeltic = team.id === "133714"
                  const isFollowed = followedTeams.has(team.id)
                  return (
                    <div
                      key={team.id}
                      className={`flex min-h-[68px] items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-sm transition-all ${
                        isCeltic ? "border-primary/40" : "border-border"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <SmartLogo
                          name={team.name}
                          src={team.badge || null}
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-1.5"><span className="truncate text-sm font-semibold">{team.name}</span>{isCeltic && <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Popular</span>}</div>
                          <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="truncate">{team.sport}</span>
                            {team.country && <><span>·</span><span>{team.country}</span></>}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFollow(team.id)}
                        aria-label={isFollowed ? `Unfollow ${team.name}` : `Follow ${team.name}`}
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                          isFollowed
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-primary"
                        }`}
                      >
                        {isFollowed && <Check className="h-4 w-4" />}
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}

        {/* ── Subscription page ── */}
        {false && (
          <div className="space-y-4 mt-1 pb-2">

            {/* Quirk hero banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 px-4 pt-3 pb-4">
              {/* Animated shimmer ring */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none">
                <div className="absolute inset-0 rounded-2xl animate-pulse bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0" />
              </div>

              <div className="flex items-end gap-3">
                {/* Quirk */}
                <div className="relative shrink-0 animate-[bounce_2s_ease-in-out_infinite]">
                  <Image
                    src="/quirk.png"
                    alt="Quirk the Sports Fixtures mascot"
                    width={88}
                    height={88}
                    className="drop-shadow-lg"
                    priority
                  />
                  {/* Speech bubble */}
                  <div className="absolute -top-1 -right-2 bg-primary text-primary-foreground text-[9px] font-black rounded-full px-1.5 py-0.5 leading-tight rotate-6 shadow-md whitespace-nowrap">
                    Psst!
                  </div>
                </div>

                {/* Message */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-0.5">Limited time</p>
                  <h3 className="text-xl font-black leading-tight text-balance text-foreground">
                    Pick Bronze,<br />get Gold FREE!
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Every new user gets the{" "}
                    <span className="font-bold text-foreground">Gold Launch Pass</span>{" "}
                    until 31 Dec — no catch, no card needed.
                  </p>
                </div>
              </div>

              {/* Flashing countdown pill */}
              <div className="mt-3 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                </span>
                <span className="animate-pulse text-xs font-bold text-primary tracking-wide">
                  FREE until 31 Dec 2025 — Gold features unlocked now
                </span>
              </div>
            </div>

            {/* Plan cards */}
            {([
              {
                id: "bronze",
                name: "Bronze",
                icon: <Shield className="h-4 w-4" />,
                iconColor: "text-amber-600",
                price: "Free",
                sub: "always",
                highlight: false,
                quirk: "Good for starters",
                features: [
                  "Core fixtures, results and live scores",
                  "Basic match alerts (up to 3 teams)",
                  "Venue discovery",
                  "Full fixture calendar",
                ],
              },
              {
                id: "silver",
                name: "Silver",
                icon: <Zap className="h-4 w-4" />,
                iconColor: "text-slate-400",
                price: "£1.99",
                sub: "/month",
                highlight: false,
                badge: "Founder pricing — locked in at launch",
                quirk: "The sweet spot",
                features: [
                  "Everything in Bronze",
                  "Unlimited match alerts and reminders",
                  "Deeper personalisation",
                  "Multi-device sync",
                  "Reduced ad load",
                ],
              },
              {
                id: "gold",
                name: "Gold",
                icon: <Crown className="h-4 w-4" />,
                iconColor: "text-yellow-500",
                price: "£2.99",
                sub: "/month",
                highlight: true,
                badge: "FREE until 31 Dec with Launch Pass",
                quirk: "Quirk's favourite!",
                features: [
                  "Everything in Silver",
                  "Ad-free experience",
                  "All alert windows (5 min to 24h)",
                  "Premium venue and watch tools",
                  "Export your data",
                  "Priority support",
                ],
              },
              {
                id: "founder_vip",
                name: "Founder VIP",
                icon: <Star className="h-4 w-4" />,
                iconColor: "text-purple-400",
                price: "£99.99",
                sub: "lifetime",
                highlight: false,
                vip: true,
                badge: "One-time Founder offer — was £199.99",
                quirk: "Pay once, own it",
                features: [
                  "Everything in Gold for life",
                  "VIP venue discounts",
                  "Food and drinks discounts",
                  "Secret invites and watch parties",
                  "Founder badge and roadmap input",
                ],
              },
            ]).map((plan) => (
              <button
                type="button"
                key={plan.id}
                onClick={() => {
                  triggerHaptic("selection")
                  setSelectedPlan(plan.id as PlanId)
                }}
                aria-pressed={selectedPlan === plan.id}
                className={`relative w-full overflow-hidden rounded-2xl border-2 text-left transition-all active:scale-[0.99] ${
                  selectedPlan === plan.id
                    ? plan.vip
                      ? "border-purple-500 shadow-[0_0_24px_rgba(168,85,247,0.22)]"
                      : "border-primary shadow-[0_0_24px_rgba(var(--primary-rgb)/0.25)]"
                    : plan.highlight
                      ? "border-primary/60"
                      : plan.vip
                        ? "border-purple-500/50"
                        : "border-border"
                }`}
              >
                {/* Gold animated glow border */}
                {plan.highlight && (
                  <div className="absolute inset-0 rounded-2xl pointer-events-none animate-pulse bg-gradient-to-b from-primary/8 to-transparent" />
                )}
                {plan.vip && (
                  <div className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-br from-purple-500/10 to-transparent" />
                )}

                {/* "Quirk recommends" flag */}
                {plan.highlight && (
                  <div className="flex items-center gap-1.5 bg-primary px-4 py-1.5">
                    <Image src="/quirk.png" alt="" width={18} height={18} className="shrink-0" />
                    <span className="text-[11px] font-black tracking-wide text-primary-foreground uppercase">
                      Quirk says — start here, it&apos;s free!
                    </span>
                  </div>
                )}
                {plan.vip && (
                  <div className="flex items-center gap-1.5 bg-purple-600 px-4 py-1.5">
                    <Star className="h-4 w-4 shrink-0 text-white" />
                    <span className="text-[11px] font-black tracking-wide text-white uppercase">
                      Founder VIP — lifetime perks
                    </span>
                  </div>
                )}

                <div className="p-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={plan.iconColor}>{plan.icon}</span>
                        <p className="font-black text-base">{plan.name}</p>
                        <span className="text-[9px] italic text-muted-foreground">"{plan.quirk}"</span>
                      </div>
                      {plan.badge && (
                        <div className="mt-0.5 flex items-center gap-1">
                          {plan.highlight && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                            </span>
                          )}
                          <p className={`text-[10px] font-bold ${plan.highlight ? "text-primary animate-pulse" : "text-primary"}`}>
                            {plan.badge}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="ml-2 flex shrink-0 items-start gap-2 text-right">
                      {selectedPlan === plan.id && (
                        <span className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full ${plan.vip ? "bg-purple-500 text-white" : "bg-primary text-primary-foreground"}`}>
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                      <div>
                      <div className="flex items-baseline gap-0.5">
                        <span className={`font-black text-lg ${plan.highlight ? "text-primary" : ""}`}>
                          {plan.price}
                        </span>
                        {plan.sub && (
                          <span className="text-xs text-muted-foreground">{plan.sub}</span>
                        )}
                      </div>
                      {plan.highlight && (
                        <p className="text-[9px] font-bold text-primary">FREE now</p>
                      )}
                      {plan.vip && (
                        <p className="text-[9px] font-bold text-purple-400">one-time</p>
                      )}
                      </div>
                    </div>
                  </div>

                  {plan.vip && (
                    <div className="mb-3 grid gap-2">
                      {[
                        { icon: <Ticket className="h-3.5 w-3.5" />, text: "Private match events" },
                        { icon: <UtensilsCrossed className="h-3.5 w-3.5" />, text: "Partner venue perks" },
                      ].map((extra) => (
                        <div key={extra.text} className="flex items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-500/10 px-2.5 py-2 text-[11px] font-medium text-purple-200">
                          {extra.icon}
                          {extra.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Features */}
                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className={`h-3 w-3 shrink-0 ${plan.vip ? "text-purple-400" : plan.highlight ? "text-primary" : "text-primary/70"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </button>
            ))}

            {/* Footer nudge with Quirk */}
            <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5">
              <Image src="/quirk.png" alt="" width={28} height={28} className="shrink-0" />
              <p className="text-xs text-muted-foreground leading-snug">
                <span className="font-semibold text-foreground">No billing until Jan 2026.</span>{" "}
                You&apos;ll get a heads-up before anything changes. Quirk promises.
              </p>
            </div>
          </div>
        )}

        {/* ── Complete page ── */}
        {currentPage === "complete" && (
          <div className="flex flex-col items-center py-10 gap-5 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Bell className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">You&apos;re all set!</h2>
              <p className="text-sm text-muted-foreground text-balance max-w-xs">
                Timezone-accurate fixtures, live scores, and push notifications are ready.
              </p>
            </div>
            <div className="w-full rounded-2xl border border-primary/25 bg-primary/5 p-3 text-left">
              <p className="text-sm font-bold text-primary">Gold Launch Pass active</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                Premium features are unlocked during launch. Founder VIP will be available from Subscription after setup.
              </p>
            </div>
            <label className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-3 text-left">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => {
                  setTermsAccepted(event.target.checked)
                  triggerHaptic("selection")
                }}
                className="mt-0.5 h-5 w-5 rounded border-border accent-primary"
              />
              <span className="text-xs leading-5 text-muted-foreground">
                I accept the Sports Fixtures{" "}
                <Link href="/terms" className="font-semibold text-foreground underline underline-offset-2">
                  Terms and Conditions
                </Link>
                , including cookie use for essential app features, personalisation, analytics, ads, venue offers and partner offers, and I have read the{" "}
                <Link href="/privacy" className="font-semibold text-foreground underline underline-offset-2">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="z-30 shrink-0 border-t border-border bg-background/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
        <Button
          size="lg"
          className="h-12 w-full rounded-full bg-primary font-semibold text-primary-foreground shadow-lg hover:bg-primary/90"
          onClick={handleNext}
          disabled={currentPage === "complete" && !termsAccepted}
        >
          {currentPage === "complete"
            ? "Go to Fixtures"
            : currentPage === "sports"
              ? selectedSports.size + selectedCountries.size + selectedLeagues.size + selectedEvents.size > 0
                ? `Continue (${selectedSports.size + selectedCountries.size + selectedLeagues.size + selectedEvents.size})`
                : "Continue"
            : currentPage === "follow-teams" && followedTeams.size > 0
              ? `Continue (${followedTeams.size})`
              : "Continue"}
        </Button>
      </div>
    </div>
  )
}
