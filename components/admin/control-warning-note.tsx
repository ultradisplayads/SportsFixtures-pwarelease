"use client"

// components/admin/control-warning-note.tsx
// Section 12 — Dev-only control-plane state inspector.
//
// Shows the current control-plane snapshot status in a collapsible dev panel.
// Only renders in development or when showInProd is explicitly set.
// Never mount this in a production user-facing component tree.

import { useState } from "react"
import { ChevronDown, ChevronRight, Settings } from "lucide-react"
import type { ControlPlaneSnapshot } from "@/types/control-plane"

type Props = {
  snapshot: ControlPlaneSnapshot | null
  isLoading?: boolean
  error?: string | null
  showInProd?: boolean
  className?: string
}

export function ControlWarningNote({
  snapshot,
  isLoading,
  error,
  showInProd = false,
  className,
}: Props) {
  const [open, setOpen] = useState(false)

  // Never render in production unless explicitly permitted
  if (process.env.NODE_ENV !== "development" && !showInProd) return null

  const enabledFlags = (snapshot?.featureFlags ?? []).filter((f) => f.enabled).map((f) => f.key)
  const disabledFlags = (snapshot?.featureFlags ?? []).filter((f) => !f.enabled).map((f) => f.key)
  const enabledModules = (snapshot?.homepageModules ?? []).filter((m) => m.enabled).map((m) => `${m.key}@${m.position}`)
  const activeBoosts = (snapshot?.venueBoosts ?? []).filter((b) => b.enabled).length
  const activeSlots = (snapshot?.commercialSlots ?? []).filter((s) => s.enabled).length
  const tickerMode = snapshot?.ticker?.mode ?? "unknown"
  const tournamentOn = snapshot?.tournamentMode?.enabled ?? false

  return (
    <div className={`rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs font-mono ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 transition-colors rounded-lg"
        aria-expanded={open}
      >
        <Settings className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="flex-1 font-semibold">Control Plane</span>
        {isLoading && <span className="text-muted-foreground">loading…</span>}
        {error && <span className="text-destructive">error</span>}
        {!isLoading && !error && snapshot && (
          <span className="text-muted-foreground">
            ticker:{tickerMode} · modules:{enabledModules.length} · flags:{enabledFlags.length}/{(snapshot.featureFlags ?? []).length}
            {tournamentOn ? " · tournament:ON" : ""}
          </span>
        )}
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>

      {open && (
        <div className="border-t border-amber-500/20 px-3 py-2 space-y-2">
          {error && (
            <p className="text-destructive">Error: {error}</p>
          )}
          {snapshot && (
            <>
              <Row label="Ticker mode" value={tickerMode} />
              <Row label="Ticker refresh" value={`${snapshot.ticker?.refreshSeconds ?? "?"}s`} />
              <Row label="Modules" value={enabledModules.join(", ") || "none"} />
              <Row label="Enabled flags" value={enabledFlags.join(", ") || "none"} />
              {disabledFlags.length > 0 && (
                <Row label="Disabled flags" value={disabledFlags.join(", ")} warn />
              )}
              <Row label="Active commercial slots" value={String(activeSlots)} />
              <Row label="Active venue boosts" value={String(activeBoosts)} />
              <Row
                label="Tournament mode"
                value={tournamentOn ? `${snapshot.tournamentMode?.type ?? "custom"} / ${snapshot.tournamentMode?.mode}` : "off"}
              />
              <Row label="Generated at" value={snapshot.generatedAt ?? "unknown"} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground w-36 shrink-0">{label}:</span>
      <span className={warn ? "text-amber-600 dark:text-amber-400" : "text-foreground"}>{value}</span>
    </div>
  )
}
