"use client"

// components/admin/module-diagnostics-panel.tsx
// Section 12.D — Module diagnostics panel.
//
// Cross-references the enabled homepage modules against a known list of
// modules that are frequently disabled by mistake. Surfaces actionable
// callouts for operators rather than silent failures.
//
// This panel intentionally reads from the full snapshot so it can cross-check
// feature flags against module state (e.g. venues disabled but venue_discovery_enabled).

import { AlertCircle, CheckCircle, Info } from "lucide-react"
import { ControlPlaneSectionCard } from "@/components/admin/control-plane-section-card"
import { isFeatureEnabled } from "@/lib/feature-flags"
import type { ControlPlaneSnapshot, HomepageModuleConfig } from "@/types/control-plane"
import { DEFAULT_HOMEPAGE_MODULES } from "@/lib/control-plane-defaults"

type DiagnosticResult = {
  level: "ok" | "warn" | "info"
  message: string
  detail?: string
}

function runDiagnostics(snapshot: ControlPlaneSnapshot | null): DiagnosticResult[] {
  const results: DiagnosticResult[] = []
  if (!snapshot) {
    results.push({
      level: "warn",
      message: "Control plane snapshot not available",
      detail: "All diagnostics are running against built-in defaults.",
    })
    return results
  }

  const modules: HomepageModuleConfig[] =
    snapshot.homepageModules.length > 0 ? snapshot.homepageModules : DEFAULT_HOMEPAGE_MODULES

  const isModuleEnabled = (key: string) =>
    modules.find((m) => m.key === key)?.enabled !== false

  // Calendar module check
  if (isModuleEnabled("calendar")) {
    results.push({ level: "ok", message: "calendar module is enabled" })
  } else {
    results.push({
      level: "warn",
      message: "calendar module is disabled",
      detail: "Users will not see My Calendar on the homepage.",
    })
  }

  // Venues module check
  if (isModuleEnabled("venues")) {
    results.push({ level: "ok", message: "venues module is enabled" })
  } else {
    results.push({
      level: "warn",
      message: "venues module is disabled",
      detail: "Users will not see Watch Here Tonight / Find Bars on the homepage.",
    })
  }

  // Ticker consistency check
  const tickerFlagOn = isFeatureEnabled(snapshot.featureFlags, "ticker_enabled")
  const tickerControlOn = snapshot.ticker?.mode !== "off"
  if (tickerFlagOn && !tickerControlOn) {
    results.push({
      level: "warn",
      message: "ticker_enabled flag is ON but ticker mode is \"off\"",
      detail: "The ticker will not render. Set ticker.mode to \"single\" or \"dual\" in the CMS.",
    })
  } else if (!tickerFlagOn && tickerControlOn) {
    results.push({
      level: "info",
      message: "ticker_enabled flag is OFF but ticker mode is set",
      detail: "The ticker flag takes precedence — the ticker will not surface.",
    })
  } else if (tickerFlagOn && tickerControlOn) {
    results.push({ level: "ok", message: "ticker is enabled and configured" })
  }

  // Venue discovery cross-check
  const venueDiscoveryOn = isFeatureEnabled(snapshot.featureFlags, "venue_discovery_enabled")
  if (venueDiscoveryOn && !isModuleEnabled("venues")) {
    results.push({
      level: "warn",
      message: "venue_discovery_enabled flag is ON but venues module is disabled",
      detail: "The venue discovery feature flag is active but the homepage venues module is off. Users reaching /venues directly will still see venue discovery.",
    })
  }

  // Tournament mode cross-check
  const tmOn = snapshot.tournamentMode?.enabled
  const tmHeroOn = snapshot.tournamentMode?.heroEnabled
  const tmModuleOn = isModuleEnabled("tournament")
  if (tmOn && tmHeroOn && !tmModuleOn) {
    results.push({
      level: "info",
      message: "Tournament hero enabled but tournament homepage module is not in module list",
      detail: "The tournament hero renders above all modules regardless — this is expected behavior.",
    })
  }
  if (tmOn) {
    results.push({ level: "ok", message: `Tournament mode is active: ${snapshot.tournamentMode?.type ?? "custom"} / ${snapshot.tournamentMode?.mode}` })
  }

  // No issues
  if (results.every((r) => r.level === "ok")) {
    results.push({ level: "info", message: "No diagnostic issues found." })
  }

  return results
}

type Props = {
  snapshot: ControlPlaneSnapshot | null
}

export function ModuleDiagnosticsPanel({ snapshot }: Props) {
  const results = runDiagnostics(snapshot)

  return (
    <ControlPlaneSectionCard
      id="diagnostics"
      title="Module Diagnostics"
      description="Cross-references module state, feature flags, and ticker config for common operator configuration mistakes."
    >
      <div className="space-y-2">
        {results.map((r, i) => {
          const Icon =
            r.level === "ok"   ? CheckCircle :
            r.level === "warn" ? AlertCircle :
                                 Info
          const colorClass =
            r.level === "ok"   ? "text-green-600 dark:text-green-400" :
            r.level === "warn" ? "text-yellow-700 dark:text-yellow-400" :
                                 "text-muted-foreground"
          const bgClass =
            r.level === "ok"   ? "bg-green-500/5   border-green-500/20"  :
            r.level === "warn" ? "bg-yellow-500/5  border-yellow-500/20" :
                                 "bg-muted/50       border-border/50"

          return (
            <div
              key={i}
              className={`flex items-start gap-2.5 rounded-lg border p-3 ${bgClass}`}
            >
              <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${colorClass}`} aria-hidden="true" />
              <div className="min-w-0">
                <p className={`text-xs font-medium ${colorClass}`}>{r.message}</p>
                {r.detail && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{r.detail}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </ControlPlaneSectionCard>
  )
}
