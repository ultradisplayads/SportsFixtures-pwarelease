"use client"

import { ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getSFLeagueById } from "@/lib/sf-api"
import { SmartImage } from "@/components/assets/smart-image"
import { normalizeCompetitionLogo } from "@/lib/asset-normalization"

interface LeagueHeaderProps {
  leagueId: string
}

export function LeagueHeader({ leagueId }: LeagueHeaderProps) {
  const router = useRouter()
  const [leagueName, setLeagueName] = useState("League")
  const [logoSet, setLogoSet] = useState<{ primary: string | null | undefined; fallbackLabel: string | null | undefined }>({ primary: null, fallbackLabel: null })

  useEffect(() => {
    getSFLeagueById(leagueId).then((league) => {
      if (league) {
        const name = league.name || league.strLeague || "League"
        setLeagueName(name)
        // Normalize via central resolver — handles strBadge, logo, strLeagueBadge, etc.
        const set = normalizeCompetitionLogo(league as unknown as Record<string, unknown>, name)
        setLogoSet({ primary: set.primary, fallbackLabel: set.fallbackLabel })
      }
    })
  }, [leagueId])

  return (
    <div className="border-b border-border bg-card">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 hover:bg-accent"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <SmartImage
          kind="competition_logo"
          src={logoSet.primary}
          fallbackLabel={logoSet.fallbackLabel ?? leagueName}
          alt={leagueName}
          className="h-7 w-7 object-contain"
          width={28}
          height={28}
        />
        <h1 className="text-lg font-bold">{leagueName}</h1>
      </div>
    </div>
  )
}
