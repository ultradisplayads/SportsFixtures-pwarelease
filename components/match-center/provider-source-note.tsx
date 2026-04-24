import type { ProviderSource } from "@/types/match-intelligence"
import { cn } from "@/lib/utils"

const sourceLabel: Record<ProviderSource, string> = {
  thesportsdb:  "TheSportsDB",
  "api-sports": "API-Sports",
  derived:      "Derived",
  editorial:    "Editorial",
  external:     "External",
  internal:     "Internal",
  sf_api:       "SF API",
}

interface ProviderSourceNoteProps {
  source: ProviderSource
  className?: string
}

export function ProviderSourceNote({ source, className }: ProviderSourceNoteProps) {
  return (
    <p className={cn("text-[11px] text-muted-foreground/60", className)}>
      Source: {sourceLabel[source] ?? source}
    </p>
  )
}
