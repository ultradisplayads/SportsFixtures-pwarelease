"use client"

// components/admin/home-modules-admin-table.tsx
// Section 12.B + 12.D — Homepage module inspection table.
//
// Shows all configured modules, their position, enabled state, audience,
// and any titleOverride. Calendar and venues are highlighted with a "key"
// marker because they are specifically called out in 12.D: operators must
// always be able to see at a glance whether these modules are on or off.

import { ControlPlaneSectionCard } from "@/components/admin/control-plane-section-card"
import { StatusBadge } from "@/components/admin/control-plane-key-value"
import { ControlPlaneEmptyState } from "@/components/admin/control-plane-empty-state"
import { DEFAULT_HOMEPAGE_MODULES } from "@/lib/control-plane-defaults"
import type { HomepageModuleConfig } from "@/types/control-plane"

// Keys that are specifically called out in Section 12.D for diagnostic visibility
const KEY_MODULES = new Set(["calendar", "venues"])

type Props = {
  modules: HomepageModuleConfig[] | null | undefined
}

export function HomeModulesAdminTable({ modules }: Props) {
  const src = modules && modules.length > 0 ? modules : DEFAULT_HOMEPAGE_MODULES
  const sorted = [...src].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

  // 12.D: surface a diagnostic callout if calendar or venues is disabled
  const calendarDisabled = src.find((m) => m.key === "calendar")?.enabled === false
  const venuesDisabled   = src.find((m) => m.key === "venues")?.enabled   === false
  const hasDiagnostic = calendarDisabled || venuesDisabled

  return (
    <ControlPlaneSectionCard
      id="homepage-modules"
      title="Homepage Modules"
      description="All configured modules, their enabled state, and position order. Calendar and venues are highlighted for quick diagnostic visibility."
    >
      {/* 12.D: diagnostic callout for key modules being disabled */}
      {hasDiagnostic && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-1">
          <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">
            Diagnostic: key module hidden
          </p>
          {calendarDisabled && (
            <p className="text-xs text-muted-foreground">
              <strong>calendar</strong> is disabled — users will not see My Calendar on home.
            </p>
          )}
          {venuesDisabled && (
            <p className="text-xs text-muted-foreground">
              <strong>venues</strong> is disabled — users will not see Find Bars / Watch Here Tonight on home.
            </p>
          )}
        </div>
      )}

      {sorted.length === 0 ? (
        <ControlPlaneEmptyState
          message="No homepage modules configured."
          note="Falling back to built-in defaults."
        />
      ) : (
        <div className="space-y-0">
          {sorted.map((m) => (
            <div
              key={m.key}
              className={`flex items-center justify-between border-t border-border/50 py-2.5 first:border-t-0 ${
                KEY_MODULES.has(m.key) ? "-mx-5 bg-yellow-500/5 px-5" : ""
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {/* Position index */}
                <span className="w-5 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                  {m.position}
                </span>

                {/* Module key */}
                <span
                  className={`text-sm font-medium ${
                    !m.enabled ? "text-muted-foreground line-through" : ""
                  }`}
                >
                  {m.key}
                </span>

                {/* 12.D key marker */}
                {KEY_MODULES.has(m.key) && (
                  <span className="rounded bg-yellow-500/20 px-1 py-0.5 font-bold text-[9px] uppercase text-yellow-700 dark:text-yellow-400">
                    key
                  </span>
                )}

                {/* Audience badge */}
                {m.audience && m.audience !== "all" && (
                  <span className="rounded bg-primary/10 px-1 py-0.5 text-[9px] font-medium text-primary uppercase">
                    {m.audience}
                  </span>
                )}

                {/* Title override */}
                {m.titleOverride && (
                  <span className="truncate text-[10px] text-muted-foreground">
                    ({m.titleOverride})
                  </span>
                )}
              </div>

              <StatusBadge enabled={m.enabled} />
            </div>
          ))}
        </div>
      )}
    </ControlPlaneSectionCard>
  )
}
