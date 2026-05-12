"use client"

import { ChevronDown, Info, Table2 } from "lucide-react"
import { useState } from "react"
import type { MatchIntelligenceEnvelope, MatchStatItem } from "@/types/match-intelligence"
import { UnavailablePanel } from "@/components/match-center/unavailable-panel"

type BlockKey = "conceded" | "overUnder" | "goalsByMinute" | "shots" | "setPieces" | "misc" | "odds"

const BLOCKS: Array<{ id: BlockKey; title: string; labels: string[] }> = [
  { id: "conceded", title: "Average Goals Conceded", labels: ["Goals Against", "Expected Goals Against", "Saves"] },
  { id: "overUnder", title: "Over/Under Goals", labels: ["Goals", "Expected Goals", "Shots on Goal"] },
  { id: "goalsByMinute", title: "Goals By Minute", labels: ["Goals", "Big Chances", "Counter Attacks"] },
  { id: "shots", title: "Shots Taken", labels: ["Total Shots", "Shots on Goal", "Shots off Goal", "Blocked Shots"] },
  { id: "setPieces", title: "Free Kicks, Goal Kicks & Throw-Ins", labels: ["Free Kicks", "Goal Kicks", "Throw-ins", "Corner Kicks"] },
  { id: "misc", title: "Offsides Misc", labels: ["Offsides", "Fouls", "Yellow Cards", "Red Cards"] },
  { id: "odds", title: "Odds", labels: ["Home Win", "Draw", "Away Win"] },
]

function valueText(value: number | string | undefined): string {
  if (value == null || value === "") return "-"
  return String(value)
}

function statMatches(stat: MatchStatItem, labels: string[]) {
  const label = stat.label.toLowerCase()
  return labels.some((candidate) => label.includes(candidate.toLowerCase()))
}

function StatRow({ stat }: { stat: MatchStatItem }) {
  return (
    <div className="space-y-1.5 rounded-lg border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold">
        <span>{valueText(stat.home)}</span>
        <span className="text-center text-muted-foreground">{stat.label}</span>
        <span>{valueText(stat.away)}</span>
      </div>
      {stat.homePercent != null && (
        <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
          <span className="bg-primary" style={{ width: `${stat.homePercent}%` }} />
          <span className="bg-muted-foreground/30" style={{ width: `${100 - stat.homePercent}%` }} />
        </div>
      )}
    </div>
  )
}

export function MatchDatalytics({
  envelope,
  isLoading,
}: {
  envelope?: MatchIntelligenceEnvelope<MatchStatItem[]> | null
  isLoading?: boolean
}) {
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({ shots: true })
  const stats = envelope?.data ?? []

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {BLOCKS.slice(0, 5).map((block) => (
          <div key={block.id} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (!envelope || (!envelope.data && !envelope.partial)) {
    return (
      <UnavailablePanel
        title="Datalytics not available"
        message="Datalytics appear when match statistics, shot data and provider insights are available for this fixture."
      />
    )
  }

  return (
    <div className="space-y-4 p-4">
      {BLOCKS.map((block) => {
        const blockStats = stats.filter((stat) => statMatches(stat, block.labels))
        const isOpen = Boolean(openBlocks[block.id])
        return (
          <section key={block.id} className="overflow-hidden rounded-xl border border-border bg-card">
            <button
              type="button"
              onClick={() => setOpenBlocks((current) => ({ ...current, [block.id]: !isOpen }))}
              className="flex w-full items-center justify-between gap-3 p-4 text-left"
            >
              <span className="flex items-center gap-1.5 text-base font-semibold">
                {block.title}
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </span>
              <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div className="space-y-2 border-t border-border p-3">
                {blockStats.length > 0 ? (
                  blockStats.map((stat) => <StatRow key={stat.label} stat={stat} />)
                ) : (
                  <p className="rounded-lg bg-background p-3 text-sm text-muted-foreground">
                    This block will populate when the provider returns {block.title.toLowerCase()} data.
                  </p>
                )}
              </div>
            )}
          </section>
        )
      })}

      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card p-4 text-sm font-semibold text-muted-foreground"
      >
        Switch to table view
        <Table2 className="h-4 w-4" />
      </button>
    </div>
  )
}
