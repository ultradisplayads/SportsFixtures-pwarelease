"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import {
  Tv, Radio, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Calendar, X, Crown, Lock,
} from "lucide-react"
import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"
import { SkeletonLoader } from "@/components/skeleton-loader"
import { formatInTimezone, getDisplayTimezone } from "@/components/timezone-selector"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { useSubscription } from "@/lib/use-subscription"
import Link from "next/link"
import { useQuirkSlot } from "@/components/quirk-pop-in"
import {
  getAffiliate,
  getAffiliateStreamingPartners,
} from "@/lib/affiliate-registry"
import { AdInjectionRow } from "@/components/ad-injection"

// ─── Types ───────────────────────────────────────────────────────────────────

interface TVFixture {
  id: string
  event: string
  homeTeam: string
  awayTeam: string
  league: string
  sport: string
  date: string
  time: string
  channels: string[]
  streamingServices: string[]
  thumbnail?: string | null
  isLive?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SPORT_OPTIONS = [
  "All Sports",
  "Football",
  "Cricket",
  "Rugby",
  "Tennis",
  "Basketball",
  "American Football",
  "Golf",
  "Boxing",
  "Motorsport",
]

const CHANNEL_META: Record<string, string> = {
  "Sky Sports":  "bg-sky-600",
  "BBC One":     "bg-red-700",
  "BBC Two":     "bg-red-600",
  "ITV":         "bg-blue-700",
  "Channel 4":   "bg-purple-700",
  "TNT Sports":  "bg-orange-600",
  "BT Sport":    "bg-orange-600",
  "Amazon":      "bg-yellow-600",
  "DAZN":        "bg-green-700",
  "ESPN":        "bg-red-600",
  "beIN SPORTS": "bg-green-800",
}

function channelColor(ch: string) {
  const key = Object.keys(CHANNEL_META).find((k) => ch.includes(k))
  return key ? CHANNEL_META[key] : "bg-zinc-600"
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function isoDate(d: Date) {
  return d.toISOString().split("T")[0]
}

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function sameDay(a: Date, b: Date) {
  return isoDate(a) === isoDate(b)
}

function calLabel(d: Date) {
  const today = new Date()
  if (sameDay(d, today)) return "Today"
  if (sameDay(d, addDays(today, 1))) return "Tomorrow"
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
}

// ─── Tiny Dropdown ────────────────────────────────────────────────────────────
// The panel is rendered in a portal at `position: fixed` so it escapes any
// ancestor with overflow-x-auto or overflow-hidden (e.g. the sticky filter row).

function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  const btnRef = useRef<HTMLButtonElement>(null)

  const calcPosition = useCallback(() => {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setPanelStyle({
      position: "fixed",
      top: r.bottom + 4,
      left: r.left,
      minWidth: Math.max(r.width, 160),
      zIndex: 9999,
    })
  }, [])

  const toggle = () => {
    triggerHaptic("selection")
    if (!open) calcPosition()
    setOpen((o) => !o)
  }

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return
      setOpen(false)
    }
    const reposition = () => calcPosition()
    document.addEventListener("mousedown", close)
    window.addEventListener("scroll", reposition, true)
    window.addEventListener("resize", reposition)
    return () => {
      document.removeEventListener("mousedown", close)
      window.removeEventListener("scroll", reposition, true)
      window.removeEventListener("resize", reposition)
    }
  }, [open, calcPosition])

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        onClick={toggle}
        className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
      >
        <span className="max-w-[110px] truncate">{value === options[0] ? label : value}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div style={panelStyle} className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {options.map((opt) => (
            <button
              key={opt}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => { triggerHaptic("selection"); onChange(opt); setOpen(false) }}
              className={`flex w-full items-center px-4 py-2.5 text-sm transition-colors hover:bg-accent ${
                opt === value ? "font-semibold text-primary" : "text-foreground"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}

// ─── Calendar Picker ──────────────────────────────────────────────────────────
// Also portal-rendered at position:fixed so overflow-x-auto on the filter row
// does not clip it.

function CalendarPicker({
  selected,
  onSelect,
  onClose,
  anchorRect,
}: {
  selected: Date
  onSelect: (d: Date) => void
  onClose: () => void
  anchorRect: DOMRect | null
}) {
  const today = new Date()
  const maxDate = addDays(today, 30)
  const [viewMonth, setViewMonth] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1))

  const prevMonth = addDays(viewMonth, -1)
  prevMonth.setDate(1)
  const nextMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)

  const canGoPrev = viewMonth > new Date(today.getFullYear(), today.getMonth(), 1)
  const canGoNext = nextMonth <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)

  // Build calendar grid
  const firstDow = viewMonth.getDay() === 0 ? 6 : viewMonth.getDay() - 1 // Mon-first
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate()
  const cells: (Date | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), i + 1)),
  ]

  const panelStyle: React.CSSProperties = anchorRect
    ? { position: "fixed", top: anchorRect.bottom + 4, left: anchorRect.left, zIndex: 9999, width: 288 }
    : { position: "fixed", top: 60, left: 16, zIndex: 9999, width: 288 }

  const panel = (
    <div style={panelStyle} className="rounded-2xl border border-border bg-card p-3 shadow-xl">
      {/* Month nav */}
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => canGoPrev && setViewMonth(prevMonth)}
          disabled={!canGoPrev}
          className="rounded-lg p-1.5 hover:bg-accent disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">
          {viewMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={() => canGoNext && setViewMonth(nextMonth)}
          disabled={!canGoNext}
          className="rounded-lg p-1.5 hover:bg-accent disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {["M","T","W","T","F","S","S"].map((d, i) => (
          <span key={i} className="text-[10px] font-semibold text-muted-foreground py-1">{d}</span>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <span key={i} />
          const isPast = day < today && !sameDay(day, today)
          const isOver = day > maxDate
          const isSel = sameDay(day, selected)
          const isToday = sameDay(day, today)
          const disabled = isPast || isOver
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => { onSelect(day); onClose() }}
              className={`rounded-lg py-1.5 text-sm font-medium transition-colors ${
                isSel
                  ? "bg-primary text-primary-foreground"
                  : isToday
                  ? "border border-primary text-primary"
                  : disabled
                  ? "text-muted-foreground/30"
                  : "hover:bg-accent"
              }`}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )

  if (typeof document === "undefined") return null
  return createPortal(panel, document.body)
}

// ─── Affiliate Channel Chip ───────────────────────────────────────────────────

function ChannelChip({ name, small = false }: { name: string; small?: boolean }) {
  const aff = getAffiliate(name)
  const bg  = aff?.color ?? channelColor(name)
  const cls = small
    ? `hidden sm:flex rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${bg}`
    : `flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white ${bg}`

  if (aff?.url) {
    return (
      <a
        href={aff.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={(e) => e.stopPropagation()}
        className={`${cls} underline-offset-2 hover:opacity-90 transition-opacity`}
        aria-label={`Watch on ${name}${aff.isAffiliate ? " (affiliate link)" : ""}`}
      >
        {!small && <Tv className="h-3 w-3 shrink-0" />}
        {small ? name.split(" ")[0] : name}
        {aff.isAffiliate && !small && (
          <span className="ml-0.5 rounded bg-white/20 px-0.5 text-[9px] font-bold leading-none">AD</span>
        )}
      </a>
    )
  }

  return (
    <span className={cls}>
      {!small && <Tv className="h-3 w-3 shrink-0" />}
      {small ? name.split(" ")[0] : name}
    </span>
  )
}

// ─── Streaming Partner Chip ───────────────────────────────────────────────────

function StreamingChip({ name, url, isAffiliate }: { name: string; url: string; isAffiliate: boolean }) {
  return (
    <a
      href={url}
      target="_blank"
      rel={`noopener noreferrer${isAffiliate ? " sponsored" : ""}`}
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium hover:bg-accent transition-colors"
      aria-label={`${name}${isAffiliate ? " (affiliate link)" : ""}`}
    >
      <Radio className="h-3 w-3 text-muted-foreground shrink-0" />
      {name}
      {isAffiliate && (
        <span className="ml-0.5 rounded bg-primary/10 px-0.5 text-[9px] font-bold text-primary leading-none">AD</span>
      )}
    </a>
  )
}

// ─── TV Card (click to expand) ────────────────────────────────────────────────

function TVCard({ fixture, tz }: { fixture: TVFixture; tz: string }) {
  const [expanded, setExpanded] = useState(false)

  const kickoff = fixture.date && fixture.time
    ? new Date(`${fixture.date}T${fixture.time.length === 5 ? fixture.time + ":00" : fixture.time}`)
    : null
  const kickoffStr = kickoff && !isNaN(kickoff.getTime()) ? formatInTimezone(kickoff, tz) : null

  // Streaming services: from fixture data + affiliate partners not already listed
  const fixtureStreamingNames = new Set(fixture.streamingServices.map((s) => s.toLowerCase()))
  const affiliateStreaming = getAffiliateStreamingPartners().filter(
    (p) => !fixtureStreamingNames.has(p.name.toLowerCase()),
  )

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-sm">
      {/* Summary row — always visible, click to expand */}
      <button
        className="flex w-full items-center gap-3 p-3 text-left"
        onClick={() => { triggerHaptic("selection"); setExpanded((e) => !e) }}
        aria-expanded={expanded}
      >
        {/* Time badge */}
        <div className="flex shrink-0 flex-col items-center justify-center rounded-lg bg-secondary/60 px-2.5 py-2 min-w-[52px]">
          {fixture.isLive ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>
          ) : kickoffStr ? (
            <span className="text-sm font-bold text-primary leading-tight">{kickoffStr}</span>
          ) : (
            <span className="text-xs text-muted-foreground">TBC</span>
          )}
        </div>

        {/* Match info */}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-muted-foreground truncate">{fixture.league}</p>
          <p className="mt-0.5 text-sm font-semibold leading-snug">
            {fixture.homeTeam && fixture.awayTeam
              ? <>{fixture.homeTeam} <span className="font-normal text-muted-foreground">vs</span> {fixture.awayTeam}</>
              : fixture.event}
          </p>
        </div>

        {/* Channel pill preview + chevron */}
        <div className="flex shrink-0 items-center gap-1.5">
          {fixture.channels[0] && <ChannelChip name={fixture.channels[0]} small />}
          {expanded
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border/60 bg-secondary/10 px-3 py-3 space-y-3">
          {/* TV channels — affiliate links where available */}
          {fixture.channels.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Broadcast on</p>
              <div className="flex flex-wrap gap-2">
                {fixture.channels.map((ch) => <ChannelChip key={ch} name={ch} />)}
              </div>
            </div>
          )}

          {/* Streaming — fixture services first, then affiliate partners */}
          {(fixture.streamingServices.length > 0 || affiliateStreaming.length > 0) && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Watch online</p>
              <div className="flex flex-wrap gap-2">
                {fixture.streamingServices.map((s) => {
                  const aff = getAffiliate(s)
                  return (
                    <StreamingChip
                      key={s}
                      name={s}
                      url={aff?.url ?? "#"}
                      isAffiliate={aff?.isAffiliate ?? false}
                    />
                  )
                })}
                {affiliateStreaming.map((p) => (
                  <StreamingChip key={p.name} name={p.name} url={p.url} isAffiliate={p.isAffiliate} />
                ))}
              </div>
            </div>
          )}

          {/* Sport + League */}
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>{fixture.sport}</span>
            {fixture.league && <><span>·</span><span>{fixture.league}</span></>}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────���───────────────────────────────────

export default function TVSchedulePage() {
  const today = new Date()
  const { tier, effectiveTier, launchPassActive } = useSubscription()
  const quirkHeaderRef  = useQuirkSlot("tv-header-right")
  const quirkContentRef = useQuirkSlot("tv-content-mid")
  const quirkSearchRef  = useQuirkSlot("tv-search-right")
  // Show upgrade prompts for Bronze users (even during Launch Pass — so they understand the offer)
  const isBronze = tier === "bronze"

  const [selectedDate, setSelectedDate] = useState<Date>(today)
  const [sportFilter, setSportFilter] = useState("All Sports")
  const [search, setSearch] = useState("")
  const [tz, setTz] = useState("local")
  const [fixtures, setFixtures] = useState<TVFixture[]>([])
  const [loading, setLoading] = useState(true)
  const [isEmpty, setIsEmpty] = useState(false)
  const [calOpen, setCalOpen] = useState(false)
  const [calAnchorRect, setCalAnchorRect] = useState<DOMRect | null>(null)
  const calBtnRef = useRef<HTMLButtonElement>(null)

  // Close calendar on outside click
  useEffect(() => {
    if (!calOpen) return
    const h = (e: MouseEvent) => {
      if (calBtnRef.current && calBtnRef.current.contains(e.target as Node)) return
      setCalOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [calOpen])

  useEffect(() => {
    setTz(getDisplayTimezone())
    const h = (e: Event) => setTz((e as CustomEvent).detail.tz)
    window.addEventListener("sf:timezone-change", h)
    return () => window.removeEventListener("sf:timezone-change", h)
  }, [])

  // Derive dateKey from selectedDate
  const dateKey = useMemo(() => {
    if (sameDay(selectedDate, today)) return "today"
    if (sameDay(selectedDate, addDays(today, 1))) return "tomorrow"
    const dow = selectedDate.getDay()
    if (sameDay(selectedDate, today) || dow === 6 || dow === 0) return "weekend"
    return isoDate(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setFixtures([])
      setIsEmpty(false)
      try {
        const params = new URLSearchParams({ date: dateKey })
        if (sportFilter !== "All Sports") params.set("sport", sportFilter)
        const res = await fetch(`/api/tv?${params}`, { cache: "no-store" })
        const json = res.ok ? await res.json() : { data: [] }
        const data: TVFixture[] = (json?.data ?? []).map((f: any) => ({
          id: String(f.id ?? Math.random()),
          event: f.event ?? `${f.homeTeam} vs ${f.awayTeam}`,
          homeTeam: f.homeTeam ?? "",
          awayTeam: f.awayTeam ?? "",
          league: f.league ?? f.competition ?? "",
          sport: f.sport ?? "Football",
          date: f.date ?? "",
          time: f.time ?? "",
          channels: Array.isArray(f.channels) ? f.channels : [],
          streamingServices: Array.isArray(f.streamingServices) ? f.streamingServices : [],
          thumbnail: f.thumbnail ?? null,
          isLive: Boolean(f.isLive),
        }))

        setFixtures(data)
        setIsEmpty(data.length === 0)
      } catch {
        setIsEmpty(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [dateKey, sportFilter])

  const filtered = useMemo(() => {
    let list = fixtures
    if (sportFilter !== "All Sports") list = list.filter((f) => f.sport?.toLowerCase().includes(sportFilter.toLowerCase()))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (f) =>
          f.homeTeam.toLowerCase().includes(q) ||
          f.awayTeam.toLowerCase().includes(q) ||
          f.league.toLowerCase().includes(q) ||
          f.channels.some((c) => c.toLowerCase().includes(q))
      )
    }
    return list
  }, [fixtures, sportFilter, search])

  const liveFixtures = filtered.filter((f) => f.isLive)
  // Sort upcoming by time, deduplicated by id
  const upcoming = useMemo(() => {
    const seen = new Set<string>()
    return filtered
      .filter((f) => {
        if (f.isLive || seen.has(f.id)) return false
        seen.add(f.id)
        return true
      })
      .sort((a, b) => {
        const ta = a.date && a.time ? `${a.date}T${a.time}` : ""
        const tb = b.date && b.time ? `${b.date}T${b.time}` : ""
        return ta.localeCompare(tb)
      })
  }, [filtered])

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <HeaderMenu />

      {/* Sticky header — overflow-visible so dropdowns/calendars escape the stacking context */}
      <div className="sticky top-0 z-40 border-b border-border bg-card overflow-visible">
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <Tv className="h-5 w-5 shrink-0 text-primary" />
          <h1 className="text-lg font-bold">TV Schedule</h1>
          {/* Quirk blank-space slot — right of title in header */}
          <div ref={quirkHeaderRef} className="ml-auto h-8 w-24" aria-hidden="true" />
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {/* Date dropdown / calendar trigger */}
          <div className="relative shrink-0">
            <button
              ref={calBtnRef}
              onClick={() => {
                triggerHaptic("selection")
                if (!calOpen && calBtnRef.current) {
                  setCalAnchorRect(calBtnRef.current.getBoundingClientRect())
                }
                setCalOpen((o) => !o)
              }}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                calOpen ? "border-primary bg-primary/5 text-primary" : "border-border bg-card hover:bg-accent"
              }`}
            >
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{calLabel(selectedDate)}</span>
              <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${calOpen ? "rotate-180" : ""}`} />
            </button>

            {calOpen && (
              <CalendarPicker
                selected={selectedDate}
                onSelect={(d) => { setSelectedDate(d); triggerHaptic("selection") }}
                onClose={() => setCalOpen(false)}
                anchorRect={calAnchorRect}
              />
            )}
          </div>

          {/* Sport dropdown */}
          <Dropdown
            label="All Sports"
            value={sportFilter}
            options={SPORT_OPTIONS}
            onChange={setSportFilter}
          />

          {/* Upgrade pill — shown for Bronze users */}
          {isBronze && (
            <Link
              href="/premium"
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-400 px-3 py-2 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              onClick={() => triggerHaptic("selection")}
            >
              <Crown className="h-3.5 w-3.5" />
              Go Gold — Free until Dec 31
            </Link>
          )}

          {/* Clear filters */}
          {(sportFilter !== "All Sports" || !sameDay(selectedDate, today)) && (
            <button
              onClick={() => { setSportFilter("All Sports"); setSelectedDate(today); triggerHaptic("selection") }}
              className="flex shrink-0 items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:bg-accent"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Search + right-edge Quirk slot */}
        <div className="relative flex items-center gap-2 px-4 pb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team, league or channel..."
              className="w-full rounded-xl border border-border bg-secondary/40 py-2 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {/* Quirk blank-space slot — right of search bar */}
          <div ref={quirkSearchRef} className="h-9 w-12 shrink-0" aria-hidden="true" />
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 space-y-4 p-4">
        {loading ? (
          <div className="space-y-3">
            <SkeletonLoader /><SkeletonLoader /><SkeletonLoader /><SkeletonLoader />
          </div>
        ) : isEmpty || filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">No TV listings found</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {search || sportFilter !== "All Sports"
                ? "Try adjusting your search or filters."
                : "No televised matches found for this date. Try a different day or check back later."}
            </p>
          </div>
        ) : (
          <>
            {/* Quirk blank-space slot — sits in the right gutter of content area */}
            <div ref={quirkContentRef} className="pointer-events-none absolute right-2 top-1/3 h-16 w-16" aria-hidden="true" />

            {/* Live now */}
            {liveFixtures.length > 0 && (
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                  <h2 className="text-xs font-bold uppercase tracking-widest">Live Now</h2>
                </div>
                <div className="space-y-2">
                  {liveFixtures.map((f) => <TVCard key={f.id} fixture={f} tz={tz} />)}
                </div>
              </section>
            )}

            {/* Upgrade card — shown inline for Bronze users */}
            {isBronze && (
              <div className="rounded-2xl overflow-hidden border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-amber-400/5 to-transparent">
                {/* Header */}
                <div className="flex items-center gap-3 p-4 pb-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-amber-400">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight">
                      {launchPassActive ? "Gold Launch Pass — Free until 31 Dec" : "Unlock Gold"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {launchPassActive
                        ? "You're using Gold features free. Lock in Founder pricing before it ends."
                        : "Upgrade from £2.99/mo — ad-free, all alerts, full TV guide"}
                    </p>
                  </div>
                </div>

                {/* Feature row */}
                <div className="grid grid-cols-3 divide-x divide-yellow-500/20 border-t border-yellow-500/20">
                  {[
                    { label: "Ad-free", sub: "No interruptions" },
                    { label: "All alerts", sub: "5 min to 24h" },
                    { label: "All channels", sub: "Full TV guide" },
                  ].map(({ label, sub }) => (
                    <div key={label} className="flex flex-col items-center py-2.5 text-center">
                      <span className="text-xs font-semibold">{label}</span>
                      <span className="text-[10px] text-muted-foreground">{sub}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  href="/premium"
                  onClick={() => triggerHaptic("medium")}
                  className="flex items-center justify-between border-t border-yellow-500/20 bg-yellow-500/10 px-4 py-3 hover:bg-yellow-500/20 transition-colors"
                >
                  <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
                    {launchPassActive ? "See plans — lock in Founder pricing" : "View plans &amp; upgrade"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-yellow-700 dark:text-yellow-400">from £2.99/mo</span>
                    <Lock className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </Link>
              </div>
            )}

            {/* All upcoming — flat, time-sorted; ads injected every 6 events for free tier via Strapi */}
            {upcoming.length > 0 && (
              <div className="space-y-2">
                {upcoming.map((f, i) => (
                  <div key={f.id}>
                    <AdInjectionRow groupIndex={i} every={6} placement="tv" />
                    <TVCard fixture={f} tz={tz} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}


