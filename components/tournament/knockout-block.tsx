"use client"

// components/tournament/knockout-block.tsx
// Section 14 — Tournament Knockout Bracket / List
//
// Rules:
//   - only renders when knockoutVisible=true in the surface decision
//   - data must come from real normalized TournamentKnockoutNode[] — no faked bracket
//   - if no nodes are provided, renders an honest empty state — never fake a bracket
//   - compatible with Section 03 match context — does not fight it
//   - rounds are grouped by node.round and displayed in a clean list layout

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { TournamentKnockoutNode, TournamentSurfaceDecision } from "@/types/tournament-mode"
import { cn } from "@/lib/utils"

type Props = {
  nodes: TournamentKnockoutNode[]
  surface: TournamentSurfaceDecision
  className?: string
}

const STATUS_CLASSES: Record<string, string> = {
  live:       "text-live font-semibold",
  ft:         "text-muted-foreground",
  finished:   "text-muted-foreground",
  upcoming:   "text-muted-foreground",
  scheduled:  "text-muted-foreground",
}

function statusLabel(status: string | null | undefined): string {
  if (!status) return ""
  const s = status.toLowerCase()
  if (s === "live") return "LIVE"
  if (["ft", "aet", "pen", "finished"].includes(s)) return "FT"
  return ""
}

function KnockoutMatchRow({ node }: { node: TournamentKnockoutNode }) {
  const home = node.homeTeamName ?? "TBC"
  const away = node.awayTeamName ?? "TBC"
  const hasScore = node.homeScore !== null && node.homeScore !== undefined
                && node.awayScore !== null && node.awayScore !== undefined
  const status = node.status?.toLowerCase() ?? null
  const isLive = status === "live"

  return (
    <Link
      href={`/match/${node.eventId}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 transition-colors hover:border-primary/30 hover:bg-accent/50"
      aria-label={`${home} vs ${away}${hasScore ? `, score ${node.homeScore}–${node.awayScore}` : ""}`}
    >
      {/* Teams + score */}
      <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
        {/* Home */}
        <span className="flex-1 truncate text-sm font-medium text-foreground">{home}</span>

        {/* Score or vs */}
        <div className="shrink-0 text-center">
          {hasScore ? (
            <span className={cn("tabular-nums text-sm font-bold", isLive && "text-live")}>
              {node.homeScore}–{node.awayScore}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">vs</span>
          )}
        </div>

        {/* Away */}
        <span className="flex-1 truncate text-right text-sm font-medium text-foreground">{away}</span>
      </div>

      {/* Status tag + chevron */}
      <div className="flex shrink-0 items-center gap-1">
        {status && (
          <span className={cn("text-xs", STATUS_CLASSES[status] ?? "text-muted-foreground")}>
            {statusLabel(node.status)}
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>
    </Link>
  )
}

function RoundGroup({ round, roundLabel, nodes }: { round: string; roundLabel?: string | null; nodes: TournamentKnockoutNode[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {roundLabel ?? round}
      </p>
      <div className="flex flex-col gap-2">
        {nodes.map((node) => (
          <KnockoutMatchRow key={node.eventId} node={node} />
        ))}
      </div>
    </div>
  )
}

export function KnockoutBlock({ nodes, surface, className }: Props) {
  // Gate: surface decision is the authority
  if (!surface.knockoutVisible) return null

  // Group nodes by round, preserving insertion order
  const roundMap = new Map<string, { label?: string | null; nodes: TournamentKnockoutNode[] }>()
  for (const node of nodes) {
    const existing = roundMap.get(node.round)
    if (existing) {
      existing.nodes.push(node)
    } else {
      roundMap.set(node.round, { label: node.roundLabel, nodes: [node] })
    }
  }

  return (
    <div className={cn("px-3 py-3", className)}>
      <h2 className="mb-3 text-sm font-semibold text-foreground">Knockout Stage</h2>

      {nodes.length === 0 ? (
        // Honest empty state — no faked bracket
        <div className="rounded-xl border border-border bg-card px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Knockout fixtures are not yet available.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {Array.from(roundMap.entries()).map(([round, { label, nodes: roundNodes }]) => (
            <RoundGroup key={round} round={round} roundLabel={label} nodes={roundNodes} />
          ))}
        </div>
      )}
    </div>
  )
}
