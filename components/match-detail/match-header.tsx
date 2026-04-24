"use client"

import { Star, ArrowLeft } from "lucide-react"
import { ShareButton } from "@/components/share-button"
import { SmartLogo } from "@/components/assets/smart-logo"
import { shareManager } from "@/lib/share-manager"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import { useFavourite } from "@/lib/use-favourite"
import { formatInPlayTime } from "@/lib/date-utils"
import { cacheSet, cacheGet } from "@/lib/entity-cache"
import { getEventDetails } from "@/app/actions/sports-api"
import { useRouter } from "next/navigation"
import { ReminderButton } from "@/components/reminder-button"

interface MatchHeaderProps {
  matchId: string
}

interface MatchData {
  home: { name: string; logo: string; score: number | null }
  away: { name: string; logo: string; score: number | null }
  status: string
  league: string
  stadium: string
  date: string
  idHomeTeam: string
  idAwayTeam: string
  idLeague: string
}

const PLACEHOLDER: MatchData = {
  home: { name: "Home", logo: "", score: null },
  away: { name: "Away", logo: "", score: null },
  status: "NS",
  league: "",
  stadium: "",
  date: "",
  idHomeTeam: "",
  idAwayTeam: "",
  idLeague: "",
}

export function MatchHeader({ matchId }: MatchHeaderProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [match, setMatch] = useState<MatchData>(PLACEHOLDER)
  const [loading, setLoading] = useState(true)
  const { favourited: isFavorite, toggle: toggleFavourite } = useFavourite(
    "team",
    match.idHomeTeam || matchId,
    { entity_name: `${match.home.name} vs ${match.away.name}`, entity_logo: match.home.logo || undefined }
  )


  useEffect(() => {
    async function load() {
      setLoading(true)

      // Show cached data immediately (stale-while-revalidate)
      const cached = cacheGet<MatchData>("match", matchId)
      if (cached) {
        setMatch(cached.data)
        if (!cached.stale) { setLoading(false); return }
        setLoading(false) // show stale, still revalidate in background
      }

      // SF API only accepts integer IDs — skip slugs like "celtic-1"
      // Use the local proxy so 404s are silently absorbed and never reach Next.js error capture
      const isNumericId = /^\d+$/.test(matchId)
      let sfEvent: any = null
      if (isNumericId) {
        try {
          const r = await fetch(`/api/events/${matchId}`, { cache: "no-store" })
          if (r.ok) {
            const j = await r.json()
            sfEvent = j?.success === false ? null : (j?.data ?? j ?? null)
          }
        } catch { /* fall through */ }
      }
      try {
        if (sfEvent && (sfEvent.strHomeTeam || sfEvent.homeTeam)) {
          const sfMatchData: MatchData = {
            home: {
              name: sfEvent.homeTeam?.name || sfEvent.strHomeTeam || "Home",
              logo: sfEvent.homeTeam?.badge || sfEvent.strHomeTeamBadge || "",
              score: sfEvent.intHomeScore != null ? Number(sfEvent.intHomeScore) : null,
            },
            away: {
              name: sfEvent.awayTeam?.name || sfEvent.strAwayTeam || "Away",
              logo: sfEvent.awayTeam?.badge || sfEvent.strAwayTeamBadge || "",
              score: sfEvent.intAwayScore != null ? Number(sfEvent.intAwayScore) : null,
            },
            status: sfEvent.strProgress || sfEvent.strStatus || "NS",
            league: sfEvent.league?.name || sfEvent.strLeague || "",
            stadium: sfEvent.strVenue || "",
            date: sfEvent.dateEvent || "",
            idHomeTeam: sfEvent.idHomeTeam as string || sfEvent.homeTeam?.id as string || "",
            idAwayTeam: sfEvent.idAwayTeam as string || sfEvent.awayTeam?.id as string || "",
            idLeague: sfEvent.league?.id as string || "",
          }
          cacheSet("match", matchId, sfMatchData)
          setMatch(sfMatchData)
          return
        }
      } catch { /* fall through to TSDB */ }

      // Fall back to TSDB v1
      try {
        const event = await getEventDetails(matchId)
        if (event) {
          const tsdbMatchData: MatchData = {
            home: {
              name: event.strHomeTeam,
              logo: event.strHomeTeamBadge || "",
              score: event.intHomeScore != null ? Number(event.intHomeScore) : null,
            },
            away: {
              name: event.strAwayTeam,
              logo: event.strAwayTeamBadge || "",
              score: event.intAwayScore != null ? Number(event.intAwayScore) : null,
            },
            status: event.strProgress || event.strStatus || "NS",
            league: event.strLeague || "",
            stadium: event.strVenue || "",
            date: event.dateEvent || "",
            idHomeTeam: event.idHomeTeam,
            idAwayTeam: event.idAwayTeam,
            idLeague: event.idLeague,
          }
          cacheSet("match", matchId, tsdbMatchData)
          setMatch(tsdbMatchData)
        }
      } catch {
        // keep placeholder
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [matchId])

  const handleFavorite = async () => {
    await toggleFavourite()
    toast({
      title: isFavorite ? "Removed from favourites" : "Added to favourites",
      description: `${match.home.name} vs ${match.away.name}`,
    })
  }

  const shareData = shareManager.getMatchShareData(match.home.name, match.away.name, matchId)
  const inPlay = formatInPlayTime(match.status)

  const scoreDisplay = (score: number | null) =>
    score != null ? String(score) : inPlay.isFinished ? "0" : "-"

  return (
    <div className="border-b border-border bg-card">
      {/* Back + League bar */}
      <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <p className="flex-1 text-center text-xs font-medium text-muted-foreground">{match.league}</p>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              inPlay.isLive ? "bg-green-500 animate-pulse" : inPlay.isFinished ? "bg-destructive" : "bg-muted-foreground/50"
            }`}
          />
          <p className={`text-sm font-bold ${
            inPlay.isLive ? "text-green-500" : inPlay.isFinished ? "text-destructive" : "text-muted-foreground"
          }`}>
            {inPlay.display}
          </p>
        </div>
      </div>

      {/* Score */}
      <div className={`px-4 py-6 transition-opacity ${loading ? "opacity-40" : "opacity-100"}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 flex-col items-center gap-3">
            <SmartLogo
              name={match.home.name}
              src={match.home.logo || null}
              className="h-16 w-16 object-contain"
            />
            <p className="text-center text-sm font-semibold leading-tight">{match.home.name}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold tabular-nums">{scoreDisplay(match.home.score)}</span>
            <span className="text-2xl font-bold text-muted-foreground">-</span>
            <span className="text-4xl font-bold tabular-nums">{scoreDisplay(match.away.score)}</span>
          </div>

          <div className="flex flex-1 flex-col items-center gap-3">
            <SmartLogo
              name={match.away.name}
              src={match.away.logo || null}
              className="h-16 w-16 object-contain"
            />
            <p className="text-center text-sm font-semibold leading-tight">{match.away.name}</p>
          </div>
        </div>

        {match.stadium && (
          <p className="mt-4 text-center text-xs text-muted-foreground">{match.stadium}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-border/50 px-4 py-3">
        <button
          onClick={handleFavorite}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            isFavorite ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-accent"
          }`}
        >
          <Star className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
          {isFavorite ? "Favorited" : "Favourite"}
        </button>
        <ReminderButton
          eventId={matchId}
          homeTeam={match.home.name}
          awayTeam={match.away.name}
          size="md"
          iconOnly={false}
          className="flex-1 justify-center"
        />
        <ShareButton shareData={shareData} variant="outline" size="default" />
      </div>
    </div>
  )
}
