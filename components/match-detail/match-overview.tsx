"use client"

import { AffiliateModule } from "@/components/affiliate-module"
import type {
  MatchIntelligenceEnvelope,
  MatchTimelineEvent,
  MatchStatItem,
} from "@/types/match-intelligence"
import type { MatchCenterEvent } from "@/types/match-center"
import { MatchStateBanner } from "@/components/match-center/match-state-banner"
import { FreshnessBadge } from "@/components/match-center/freshness-badge"
import { PartialDataNote } from "@/components/match-center/partial-data-note"
import { cn } from "@/lib/utils"

// ── Goal / card summary from timeline events ──────────────────────────────────

function GoalEntry({ event }: { event: MatchTimelineEvent }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500/15">
        <span className="text-xs font-bold text-green-600 dark:text-green-400">
          {event.minute != null ? `${event.minute}'` : "—"}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {event.playerName ?? event.title}
        </p>
        {event.assistName && (
          <p className="text-xs text-muted-foreground">Assist: {event.assistName}</p>
        )}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground font-medium">
        {event.side === "home" ? "H" : event.side === "away" ? "A" : ""}
      </span>
    </div>
  )
}

function CardEntry({ event }: { event: MatchTimelineEvent }) {
  const isRed = event.type === "red_card" || event.type === "second_yellow"
  return (
    <div className="flex items-start gap-3">
      <div className={cn(
        "mt-0.5 h-5 w-3.5 shrink-0 rounded-sm",
        isRed ? "bg-red-500" : "bg-yellow-500"
      )} aria-label={isRed ? "Red card" : "Yellow card"} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {event.playerName ?? event.title}
        </p>
        {event.minute != null && (
          <p className="text-xs text-muted-foreground">{event.minute}&apos;</p>
        )}
      </div>
      <span className="shrink-0 text-xs text-muted-foreground font-medium">
        {event.side === "home" ? "H" : event.side === "away" ? "A" : ""}
      </span>
    </div>
  )
}

// ── Key stats preview (top 3 from stats envelope) ────────────────────────────

function KeyStatsPreview({
  stats,
  homeTeam,
  awayTeam,
}: {
  stats: MatchStatItem[]
  homeTeam?: string
  awayTeam?: string
}) {
  const preview = stats.slice(0, 3)
  if (preview.length === 0) return null

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-3 font-semibold">Key Stats</h3>
      <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/40 px-2 py-1.5 text-xs font-semibold">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
          <span>{homeTeam ?? "Home"}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>{awayTeam ?? "Away"}</span>
          <span className="h-2 w-2 rounded-full bg-blue-500/70" aria-hidden="true" />
        </div>
      </div>
      <div className="space-y-3">
        {preview.map((stat, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm font-bold">{stat.home}</span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
            <span className="text-sm font-bold">{stat.away}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function OverviewSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-busy="true" aria-label="Loading overview">
      <div className="h-10 animate-pulse rounded-xl bg-muted" />
      <div className="h-36 animate-pulse rounded-xl bg-muted" />
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface MatchOverviewProps {
  eventEnvelope?: MatchIntelligenceEnvelope<MatchCenterEvent> | null
  timelineEnvelope?: MatchIntelligenceEnvelope<MatchTimelineEvent[]> | null
  statsEnvelope?: MatchIntelligenceEnvelope<MatchStatItem[]> | null
  isLoading?: boolean
}

export function MatchOverview({
  eventEnvelope,
  timelineEnvelope,
  statsEnvelope,
  isLoading,
}: MatchOverviewProps) {
  if (isLoading) return <OverviewSkeleton />

  const ev = eventEnvelope?.data
  const timelineEvents = timelineEnvelope?.data ?? []
  const stats = statsEnvelope?.data ?? []

  const goals = timelineEvents.filter(
    (e) => e.type === "goal" || e.type === "own_goal" || e.type === "penalty_goal"
  )
  const cards = timelineEvents.filter(
    (e) =>
      e.type === "yellow_card" ||
      e.type === "red_card" ||
      e.type === "second_yellow"
  )

  return (
    <div className="space-y-4 p-4">
      {/* Match state banner */}
      {ev && (
        <div className="flex items-center justify-between gap-3">
          <MatchStateBanner event={ev} className="flex-1" />
          {eventEnvelope && (
            <FreshnessBadge freshness={eventEnvelope.freshness} />
          )}
        </div>
      )}

      {/* Partial data note */}
      {(timelineEnvelope?.partial || statsEnvelope?.partial) && (
        <PartialDataNote message="Some match details may be incomplete as data arrives." />
      )}

      {/* Goals */}
      {goals.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">Goals</h3>
          <div className="space-y-3">
            {goals.map((g) => (
              <GoalEntry key={g.id} event={g} />
            ))}
          </div>
        </div>
      )}

      {/* Cards */}
      {cards.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">Cards</h3>
          <div className="space-y-3">
            {cards.map((c) => (
              <CardEntry key={c.id} event={c} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state for pre-match / no events yet */}
      {goals.length === 0 && cards.length === 0 && ev && (
        <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-foreground">
            {ev.strStatus?.toLowerCase().includes("ns") || !ev.strProgress
              ? "No events yet — match has not started"
              : "No goals or cards recorded for this match"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Events will appear here as the match progresses.
          </p>
        </div>
      )}

      {/* Key stats preview */}
      {stats.length > 0 && (
        <KeyStatsPreview
          stats={stats}
          homeTeam={ev?.strHomeTeam}
          awayTeam={ev?.strAwayTeam}
        />
      )}

      {/* Affiliate module — tickets, watch, travel */}
      <AffiliateModule context="event" />
    </div>
  )
}
