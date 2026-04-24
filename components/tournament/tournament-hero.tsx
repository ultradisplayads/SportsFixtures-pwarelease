"use client"

// components/tournament/tournament-hero.tsx
// Section 14 — Tournament Hero Banner
//
// Rules:
//   - only renders when heroEnabled=true in the resolved surface decision
//   - operator-controlled: disappears cleanly when tournament mode is off
//   - must not replace the rest of the homepage — it sits above modules
//   - includes countdown when countdownVisible=true + start time is set
//   - includes a nav link to browse the featured competition(s)

import Link from "next/link"
import { Trophy } from "lucide-react"
import type { TournamentModeState, TournamentSurfaceDecision } from "@/types/tournament-mode"
import { TournamentCountdown } from "@/components/tournament/tournament-countdown"
import { cn } from "@/lib/utils"

type Props = {
  state: TournamentModeState
  surface: TournamentSurfaceDecision
  className?: string
}

const STAGE_MESSAGE: Record<string, string> = {
  pre_tournament: "Get ready — the tournament kicks off soon.",
  group_stage:    "Group stage underway — follow every match.",
  knockout_stage: "Knockout rounds are live — who goes through?",
  final_week:     "The final week — it all comes down to this.",
  post_tournament: "The tournament is over. Relive the highlights.",
}

export function TournamentHero({ state, surface, className }: Props) {
  // Gate: surface decision is the authority
  if (!surface.heroVisible) return null

  const title      = state.displayName ?? state.shortName ?? "Tournament"
  const shortTitle = state.shortName ?? title
  const stageMsg   = state.stage ? (STAGE_MESSAGE[state.stage] ?? null) : null

  // Build a link to the first featured competition if one exists
  const firstCompetitionId = state.featuredCompetitionIds?.[0] ?? null
  const competitionHref = firstCompetitionId
    ? `/league/${firstCompetitionId}`
    : "/browse"

  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-primary/20 bg-primary/5 px-4 py-5",
        className,
      )}
      aria-label={`${title} tournament mode banner`}
    >
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {shortTitle}
            </p>
            <h2 className="text-base font-bold leading-tight text-foreground text-balance">
              {title}
            </h2>
          </div>
        </div>

        <Link
          href={competitionHref}
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          aria-label={`View ${shortTitle} fixtures and standings`}
        >
          View fixtures
        </Link>
      </div>

      {/* Stage context message */}
      {stageMsg && (
        <p className="mb-3 text-sm text-muted-foreground">{stageMsg}</p>
      )}

      {/* Countdown — only if surface decision says it's visible */}
      {surface.countdownVisible && (
        <TournamentCountdown state={state} className="mt-1" />
      )}

      {/* Host location tag */}
      {state.hostLocation && !surface.countdownVisible && (
        <p className="mt-1 text-xs text-muted-foreground">{state.hostLocation}</p>
      )}
    </section>
  )
}
