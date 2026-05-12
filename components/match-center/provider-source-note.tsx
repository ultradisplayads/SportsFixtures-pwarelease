import type { ProviderSource } from "@/types/match-intelligence"
import { cn } from "@/lib/utils"

const sourceLabel: Record<ProviderSource, string> = {
  thesportsdb:  "SportsFixtures",
  "api-sports": "SportsFixtures",
  derived:      "SportsFixtures",
  editorial:    "SportsFixtures",
  external:     "SportsFixtures",
  internal:     "SportsFixtures",
  sf_api:       "SportsFixtures",
}

interface ProviderSourceNoteProps {
  source: ProviderSource
  className?: string
}

export function ProviderSourceNote({ source, className }: ProviderSourceNoteProps) {
  return (
    <p className={cn("text-[11px] text-muted-foreground/60", className)}>
      Source: {sourceLabel[source] ?? "SportsFixtures"}
    </p>
  )
}
