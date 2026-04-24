"use client"

import type { MatchIntelligenceEnvelope, MatchTimelineEvent } from "@/types/match-intelligence"
import { FreshnessBadge } from "@/components/match-center/freshness-badge"
import { PartialDataNote } from "@/components/match-center/partial-data-note"
import { UnavailablePanel } from "@/components/match-center/unavailable-panel"
import { cn } from "@/lib/utils"

// ── Event type rendering ──────────────────────────────────────────────────────

const eventTypeConfig: Record<
  MatchTimelineEvent["type"],
  { label: string; dotClass: string; cardClass: string }
> = {
  goal:             { label: "Goal",              dotClass: "bg-green-500",              cardClass: "border-green-500/30 bg-green-500/8" },
  own_goal:         { label: "Own Goal",          dotClass: "bg-green-500",              cardClass: "border-green-500/30 bg-green-500/8" },
  penalty_goal:     { label: "Penalty Goal",      dotClass: "bg-green-500",              cardClass: "border-green-500/30 bg-green-500/8" },
  missed_penalty:   { label: "Missed Penalty",    dotClass: "bg-muted-foreground",       cardClass: "border-border bg-card" },
  yellow_card:      { label: "Yellow Card",       dotClass: "bg-yellow-500",             cardClass: "border-yellow-500/30 bg-yellow-500/8" },
  red_card:         { label: "Red Card",          dotClass: "bg-red-500",                cardClass: "border-red-500/30 bg-red-500/8" },
  second_yellow:    { label: "Second Yellow",     dotClass: "bg-red-500",                cardClass: "border-red-500/30 bg-red-500/8" },
  substitution:     { label: "Substitution",      dotClass: "bg-blue-500",               cardClass: "border-blue-500/20 bg-blue-500/5" },
  var:              { label: "VAR",               dotClass: "bg-purple-500",             cardClass: "border-purple-500/20 bg-purple-500/5" },
  kickoff:          { label: "Kick Off",          dotClass: "bg-muted-foreground/60",    cardClass: "border-border bg-muted/30" },
  half_time:        { label: "Half Time",         dotClass: "bg-muted-foreground/60",    cardClass: "border-border bg-muted/40" },
  full_time:        { label: "Full Time",         dotClass: "bg-muted-foreground/60",    cardClass: "border-border bg-muted/40" },
  extra_time_start: { label: "Extra Time",        dotClass: "bg-muted-foreground/60",    cardClass: "border-border bg-muted/30" },
  penalties_start:  { label: "Penalties",         dotClass: "bg-muted-foreground/60",    cardClass: "border-border bg-muted/30" },
  other:            { label: "Event",             dotClass: "bg-muted-foreground/50",    cardClass: "border-border bg-card" },
}

// ── Single event row ──────────────────────────────────────────────────────────

function TimelineRow({
  event,
  isLast,
}: {
  event: MatchTimelineEvent
  isLast: boolean
}) {
  const cfg = eventTypeConfig[event.type] ?? eventTypeConfig.other
  const minuteLabel =
    event.minute != null
      ? event.extraMinute
        ? `${event.minute}+${event.extraMinute}'`
        : `${event.minute}'`
      : "—"
  const isAway = event.side === "away"

  return (
    <div className={cn("flex gap-3", isAway && "flex-row-reverse")}>
      {/* Minute column */}
      <div className={cn("flex w-12 shrink-0 pt-3 text-xs font-bold tabular-nums text-muted-foreground", isAway ? "justify-start" : "justify-end")}>
        {minuteLabel}
      </div>

      {/* Dot + connector */}
      <div className="relative flex flex-col items-center">
        <div className={cn("mt-3 h-3 w-3 rounded-full ring-2 ring-background", cfg.dotClass)} aria-hidden="true" />
        {!isLast && <div className="mt-1 flex-1 w-px bg-border" style={{ minHeight: "1.5rem" }} aria-hidden="true" />}
      </div>

      {/* Card */}
      <div className={cn("mb-3 flex-1 rounded-xl border p-3 shadow-sm", cfg.cardClass)}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {cfg.label}
            </p>
            {event.playerName && (
              <p className="mt-0.5 text-sm font-medium leading-snug">{event.playerName}</p>
            )}
            {event.assistName && (
              <p className="text-xs text-muted-foreground">Assist: {event.assistName}</p>
            )}
            {event.description && !event.playerName && (
              <p className="mt-0.5 text-sm text-muted-foreground">{event.description}</p>
            )}
          </div>
          {event.side && event.side !== "neutral" && (
            <span className="shrink-0 rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
              {event.side === "home" ? "H" : "A"}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function TimelineSkeleton() {
  return (
    <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading timeline">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="h-5 w-12 animate-pulse rounded bg-muted" />
          <div className="flex flex-col items-center gap-1">
            <div className="h-3 w-3 animate-pulse rounded-full bg-muted" />
            <div className="h-8 w-px bg-muted" />
          </div>
          <div className="h-14 flex-1 animate-pulse rounded-xl bg-muted" />
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface MatchTimelineProps {
  envelope?: MatchIntelligenceEnvelope<MatchTimelineEvent[]> | null
  isLoading?: boolean
}

export function MatchTimeline({ envelope, isLoading }: MatchTimelineProps) {
  if (isLoading) return <TimelineSkeleton />

  if (!envelope || (!envelope.data && !envelope.partial)) {
    return (
      <UnavailablePanel
        title="Timeline not available"
        message={
          envelope?.unavailableReason ??
          "Live timeline events are not available for this match. They appear once the match is underway and the provider shares structured event data."
        }
      />
    )
  }

  const events = envelope.data ?? []

  return (
    <div className="space-y-2 p-4">
      {/* Freshness row */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Match Timeline</h3>
        <FreshnessBadge freshness={envelope.freshness} />
      </div>

      {envelope.partial && (
        <PartialDataNote message="Timeline coverage is partial for this event. Goal and card events are shown; substitutions and other events may be missing." />
      )}

      {events.length === 0 ? (
        <UnavailablePanel
          title="No events yet"
          message="Events will appear here as the match progresses."
        />
      ) : (
        <div className="pt-2">
          {events.map((event, i) => (
            <TimelineRow key={event.id} event={event} isLast={i === events.length - 1} />
          ))}
        </div>
      )}
    </div>
  )
}
