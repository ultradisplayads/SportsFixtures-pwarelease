import type { MatchFreshness } from "@/types/match-intelligence"
import { cn } from "@/lib/utils"

const freshnessConfig: Record<
  MatchFreshness,
  { label: string; dotClass: string; textClass: string }
> = {
  live:       { label: "Live",      dotClass: "bg-green-500 animate-pulse", textClass: "text-green-600 dark:text-green-400" },
  "near-live":{ label: "Near live", dotClass: "bg-amber-500",               textClass: "text-amber-600 dark:text-amber-400" },
  cached:     { label: "Updated",   dotClass: "bg-muted-foreground/50",     textClass: "text-muted-foreground" },
  stale:      { label: "Stale",     dotClass: "bg-destructive/70",          textClass: "text-destructive/80" },
  unknown:    { label: "Unknown",   dotClass: "bg-muted-foreground/30",     textClass: "text-muted-foreground/60" },
}

interface FreshnessBadgeProps {
  freshness: MatchFreshness
  className?: string
}

export function FreshnessBadge({ freshness, className }: FreshnessBadgeProps) {
  const cfg = freshnessConfig[freshness] ?? freshnessConfig.unknown
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium",
        cfg.textClass,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dotClass)} aria-hidden="true" />
      {cfg.label}
    </span>
  )
}
