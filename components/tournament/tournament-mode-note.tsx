"use client"

// components/tournament/tournament-mode-note.tsx
// Section 14 — Operator-facing note shown only in admin/debug contexts.
// Surfaces the current tournament mode state so operators can confirm
// what the app is doing without reading the control-plane JSON directly.
//
// This component must NOT be shown to end users. It is for admin panels only.

import type { TournamentModeState } from "@/types/tournament-mode"
import type { TournamentSurfaceDecision } from "@/types/tournament-mode"
import { cn } from "@/lib/utils"

type Props = {
  state: TournamentModeState
  surface: TournamentSurfaceDecision
  className?: string
}

const STAGE_LABELS: Record<string, string> = {
  pre_tournament: "Pre-Tournament",
  group_stage: "Group Stage",
  knockout_stage: "Knockout Stage",
  final_week: "Final Week",
  post_tournament: "Post Tournament",
}

const MODE_LABELS: Record<string, string> = {
  off: "Off",
  promo: "Promo",
  full: "Full",
}

function BoolPill({ value, label }: { value: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        value
          ? "bg-primary/15 text-primary"
          : "bg-muted text-muted-foreground",
      )}
    >
      {value ? "on" : "off"} {label}
    </span>
  )
}

export function TournamentModeNote({ state, surface, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card px-4 py-3 text-xs text-muted-foreground",
        className,
      )}
      role="status"
      aria-label="Tournament mode operator note"
    >
      <p className="mb-2 font-semibold text-foreground">
        Tournament Mode — Operator Status
      </p>

      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
        <span>
          <span className="font-medium text-foreground">Mode:</span>{" "}
          {state.mode ? MODE_LABELS[state.mode] ?? state.mode : "Off"}
        </span>
        <span>
          <span className="font-medium text-foreground">Type:</span>{" "}
          {state.type ?? "—"}
        </span>
        <span>
          <span className="font-medium text-foreground">Stage:</span>{" "}
          {state.stage ? STAGE_LABELS[state.stage] ?? state.stage : "—"}
        </span>
        {state.displayName && (
          <span>
            <span className="font-medium text-foreground">Name:</span>{" "}
            {state.displayName}
          </span>
        )}
        {state.hostLocation && (
          <span>
            <span className="font-medium text-foreground">Host:</span>{" "}
            {state.hostLocation}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <BoolPill value={surface.heroVisible}     label="Hero"      />
        <BoolPill value={surface.homepageBoost}   label="Homepage"  />
        <BoolPill value={surface.navBoost}         label="Nav"       />
        <BoolPill value={surface.tickerBoost}      label="Ticker"    />
        <BoolPill value={surface.venueBoost}       label="Venues"    />
        <BoolPill value={surface.editorialBoost}   label="Editorial" />
        <BoolPill value={surface.countdownVisible} label="Countdown" />
        <BoolPill value={surface.groupTableVisible} label="Groups"   />
        <BoolPill value={surface.knockoutVisible}  label="Knockout"  />
      </div>

      {state.featuredCompetitionIds && state.featuredCompetitionIds.length > 0 && (
        <p className="mt-2">
          <span className="font-medium text-foreground">Featured competitions:</span>{" "}
          {state.featuredCompetitionIds.join(", ")}
        </p>
      )}
    </div>
  )
}
