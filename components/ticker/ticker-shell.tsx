"use client"

// components/ticker/ticker-shell.tsx
// Section 15.A — Ticker shell: mode gate, loading skeleton, error surface.
//
// The shell is the single authority for whether the ticker renders at all.
// It consumes useTickerFeed and delegates rendering to PrimaryTicker /
// SecondaryTicker. LiveTicker in live-ticker.tsx is now a thin wrapper
// around this component.
//
// Mode decisions (brief 15.A):
//   mode="off"      → return null (entire ticker hidden)
//   mode="single"   → primary rail only
//   mode="dual"     → primary + secondary rails

import { useTickerFeed } from "@/hooks/use-ticker-feed"
import { PrimaryTicker } from "@/components/ticker/primary-ticker"
import { SecondaryTicker } from "@/components/ticker/secondary-ticker"
import { TickerErrorState } from "@/components/ticker/ticker-error-state"

/**
 * TickerLayoutShell — a pure layout wrapper used when the caller manages
 * data fetching externally and just needs the chrome (border, background,
 * optional title) around arbitrary ticker content.
 *
 * Use TickerShell when you want the full feed-orchestrating behaviour.
 * Use TickerLayoutShell when composing custom ticker surfaces.
 */
interface TickerLayoutShellProps {
  children: React.ReactNode
  title?: string
  className?: string
}

export function TickerLayoutShell({ children, title, className = "" }: TickerLayoutShellProps) {
  return (
    <div
      className={`relative overflow-hidden border-b border-border bg-primary text-primary-foreground ${className}`}
      role="region"
      aria-label={title ?? "Live ticker"}
    >
      {children}
    </div>
  )
}

interface TickerShellProps {
  sport?: string
  /** Show a visible error indicator when the feed fails. Default: false (silent). */
  showError?: boolean
}

export function TickerShell({ sport = "soccer", showError = false }: TickerShellProps) {
  const { data, isLoading, error } = useTickerFeed({ sport, autoRefresh: true })

  // Loading: reserve the primary rail height so layout does not jump
  if (isLoading && !data) {
    return (
      <div
        className="relative overflow-hidden border-b border-border bg-primary text-primary-foreground h-[41px]"
        aria-busy="true"
        aria-label="Loading live scores"
      />
    )
  }

  // Feed error with no cached data
  if (error && !data) {
    return (
      <div className="relative overflow-hidden border-b border-border bg-primary text-primary-foreground">
        <div className="flex">
          <TickerErrorState error={error} showError={showError} />
        </div>
      </div>
    )
  }

  if (!data || data.config.mode === "off") return null

  return (
    <>
      {data.config.primaryEnabled && (
        <PrimaryTicker items={data.primary} config={data.config} />
      )}
      {data.config.secondaryEnabled && data.secondary.length > 0 && (
        <SecondaryTicker items={data.secondary} />
      )}
    </>
  )
}
