"use client"

import type { MatchInsightItem, DataConfidence } from "@/types/match-intelligence"
import { FreshnessBadge } from "./freshness-badge"
import { ProviderSourceNote } from "./provider-source-note"
import { PartialDataNote } from "./partial-data-note"
import { UnavailablePanel } from "./unavailable-panel"
import type { MatchIntelligenceEnvelope } from "@/types/match-intelligence"
import { cn } from "@/lib/utils"
import { TrendingUp, Info, UserX, BarChart2, BookOpen } from "lucide-react"
import { LockedFeatureState } from "@/components/premium/locked-feature-state"
import type { ModuleGate } from "@/types/monetization"

const typeConfig: Record<
  MatchInsightItem["type"],
  { icon: React.ElementType; bgClass: string; textClass: string }
> = {
  form:       { icon: TrendingUp,  bgClass: "bg-green-500/10",  textClass: "text-green-600 dark:text-green-400" },
  context:    { icon: Info,        bgClass: "bg-primary/10",    textClass: "text-primary" },
  injury:     { icon: UserX,       bgClass: "bg-red-500/10",    textClass: "text-red-500" },
  prediction: { icon: BarChart2,   bgClass: "bg-blue-500/10",   textClass: "text-blue-500" },
  editorial:  { icon: BookOpen,    bgClass: "bg-muted/60",      textClass: "text-muted-foreground" },
}

const confidenceLabel: Record<DataConfidence, string> = {
  high:   "High confidence",
  medium: "Medium confidence",
  low:    "Low confidence",
}

function InsightCard({ insight }: { insight: MatchInsightItem }) {
  const cfg = typeConfig[insight.type] ?? typeConfig.context
  const Icon = cfg.icon
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", cfg.bgClass)}>
          <Icon className={cn("h-4 w-4", cfg.textClass)} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">{insight.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{insight.description}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <ProviderSourceNote source={insight.source} />
        <span className="text-[11px] text-muted-foreground/60">{confidenceLabel[insight.confidence]}</span>
      </div>
    </div>
  )
}

interface InsightsPanelProps {
  envelope: MatchIntelligenceEnvelope<MatchInsightItem[]>
  /** Optional entitlement gate — when supplied and locked, renders LockedFeatureState */
  gate?: ModuleGate
}

export function InsightsPanel({ envelope, gate }: InsightsPanelProps) {
  // If the feature is entitlement-gated and locked, render a clean locked state
  if (gate?.locked) {
    return (
      <div className="p-4">
        <LockedFeatureState
          title="Premium Insights"
          body={gate.lockReason ?? "Match insights — team form, injury context, and predictions — are available on Gold and above."}
          gate={gate}
        />
      </div>
    )
  }

  if (!envelope.data && !envelope.partial) {
    return (
      <UnavailablePanel
        title="No insights available"
        message={envelope.unavailableReason ?? "Insights are derived from standings and form data. They will appear when those sources have data."}
      />
    )
  }

  const items = envelope.data ?? []

  return (
    <div className="space-y-4 p-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Match Insights</h3>
        <FreshnessBadge freshness={envelope.freshness} />
      </div>

      {envelope.partial && (
        <PartialDataNote message="Insights are based on available standings data only. Injury and prediction data may not be available." />
      )}

      {items.length === 0 ? (
        <UnavailablePanel
          title="No insights found"
          message="Not enough data to derive insights for this match."
        />
      ) : (
        <div className="space-y-3">
          {items.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}

      <ProviderSourceNote source={envelope.source} />
    </div>
  )
}
