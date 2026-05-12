"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useFixturesFilter } from "@/lib/fixtures-filter-context"

export function FixturesUrlSync() {
  const searchParams = useSearchParams()
  const { setSport, setCountry, setPinnedLeague } = useFixturesFilter()

  useEffect(() => {
    const sport = searchParams.get("sport")
    const country = searchParams.get("country")
    const competition = searchParams.get("competition") || searchParams.get("league")

    if (competition) {
      setPinnedLeague(competition)
      return
    }

    setPinnedLeague(null)
    if (sport) setSport(sport)
    if (country) setCountry(country)
  }, [searchParams, setCountry, setPinnedLeague, setSport])

  return null
}
