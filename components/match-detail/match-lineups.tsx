"use client"

import type { MatchIntelligenceEnvelope, MatchLineups, MatchPlayer, MatchLineupsTeam } from "@/types/match-intelligence"
import { SmartLogo } from "@/components/assets/smart-logo"
import { SmartAvatar } from "@/components/assets/smart-avatar"
import { FreshnessBadge } from "@/components/match-center/freshness-badge"
import { PartialDataNote } from "@/components/match-center/partial-data-note"
import { UnavailablePanel } from "@/components/match-center/unavailable-panel"

// ── Player row ────────────────────────────────────────────────────────────────

function PlayerRow({ player }: { player: MatchPlayer }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-background p-2.5">
      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted">
        <SmartAvatar
          name={player.name}
          variant="player"
          src={player.image || null}
          className="h-10 w-10 object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{player.name}</p>
        <p className="text-xs text-muted-foreground">
          {player.position || "TBC"}
          {player.country ? ` • ${player.country}` : ""}
        </p>
      </div>
    </div>
  )
}

// ── Player group ──────────────────────────────────────────────────────────────

function PlayerGroup({ title, players }: { title: string; players: MatchPlayer[] }) {
  if (!players.length) return null
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      <div className="grid gap-2">
        {players.map((player, index) => (
          <PlayerRow key={`${title}-${player.name}-${index}`} player={player} />
        ))}
      </div>
    </div>
  )
}

// ── Team card ─────────────────────────────────────────────────────────────────

function TeamCard({ lineup }: { lineup: MatchLineupsTeam }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted">
          <SmartLogo
            name={lineup.name}
            src={lineup.badge || null}
            className="h-10 w-10 object-contain p-1"
          />
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{lineup.name}</h3>
          <p className="text-xs text-muted-foreground">Formation: {lineup.formation || "TBC"}</p>
        </div>
      </div>
      <div className="space-y-4">
        <PlayerGroup
          title="Goalkeeper"
          players={[lineup.goalkeeper].filter(Boolean) as MatchPlayer[]}
        />
        <PlayerGroup title="Defenders" players={lineup.defenders} />
        <PlayerGroup title="Midfielders" players={lineup.midfielders} />
        <PlayerGroup title="Forwards" players={lineup.forwards} />
        <PlayerGroup title="Substitutes" players={lineup.substitutes} />
      </div>
    </section>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LineupsSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-busy="true" aria-label="Loading lineups">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-4 h-6 w-40 animate-pulse rounded bg-muted" />
          <div className="space-y-2">
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface MatchLineupsProps {
  envelope?: MatchIntelligenceEnvelope<MatchLineups> | null
  isLoading?: boolean
}

export function MatchLineups({ envelope, isLoading }: MatchLineupsProps) {
  if (isLoading) return <LineupsSkeleton />

  if (!envelope || !envelope.data) {
    return (
      <UnavailablePanel
        title="Lineups not confirmed yet"
        message={
          envelope?.unavailableReason ??
          "Starting elevens and benches usually appear closer to kickoff. Check back nearer the start time."
        }
      />
    )
  }

  const { home, away, confirmed } = envelope.data

  return (
    <div className="space-y-4 p-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          Lineups
          {confirmed && (
            <span className="ml-2 rounded bg-green-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-green-600 dark:text-green-400">
              Confirmed
            </span>
          )}
        </h3>
        <FreshnessBadge freshness={envelope.freshness} />
      </div>

      {!confirmed && (
        <PartialDataNote message="Lineups may not be fully confirmed yet. Starting XI and bench could change before kickoff." />
      )}

      <TeamCard lineup={home} />
      <TeamCard lineup={away} />
    </div>
  )
}
