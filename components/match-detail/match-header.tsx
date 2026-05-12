"use client"

import { Star, ArrowLeft, Clock, MapPin, CloudSun } from "lucide-react"
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
  time: string
  timeLocal: string
  timestamp: string
  idHomeTeam: string
  idAwayTeam: string
  idLeague: string
  homeForm: string
  awayForm: string
}

const PLACEHOLDER: MatchData = {
  home: { name: "Home", logo: "", score: null },
  away: { name: "Away", logo: "", score: null },
  status: "NS",
  league: "",
  stadium: "",
  date: "",
  time: "",
  timeLocal: "",
  timestamp: "",
  idHomeTeam: "",
  idAwayTeam: "",
  idLeague: "",
  homeForm: "",
  awayForm: "",
}

type WeatherInfo = {
  label: string
  temperature?: number
  precipitation?: number
  venueTimezone?: string
}

function buildKickoffDate(match: MatchData): Date | null {
  const raw = match.timestamp || (match.date ? `${match.date}T${match.time || match.timeLocal || "00:00:00"}` : "")
  if (!raw) return null
  const normalized = raw.includes("T") && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw) ? `${raw}Z` : raw
  const date = new Date(normalized)
  return Number.isFinite(date.getTime()) ? date : null
}

function formatKickoff(date: Date | null, timeZone?: string) {
  if (!date) return null
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(date)
}

function weatherCodeLabel(code?: number) {
  if (code == null) return "Forecast TBC"
  if (code === 0) return "Clear"
  if ([1, 2].includes(code)) return "Partly cloudy"
  if (code === 3) return "Cloudy"
  if ([45, 48].includes(code)) return "Fog"
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "Rain possible"
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow possible"
  if ([95, 96, 99].includes(code)) return "Storm risk"
  return "Forecast"
}

function FormDots({ form, team }: { form: string; team: string }) {
  const chars = form.toUpperCase().split("").filter(Boolean).slice(0, 5)
  if (!chars.length) return <span className="text-[11px] text-muted-foreground">Form TBC</span>
  return (
    <div className="flex items-center gap-1" aria-label={`${team} last 5 form ${form}`}>
      {chars.map((char, index) => (
        <span
          key={`${char}-${index}`}
          title={char === "W" ? "Win" : char === "D" ? "Draw" : "Loss"}
          className={`h-2.5 w-2.5 rounded-full ${
            char === "W" ? "bg-green-500" : char === "D" ? "bg-yellow-400" : "bg-red-500"
          }`}
        />
      ))}
    </div>
  )
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
            time: sfEvent.strTime || "",
            timeLocal: sfEvent.strTimeLocal || "",
            timestamp: sfEvent.strTimestamp || "",
            idHomeTeam: sfEvent.idHomeTeam as string || sfEvent.homeTeam?.id as string || "",
            idAwayTeam: sfEvent.idAwayTeam as string || sfEvent.awayTeam?.id as string || "",
            idLeague: sfEvent.league?.id as string || "",
            homeForm: "",
            awayForm: "",
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
          const providerEvent = event as any
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
            time: event.strTime || "",
            timeLocal: providerEvent.strTimeLocal || "",
            timestamp: providerEvent.strTimestamp || "",
            idHomeTeam: event.idHomeTeam,
            idAwayTeam: event.idAwayTeam,
            idLeague: event.idLeague,
            homeForm: "",
            awayForm: "",
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

  useEffect(() => {
    let cancelled = false
    async function loadForm() {
      try {
        const res = await fetch(`/api/match-center/${matchId}`, { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        const rows = Array.isArray(data?.standings?.data) ? data.standings.data : []
        const home = rows.find((row: any) => row.isHomeTeam)?.form || ""
        const away = rows.find((row: any) => row.isAwayTeam)?.form || ""
        if (!cancelled && (home || away)) {
          setMatch((current) => ({ ...current, homeForm: home, awayForm: away }))
        }
      } catch {
        // Form stays as TBC when standings/form are unavailable.
      }
    }
    loadForm()
    return () => { cancelled = true }
  }, [matchId])

  const [weather, setWeather] = useState<WeatherInfo | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadWeather() {
      const kickoff = buildKickoffDate(match)
      if (!match.stadium || !kickoff) {
        setWeather(null)
        return
      }

      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(match.stadium)}&count=1&language=en&format=json`,
        )
        const geo = await geoRes.json()
        const place = geo?.results?.[0]
        if (!place?.latitude || !place?.longitude) return

        const forecastRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&hourly=temperature_2m,precipitation_probability,weather_code&timezone=${encodeURIComponent(place.timezone || "auto")}`,
        )
        const forecast = await forecastRes.json()
        const hourlyTimes: string[] = forecast?.hourly?.time ?? []
        const targetHour = kickoff.toISOString().slice(0, 13)
        let index = hourlyTimes.findIndex((time) => time.startsWith(targetHour))
        if (index < 0) index = 0

        const nextWeather: WeatherInfo = {
          label: weatherCodeLabel(forecast?.hourly?.weather_code?.[index]),
          temperature: forecast?.hourly?.temperature_2m?.[index],
          precipitation: forecast?.hourly?.precipitation_probability?.[index],
          venueTimezone: place.timezone,
        }
        if (!cancelled) setWeather(nextWeather)
      } catch {
        if (!cancelled) setWeather({ label: "Forecast TBC" })
      }
    }
    loadWeather()
    return () => { cancelled = true }
  }, [match.stadium, match.date, match.time, match.timeLocal, match.timestamp])

  const handleFavorite = async () => {
    await toggleFavourite()
    toast({
      title: isFavorite ? "Removed from favourites" : "Added to favourites",
      description: `${match.home.name} vs ${match.away.name}`,
    })
  }

  const shareData = shareManager.getMatchShareData(match.home.name, match.away.name, matchId)
  const inPlay = formatInPlayTime(match.status)
  const kickoff = buildKickoffDate(match)
  const localKickoff = formatKickoff(kickoff)
  const venueKickoff = formatKickoff(kickoff, weather?.venueTimezone)

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

        <div className="mt-5 grid gap-2 rounded-xl border border-border bg-background/70 p-3 text-xs sm:grid-cols-3">
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">Kickoff</p>
              <p className="text-muted-foreground">{localKickoff || "Start time TBC"}</p>
              <p className="text-muted-foreground">
                Venue: {venueKickoff || (match.timeLocal ? `${match.date} ${match.timeLocal}` : "Time TBC")}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">Stadium</p>
              <p className="text-muted-foreground">{match.stadium || "Venue TBC"}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CloudSun className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-semibold text-foreground">Expected weather</p>
              <p className="text-muted-foreground">
                {weather
                  ? `${weather.label}${weather.temperature != null ? `, ${Math.round(weather.temperature)}°C` : ""}${weather.precipitation != null ? `, ${weather.precipitation}% rain` : ""}`
                  : "Forecast loading"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between rounded-lg bg-background/70 px-3 py-2">
            <span className="truncate font-medium">{match.home.name} last 5</span>
            <FormDots form={match.homeForm} team={match.home.name} />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-background/70 px-3 py-2">
            <span className="truncate font-medium">{match.away.name} last 5</span>
            <FormDots form={match.awayForm} team={match.away.name} />
          </div>
        </div>
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
