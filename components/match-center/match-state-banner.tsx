import { deriveMatchStatusPhase, isLivePhase, isFinishedPhase } from "@/lib/match-intelligence"
import type { MatchCenterEvent } from "@/types/match-center"
import { cn } from "@/lib/utils"

const phaseLabel: Record<string, string> = {
  scheduled:         "Scheduled",
  lineups_expected:  "Lineups Expected",
  lineups_confirmed: "Lineups Confirmed",
  live_first_half:   "Live — First Half",
  half_time:         "Half Time",
  live_second_half:  "Live — Second Half",
  extra_time:        "Extra Time",
  penalties:         "Penalties",
  full_time:         "Full Time",
  postponed:         "Postponed",
  cancelled:         "Cancelled",
}

interface MatchStateBannerProps {
  event: MatchCenterEvent
  className?: string
}

export function MatchStateBanner({ event, className }: MatchStateBannerProps) {
  const phase = deriveMatchStatusPhase({
    status: event.strProgress || event.strStatus,
    hasConfirmedLineups: Boolean(event.hasConfirmedLineups),
    isHalfTime: Boolean(event.isHalfTime),
    isExtraTime: Boolean(event.isExtraTime),
    isPenalties: Boolean(event.isPenalties),
  })

  const live = isLivePhase(phase)
  const finished = isFinishedPhase(phase)

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold",
        live
          ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
          : finished
          ? "border-border bg-muted/40 text-muted-foreground"
          : "border-border bg-muted/20 text-muted-foreground",
        className
      )}
      role="status"
      aria-label={`Match status: ${phaseLabel[phase] ?? "Unknown"}`}
    >
      {live && (
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
      )}
      {phaseLabel[phase] ?? "Match Status Unknown"}
    </div>
  )
}
