"use client"

import type { TickerConfig } from "@/types/ticker"

interface TickerEmptyStateProps {
  config?: TickerConfig
  channel: "primary" | "secondary"
}

export function TickerEmptyState({ config, channel }: TickerEmptyStateProps) {
  const emptyMode = config?.emptyMode ?? "show_message"

  // hide = render nothing
  if (emptyMode === "hide") return null

  if (channel === "primary") {
    return (
      <div className="flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm opacity-60">
        <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase bg-muted text-muted-foreground">
          –
        </span>
        <span>No live matches right now</span>
      </div>
    )
  }

  return null
}
