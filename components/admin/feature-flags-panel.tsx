"use client"

// components/admin/feature-flags-panel.tsx
// Section 12.B — Feature flag inspection panel.
//
// Renders all FeatureFlagDto entries from the snapshot. Applies withFlagDefaults
// so all known keys are always shown, even if the CMS omits them.

import { ControlPlaneSectionCard } from "@/components/admin/control-plane-section-card"
import { StatusBadge } from "@/components/admin/control-plane-key-value"
import { ControlPlaneEmptyState } from "@/components/admin/control-plane-empty-state"
import { withFlagDefaults } from "@/lib/feature-flags"
import type { FeatureFlagDto } from "@/types/control-plane"

type Props = {
  featureFlags: FeatureFlagDto[] | null | undefined
}

export function FeatureFlagsPanel({ featureFlags }: Props) {
  // withFlagDefaults ensures all known keys appear even if the CMS omits them.
  // Missing keys default to enabled=false (opt-in, never opt-out).
  const flags = withFlagDefaults(featureFlags)

  return (
    <ControlPlaneSectionCard
      id="feature-flags"
      title="Feature Flags"
      description="All known feature flags. Keys not present in the CMS default to disabled."
    >
      {flags.length === 0 ? (
        <ControlPlaneEmptyState
          message="No feature flags configured."
          note="All features will default to disabled."
        />
      ) : (
        <div className="space-y-0">
          {flags.map((flag) => (
            <div
              key={flag.key}
              className="flex items-start justify-between border-t border-border/50 py-2.5 first:border-t-0"
            >
              <div className="min-w-0 flex-1 pr-4">
                <span className="font-mono text-sm">{flag.key}</span>
                {flag.notes && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{flag.notes}</p>
                )}
              </div>
              <StatusBadge enabled={flag.enabled} />
            </div>
          ))}
        </div>
      )}
    </ControlPlaneSectionCard>
  )
}
