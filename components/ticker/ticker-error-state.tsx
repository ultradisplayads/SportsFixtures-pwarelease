"use client"

// components/ticker/ticker-error-state.tsx
// Section 15 — Ticker feed error state.
//
// Displayed inside the primary rail when the feed fetch fails and there is no
// previously cached data. Silent by default (returns null) because a broken
// ticker should not degrade the rest of the page — only shows when the caller
// explicitly passes showError=true.

import type { TickerConfig } from "@/types/ticker"

interface TickerErrorStateProps {
  error: string | null
  config?: TickerConfig
  /** Whether to surface a visible error indicator. Default false (silent). */
  showError?: boolean
}

export function TickerErrorState({ error, config, showError = false }: TickerErrorStateProps) {
  // When emptyMode is "hide" or showError is false, collapse entirely
  if (!showError || config?.emptyMode === "hide") return null

  return (
    <div
      className="flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm"
      role="status"
      aria-live="polite"
    >
      <span className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase bg-destructive/20 text-destructive">
        !
      </span>
      <span className="opacity-60">
        {error ?? "Unable to load live scores"}
      </span>
    </div>
  )
}
