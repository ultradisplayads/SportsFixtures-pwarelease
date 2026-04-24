"use client"

import type { MatchIntelligenceEnvelope, MatchStatItem } from "@/types/match-intelligence"
import { FreshnessBadge } from "@/components/match-center/freshness-badge"
import { PartialDataNote } from "@/components/match-center/partial-data-note"
import { ProviderSourceNote } from "@/components/match-center/provider-source-note"
import { UnavailablePanel } from "@/components/match-center/unavailable-panel"

// ── Single stat bar row ───────────────────────────────────────────────────────

function StatRow({ stat }: { stat: MatchStatItem }) {
  const homeVal = stat.home
  const awayVal = stat.away
  const homePct = stat.homePercent ?? 50

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-2.5 flex items-center justify-between text-sm">
        <span className="w-14 font-bold tabular-nums text-left">{homeVal}</span>
        <span className="flex-1 text-center text-xs text-muted-foreground font-medium">{stat.label}</span>
        <span className="w-14 font-bold tabular-nums text-right">{awayVal}</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="bg-primary transition-all duration-500"
          style={{ width: `${Math.min(Math.max(homePct, 0), 100)}%` }}
          aria-hidden="true"
        />
        <div className="flex-1 bg-blue-500/70" aria-hidden="true" />
      </div>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading statistics">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface MatchStatsProps {
  envelope?: MatchIntelligenceEnvelope<MatchStatItem[]> | null
  isLoading?: boolean
  homeTeamName?: string
  awayTeamName?: string
}

export function MatchStats({
  envelope,
  isLoading,
  homeTeamName,
  awayTeamName,
}: MatchStatsProps) {
  if (isLoading) return <StatsSkeleton />

  if (!envelope || (!envelope.data && !envelope.partial)) {
    return (
      <UnavailablePanel
        title="Statistics not available"
        message={
          envelope?.unavailableReason ??
          "Match statistics are not available for this event. They usually appear once the match is in progress or has finished."
        }
      />
    )
  }

  const stats = envelope.data ?? []

  return (
    <div className="space-y-3 p-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Statistics</h3>
        <FreshnessBadge freshness={envelope.freshness} />
      </div>

      {/* Team name legend */}
      {(homeTeamName || awayTeamName) && (
        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
            <span>{homeTeamName ?? "Home"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>{awayTeamName ?? "Away"}</span>
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500/70" aria-hidden="true" />
          </div>
        </div>
      )}

      {envelope.partial && (
        <PartialDataNote message="Statistics are partial for this event. Some values may be missing." />
      )}

      {stats.length === 0 ? (
        <UnavailablePanel
          title="No statistics yet"
          message="Statistics will appear here once the match is underway."
        />
      ) : (
        <div className="space-y-3">
          {stats.map((stat, i) => (
            <StatRow key={`${stat.label}-${i}`} stat={stat} />
          ))}
        </div>
      )}

      <ProviderSourceNote source={envelope.source} />
    </div>
  )
}
