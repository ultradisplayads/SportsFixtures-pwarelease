"use client"

import Image from "next/image"
import type { MatchIntelligenceEnvelope, MatchStandingsRow } from "@/types/match-intelligence"
import { FreshnessBadge } from "@/components/match-center/freshness-badge"
import { ProviderSourceNote } from "@/components/match-center/provider-source-note"
import { UnavailablePanel } from "@/components/match-center/unavailable-panel"
import { cn } from "@/lib/utils"

// ── Form pip row ──────────────────────────────────────────────────────────────

function FormPips({ form }: { form: string }) {
  const chars = form.toUpperCase().split("").slice(0, 5)
  return (
    <div className="flex gap-0.5" aria-label={`Form: ${form}`}>
      {chars.map((c, i) => (
        <span
          key={i}
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-sm text-[10px] font-bold text-white",
            c === "W" ? "bg-green-500" : c === "D" ? "bg-muted-foreground/60" : "bg-red-500"
          )}
        >
          {c}
        </span>
      ))}
    </div>
  )
}

// ── Single standings row ──────────────────────────────────────────────────────

function StandingsRow({ row }: { row: MatchStandingsRow }) {
  const highlight = row.isHomeTeam || row.isAwayTeam
  return (
    <tr
      className={cn(
        "border-b border-border/50 text-sm last:border-0",
        highlight && "bg-primary/5 font-semibold"
      )}
    >
      <td className="py-2.5 pl-3 pr-2 text-center text-xs text-muted-foreground w-7">
        {row.rank}
      </td>
      <td className="py-2.5 pr-2 min-w-0">
        <div className="flex items-center gap-2">
          {row.teamBadge ? (
            <Image
              src={row.teamBadge}
              alt={row.teamName}
              width={20}
              height={20}
              className="h-5 w-5 shrink-0 object-contain"
              unoptimized
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden" }}
            />
          ) : (
            <span className="h-5 w-5 shrink-0" />
          )}
          <span className="truncate">{row.teamName}</span>
          {row.isHomeTeam && (
            <span className="shrink-0 rounded bg-primary/15 px-1 py-px text-[10px] font-bold uppercase text-primary">H</span>
          )}
          {row.isAwayTeam && (
            <span className="shrink-0 rounded bg-blue-500/15 px-1 py-px text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">A</span>
          )}
        </div>
      </td>
      <td className="py-2.5 px-1.5 text-center tabular-nums text-xs text-muted-foreground">{row.played}</td>
      <td className="py-2.5 px-1.5 text-center tabular-nums text-xs text-muted-foreground">{row.won}</td>
      <td className="py-2.5 px-1.5 text-center tabular-nums text-xs text-muted-foreground">{row.drawn}</td>
      <td className="py-2.5 px-1.5 text-center tabular-nums text-xs text-muted-foreground">{row.lost}</td>
      <td className={cn(
        "py-2.5 pl-1.5 pr-3 text-center tabular-nums text-sm font-bold",
        highlight ? "text-foreground" : "text-muted-foreground"
      )}>
        {row.points}
      </td>
      {row.form && (
        <td className="py-2.5 pr-3 hidden sm:table-cell">
          <FormPips form={row.form} />
        </td>
      )}
    </tr>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function StandingsSkeleton() {
  return (
    <div className="space-y-2 p-4" aria-busy="true" aria-label="Loading standings">
      <div className="h-8 animate-pulse rounded-lg bg-muted" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-11 animate-pulse rounded bg-muted/60" />
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface MatchStandingsProps {
  envelope?: MatchIntelligenceEnvelope<MatchStandingsRow[]> | null
  isLoading?: boolean
}

export function MatchStandings({ envelope, isLoading }: MatchStandingsProps) {
  if (isLoading) return <StandingsSkeleton />

  if (!envelope || !envelope.data || envelope.data.length === 0) {
    return (
      <UnavailablePanel
        title="Standings not available"
        message={
          envelope?.unavailableReason ??
          "League standings are not available for this competition. Knockout-phase and cup matches may not have a standings table."
        }
      />
    )
  }

  const rows = envelope.data
  const hasForm = rows.some((r) => !!r.form)

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Standings</h3>
        <FreshnessBadge freshness={envelope.freshness} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full table-fixed text-left">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-[11px] font-semibold uppercase text-muted-foreground">
              <th className="py-2 pl-3 pr-2 w-7 text-center">#</th>
              <th className="py-2 pr-2">Team</th>
              <th className="py-2 px-1.5 w-8 text-center">P</th>
              <th className="py-2 px-1.5 w-8 text-center">W</th>
              <th className="py-2 px-1.5 w-8 text-center">D</th>
              <th className="py-2 px-1.5 w-8 text-center">L</th>
              <th className="py-2 pl-1.5 pr-3 w-8 text-center">Pts</th>
              {hasForm && <th className="py-2 pr-3 w-24 hidden sm:table-cell">Form</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <StandingsRow key={row.teamId || row.rank} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      <ProviderSourceNote source={envelope.source} />
    </div>
  )
}
