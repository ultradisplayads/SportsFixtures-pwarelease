"use client"

import { PlayCircle } from "lucide-react"
import { useState } from "react"
import type { MatchIntelligenceEnvelope, MatchTimelineEvent } from "@/types/match-intelligence"
import { UnavailablePanel } from "@/components/match-center/unavailable-panel"
import { cn } from "@/lib/utils"

type CommentaryFilter = "all" | "highlights"

const highlightTypes = new Set<MatchTimelineEvent["type"]>([
  "goal",
  "own_goal",
  "penalty_goal",
  "missed_penalty",
  "yellow_card",
  "red_card",
  "second_yellow",
  "var",
  "full_time",
  "half_time",
])

function typeLabel(event: MatchTimelineEvent): string {
  const labels: Record<MatchTimelineEvent["type"], string> = {
    goal: "GOAL",
    own_goal: "OWN GOAL",
    penalty_goal: "PENALTY GOAL",
    missed_penalty: "MISSED PENALTY",
    yellow_card: "YELLOW CARD",
    red_card: "RED CARD",
    second_yellow: "SECOND YELLOW",
    substitution: "SUBSTITUTION",
    var: "VAR",
    kickoff: "KICK-OFF",
    half_time: "HALF-TIME",
    full_time: "FULL-TIME",
    extra_time_start: "EXTRA TIME",
    penalties_start: "PENALTIES",
    other: "UPDATE",
  }
  return labels[event.type] || event.title || "UPDATE"
}

function minuteLabel(event: MatchTimelineEvent): string {
  if (event.minute == null) return ""
  return event.extraMinute ? `${event.minute}+${event.extraMinute}'` : `${event.minute}'`
}

function eventIcon(event: MatchTimelineEvent) {
  if (event.type.includes("goal")) return "GOAL"
  if (event.type.includes("card")) return event.type.includes("red") ? "RED" : "YEL"
  if (event.type === "var") return "VAR"
  if (event.type === "substitution") return "SUB"
  if (event.type === "half_time" || event.type === "full_time") return "FT"
  return ""
}

export function MatchCommentary({
  envelope,
  isLoading,
}: {
  envelope?: MatchIntelligenceEnvelope<MatchTimelineEvent[]> | null
  isLoading?: boolean
}) {
  const [filter, setFilter] = useState<CommentaryFilter>("all")

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (!envelope || (!envelope.data && !envelope.partial)) {
    return (
      <UnavailablePanel
        title="Commentary not available"
        message="Live commentary appears when provider timeline events are available for this match."
      />
    )
  }

  const events = (envelope.data ?? [])
    .filter((event) => filter === "all" || highlightTypes.has(event.type))
    .slice()
    .reverse()

  return (
    <div className="space-y-4 p-4">
      <div className="flex gap-2">
        {(["all", "highlights"] as CommentaryFilter[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
              filter === item ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground",
            )}
          >
            {item === "all" ? "All" : "Highlights"}
          </button>
        ))}
      </div>

      {events.length === 0 ? (
        <UnavailablePanel title="No commentary yet" message="Commentary will appear as events are received." />
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <article key={event.id} className="rounded-xl border border-border bg-card p-4">
              <div className="grid grid-cols-[64px_1fr_auto] gap-3">
                <p className="text-sm font-black tabular-nums">{minuteLabel(event)}</p>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {eventIcon(event) && (
                      <span className={cn(
                        "text-sm font-black",
                        event.type.includes("red") ? "text-destructive" : event.type.includes("yellow") ? "text-yellow-500" : "text-foreground",
                      )}>
                        {eventIcon(event)}
                      </span>
                    )}
                    <p className="text-sm font-black">{typeLabel(event)}</p>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed">
                    {event.description || event.title || [event.playerName, event.assistName ? `assisted by ${event.assistName}` : ""].filter(Boolean).join(", ")}
                  </p>
                  {event.playerName && event.description && (
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">{event.playerName}</p>
                  )}
                </div>
                {highlightTypes.has(event.type) && (
                  <button
                    type="button"
                    className="flex h-8 items-center gap-1 rounded-full border border-border px-2 text-[11px] font-semibold text-muted-foreground"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    Play
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
