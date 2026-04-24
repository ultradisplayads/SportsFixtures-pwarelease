"use client"

import { useState, useEffect, useCallback } from "react"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Star,
  LayoutGrid,
} from "lucide-react"
import Link from "next/link"
import { getFavourites } from "@/lib/favourites-api"
import { getNextEventsByTeam } from "@/app/actions/sports-api"
import { getSFEvents } from "@/lib/sf-api"
import { formatInTimezone, getDisplayTimezone } from "@/components/timezone-selector"
import { triggerHaptic } from "@/lib/haptic-feedback"
import {
  getSavedCalendarMode,
  saveCalendarMode,
  type CalendarMode,
} from "@/lib/personalization"

// ── Types ─────────────────────────────────────────────────────────────────────

interface CalEvent {
  id: string
  date: Date
  homeTeam: string
  awayTeam: string
  league: string
  /** Which follow entity sourced this event */
  followType: "team" | "competition" | "player" | "venue" | "all"
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  )
}

const MONTH_NAMES = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
]
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"]

// ── Component ─────────────────────────────────────────────────────────────────

export function PersonalizedCalendar() {
  const [calMode,      setCalMode]     = useState<CalendarMode>("my-calendar")
  const [events,       setEvents]      = useState<CalEvent[]>([])
  const [loading,      setLoading]     = useState(true)
  const [expanded,     setExpanded]    = useState(false)
  const [viewDate,     setViewDate]    = useState(new Date())
  const [tz,           setTz]          = useState("local")
  const [selectedDay,  setSelectedDay] = useState<Date>(new Date())
  const [noFollows,    setNoFollows]   = useState(false)

  // Restore persisted mode on mount
  useEffect(() => {
    setCalMode(getSavedCalendarMode())
  }, [])

  // Timezone listener
  useEffect(() => {
    setTz(getDisplayTimezone())
    const handler = (e: Event) => setTz((e as CustomEvent).detail.tz)
    window.addEventListener("sf:timezone-change", handler)
    return () => window.removeEventListener("sf:timezone-change", handler)
  }, [])

  // Load events based on current mode
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setNoFollows(false)
      try {
        if (calMode === "my-calendar") {
          // ── Personalised mode ─────────────────────────────────────────────
          // Includes: followed teams, followed competitions, player-linked teams,
          // and venue-linked fixtures where ID overlap exists.
          const favs = await getFavourites()

          const teamIds = favs
            .filter((f) => f.entity_type === "team")
            .map((f) => f.entity_id)
            .slice(0, 6)

          // For competition follows, we try to load by league name via API
          // (getNextEventsByTeam accepts team OR league IDs on TSDB)
          const competitionIds = favs
            .filter(
              (f) => f.entity_type === "competition" || f.entity_type === "league"
            )
            .map((f) => f.entity_id)
            .slice(0, 3)

          // Player follows: use their known team as an indirect signal
          const playerTeamIds = favs
            .filter((f) => f.entity_type === "player")
            .map(
              (f) =>
                (f.entity_meta as Record<string, string> | undefined)?.teamId ||
                ""
            )
            .filter(Boolean)
            .slice(0, 2)

          const allIds = [
            ...new Set([...teamIds, ...competitionIds, ...playerTeamIds]),
          ]

          if (!allIds.length) {
            if (!cancelled) {
              setEvents([])
              setNoFollows(true)
            }
            return
          }

          const results = await Promise.allSettled(
            allIds.map((id) => getNextEventsByTeam(id))
          )

          if (cancelled) return

          const all: CalEvent[] = []
          results.forEach((r) => {
            if (r.status !== "fulfilled") return
            ;(r.value || []).forEach((ev: any) => {
              const d = new Date(ev.dateEvent || ev.strTimestamp || "")
              if (isNaN(d.getTime())) return

              // Determine follow source for display
              const followType: CalEvent["followType"] = teamIds.includes(
                String(ev.idTeam || "")
              )
                ? "team"
                : competitionIds.length
                ? "competition"
                : "player"

              all.push({
                id:        String(ev.idEvent || ev.id || Math.random()),
                date:      d,
                homeTeam:  ev.strHomeTeam || "",
                awayTeam:  ev.strAwayTeam || "",
                league:    ev.strLeague   || "",
                followType,
              })
            })
          })

          // Deduplicate by id
          const seen = new Set<string>()
          const deduped = all.filter((e) => {
            if (seen.has(e.id)) return false
            seen.add(e.id)
            return true
          })
          deduped.sort((a, b) => a.date.getTime() - b.date.getTime())
          setEvents(deduped)
        } else {
          // ── All Fixtures mode ─────────────────────────────────────────────
          const sfEvents = await getSFEvents({ limit: 50 })
          if (cancelled) return

          const all: CalEvent[] = sfEvents
            .filter((e) => e.dateEvent)
            .map((e) => {
              const d = new Date(`${e.dateEvent}T${e.strTime || "00:00"}Z`)
              return {
                id:        String(e.id || e.idEvent || Math.random()),
                date:      d,
                homeTeam:  e.strHomeTeam || (e.homeTeam as any)?.name || "",
                awayTeam:  e.strAwayTeam || (e.awayTeam as any)?.name || "",
                league:    e.strLeague   || e.league?.name || "",
                followType: "all" as const,
              }
            })
            .filter((e) => !isNaN(e.date.getTime()))
            .sort((a, b) => a.date.getTime() - b.date.getTime())
          setEvents(all)
        }
      } catch {
        /* silent failure — show empty state */
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [calMode])

  const switchMode = useCallback((mode: CalendarMode) => {
    triggerHaptic("selection")
    setCalMode(mode)
    saveCalendarMode(mode)
  }, [])

  const year       = viewDate.getFullYear()
  const month      = viewDate.getMonth()
  const firstDay   = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => { triggerHaptic("light"); setViewDate(new Date(year, month - 1, 1)) }
  const nextMonth = () => { triggerHaptic("light"); setViewDate(new Date(year, month + 1, 1)) }

  const dayEvents = events.filter((e) => isSameDay(e.date, selectedDay))
  const eventDays = new Set(
    events.map((e) => `${e.date.getFullYear()}-${e.date.getMonth()}-${e.date.getDate()}`)
  )
  const todayEventCount = events.filter((e) => isSameDay(e.date, new Date())).length

  const modeLabel = calMode === "my-calendar" ? "My Calendar" : "All Fixtures"
  const emptyLabel =
    calMode === "my-calendar"
      ? "No matches from your follows on this day."
      : "No fixtures on this day."

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header — always visible, tap to expand */}
      <button
        onClick={() => { triggerHaptic("selection"); setExpanded((v) => !v) }}
        className="flex w-full items-center justify-between px-3 py-2.5 hover:bg-accent/50 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">{modeLabel}</span>
          {todayEventCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
              {todayEventCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {!expanded && (
            <span className="text-xs">{MONTH_NAMES[month]} {year}</span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Mode toggle strip — shown when expanded */}
      {expanded && (
        <div className="flex gap-1 border-t border-border bg-muted/50 px-3 py-1.5">
          <button
            onClick={() => switchMode("my-calendar")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
              calMode === "my-calendar"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Star className="h-3 w-3" />
            My Calendar
          </button>
          <button
            onClick={() => switchMode("all-fixtures")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
              calMode === "all-fixtures"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-3 w-3" />
            All Fixtures
          </button>
        </div>
      )}

      {/* Expandable body */}
      {expanded && (
        <div className="border-t border-border px-3 pb-3 pt-2">
          {/* Month nav */}
          <div className="mb-2 flex items-center justify-between">
            <button onClick={prevMonth} className="rounded-full p-1 hover:bg-accent">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium">
              {MONTH_NAMES[month]} {year}
            </span>
            <button onClick={nextMonth} className="rounded-full p-1 hover:bg-accent">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day labels */}
          <div className="mb-1 grid grid-cols-7 text-center">
            {DAY_NAMES.map((d) => (
              <span key={d} className="text-[10px] font-medium text-muted-foreground">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day        = i + 1
              const d          = new Date(year, month, day)
              const key        = `${year}-${month}-${day}`
              const hasEvent   = eventDays.has(key)
              const isToday    = isSameDay(d, new Date())
              const isSelected = isSameDay(d, selectedDay)
              return (
                <button
                  key={day}
                  onClick={() => { triggerHaptic("selection"); setSelectedDay(d) }}
                  className={`relative flex h-8 w-full items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isToday
                      ? "border border-primary text-primary"
                      : "hover:bg-accent"
                  }`}
                >
                  {day}
                  {hasEvent && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Events for selected day */}
          <div className="mt-3 space-y-1.5">
            {loading ? (
              <p className="text-xs text-muted-foreground">Loading matches...</p>
            ) : noFollows ? (
              <p className="text-xs text-muted-foreground">
                Follow teams, competitions, or players to see a personalised calendar.
              </p>
            ) : dayEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground">{emptyLabel}</p>
            ) : (
              dayEvents.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/match/${ev.id}`}
                  className="flex items-center justify-between rounded-lg bg-accent/50 px-3 py-2 text-xs hover:bg-accent"
                >
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3 w-3 text-primary" />
                    <span className="font-medium">
                      {ev.homeTeam} vs {ev.awayTeam}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {formatInTimezone(ev.date, tz)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
