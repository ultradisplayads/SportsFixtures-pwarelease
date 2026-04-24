"use client"

// app/admin/control-plane/page.tsx
// Section 12.A + 12.B + 12.C + 12.D — Operator control-plane inspection page.
//
// Composes extracted panel components — all data comes from useControlPlane().
// This page is read-only; changes are made via the Strapi CMS.

import { RefreshCw, Info } from "lucide-react"
import { useControlPlane } from "@/hooks/use-control-plane"
import { ControlPlaneShell } from "@/components/admin/control-plane-shell"
import { ControlPlaneErrorState } from "@/components/admin/control-plane-error-state"
import { HomeModulesAdminTable } from "@/components/admin/home-modules-admin-table"
import { TickerAdminPanel } from "@/components/admin/ticker-admin-panel"
import { TournamentModePanel } from "@/components/admin/tournament-mode-panel"
import { FeatureFlagsPanel } from "@/components/admin/feature-flags-panel"
import { CommercialSlotsPanel } from "@/components/admin/commercial-slots-panel"
import { VenueBoostsPanel } from "@/components/admin/venue-boosts-panel"
import { ModuleDiagnosticsPanel } from "@/components/admin/module-diagnostics-panel"

export default function AdminControlPlanePage() {
  const { data, isLoading, error, refetch } = useControlPlane()

  const refreshButton = (
    <button
      onClick={refetch}
      className="flex items-center gap-1.5 rounded-lg border border-sidebar-foreground/20 px-3 py-1.5 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-foreground/10"
    >
      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
      Refresh
    </button>
  )

  return (
    <ControlPlaneShell
      title="Control Plane"
      subtitle="Live snapshot — read only"
      backHref="/admin"
      actions={refreshButton}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {/* Error banner — still renders panels with safe defaults below */}
      {error && !isLoading && <ControlPlaneErrorState error={error} />}

      {/* Snapshot age */}
      {!isLoading && data?.generatedAt && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Snapshot generated: {new Date(data.generatedAt).toLocaleString()}</span>
        </div>
      )}

      {!isLoading && (
        <>
          {/* 12.D — Module diagnostics: cross-references flags, modules, and ticker */}
          <ModuleDiagnosticsPanel snapshot={data} />

          {/* 12.B + 12.D — Homepage module table with calendar/venues highlight */}
          <HomeModulesAdminTable modules={data?.homepageModules} />

          {/* 12.B — Ticker control panel */}
          <TickerAdminPanel ticker={data?.ticker} />

          {/* 12.C — Tournament mode panel with stage + surface toggles */}
          <TournamentModePanel tournamentMode={data?.tournamentMode} />

          {/* 12.B — Feature flags */}
          <FeatureFlagsPanel featureFlags={data?.featureFlags} />

          {/* 12.B — Commercial slots */}
          <CommercialSlotsPanel commercialSlots={data?.commercialSlots} />

          {/* 12.B — Venue boost rules */}
          <VenueBoostsPanel venueBoosts={data?.venueBoosts} />

          {/* Raw JSON snapshot — collapsible, for deep debugging */}
          <details className="rounded-xl border border-border bg-card">
            <summary className="cursor-pointer rounded-xl p-4 text-sm font-semibold hover:bg-accent">
              Raw JSON snapshot
            </summary>
            <div className="border-t border-border px-4 pb-4 pt-3">
              <pre className="overflow-x-auto whitespace-pre-wrap break-all text-[10px] leading-relaxed text-muted-foreground">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </details>

          <p className="pb-2 text-center text-xs text-muted-foreground">
            Data is read-only. Edit values via the Strapi CMS and click Refresh to re-fetch.
          </p>
        </>
      )}
    </ControlPlaneShell>
  )
}
