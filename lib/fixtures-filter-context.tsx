"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

// TheSportsDB league IDs by country slug
export const LEAGUES_BY_COUNTRY: Record<string, string[]> = {
  "united-kingdom": ["4328", "4330", "4346"], // EPL + Scottish Prem
  scotland: ["4330"],
  england: ["4328"],
  spain: ["4335"],
  germany: ["4331"],
  italy: ["4332"],
  france: ["4334"],
  thailand: ["4346", "4347"], // Thai League 1 & 2
  europe: ["4480"], // Champions League
  usa: ["4346"], // MLS — placeholder
}

// League IDs by sport slug
export const LEAGUES_BY_SPORT: Record<string, string[]> = {
  football: ["4330", "4328", "4480", "4335", "4331", "4332", "4334", "4346", "4347"],
  soccer: ["4330", "4328", "4480", "4335", "4331", "4332", "4334", "4346", "4347"],
  basketball: ["4387"], // NBA
  "ice-hockey": ["4380"], // NHL
  baseball: ["4424"], // MLB
  "american-football": ["4391"], // NFL
  cricket: ["4759"],
  tennis: [],
  rugby: ["4391"],
}

// Detect user's country from browser timezone
export function detectUserCountry(): string {
  if (typeof window === "undefined") return "united-kingdom"
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz.startsWith("Asia/Bangkok") || tz.startsWith("Asia/Phnom_Penh") || tz.startsWith("Asia/Vientiane")) {
      return "thailand"
    }
    if (tz.startsWith("Europe/London") || tz.startsWith("Europe/Belfast")) {
      return "united-kingdom"
    }
    if (tz.startsWith("Europe/Madrid") || tz.startsWith("Atlantic/Canary")) return "spain"
    if (tz.startsWith("Europe/Berlin") || tz.startsWith("Europe/Busingen")) return "germany"
    if (tz.startsWith("Europe/Rome")) return "italy"
    if (tz.startsWith("Europe/Paris")) return "france"
    if (tz.startsWith("America/New_York") || tz.startsWith("America/Chicago") || tz.startsWith("America/Los_Angeles"))
      return "usa"
    if (tz.startsWith("Europe/Edinburgh") || tz.startsWith("Europe/Glasgow")) return "scotland"
  } catch {}
  return "united-kingdom"
}

export interface NearbyFilter {
  lat: number
  lng: number
  radius: number
}

interface FixturesFilterContextType {
  selectedSport: string
  selectedCountry: string
  activeLeagueIds: string[]
  pinnedLeagueId: string | null
  nearbyFilter: NearbyFilter | null
  setSport: (sport: string) => void
  setCountry: (country: string) => void
  setPinnedLeague: (id: string | null) => void
  setNearbyFilter: (f: NearbyFilter | null) => void
}

const FixturesFilterContext = createContext<FixturesFilterContextType>({
  selectedSport: "football",
  selectedCountry: "united-kingdom",
  activeLeagueIds: ["4330", "4328", "4480"],
  pinnedLeagueId: null,
  nearbyFilter: null,
  setSport: () => {},
  setCountry: () => {},
  setPinnedLeague: () => {},
  setNearbyFilter: () => {},
})

export function FixturesFilterProvider({ children }: { children: ReactNode }) {
  const detectedCountry = detectUserCountry()

  const [selectedSport, setSelectedSport] = useState("football")
  const [selectedCountry, setSelectedCountry] = useState(detectedCountry)
  const [nearbyFilter, setNearbyFilter] = useState<NearbyFilter | null>(null)
  const [pinnedLeagueId, setPinnedLeagueId] = useState<string | null>(null)

  const getLeagueIds = useCallback((sport: string, country: string, pinned: string | null): string[] => {
    // If a specific league is pinned (via LeaguesSelector), show only that league
    if (pinned) return [pinned]

    const byCountry = LEAGUES_BY_COUNTRY[country] || []
    const bySport = LEAGUES_BY_SPORT[sport] || LEAGUES_BY_SPORT["football"]

    // Intersection: leagues that match both sport and country
    const intersection = byCountry.filter((id) => bySport.includes(id))

    // If no intersection, fall back to sport leagues then country leagues
    if (intersection.length > 0) return intersection
    if (byCountry.length > 0) return byCountry.slice(0, 6)
    return bySport.slice(0, 6)
  }, [])

  const activeLeagueIds = getLeagueIds(selectedSport, selectedCountry, pinnedLeagueId)

  const setSport = useCallback((sport: string) => {
    setPinnedLeagueId(null) // clear pinned league when sport changes
    setSelectedSport(sport)
  }, [])

  const setCountry = useCallback((country: string) => {
    setPinnedLeagueId(null) // clear pinned league when country changes
    setSelectedCountry(country)
  }, [])

  const setPinnedLeague = useCallback((id: string | null) => {
    setPinnedLeagueId(id)
  }, [])

  return (
    <FixturesFilterContext.Provider value={{ selectedSport, selectedCountry, activeLeagueIds, pinnedLeagueId, nearbyFilter, setSport, setCountry, setPinnedLeague, setNearbyFilter }}>
      {children}
    </FixturesFilterContext.Provider>
  )
}

export function useFixturesFilter() {
  return useContext(FixturesFilterContext)
}
