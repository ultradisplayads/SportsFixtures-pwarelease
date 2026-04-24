"use client"

// components/admin/venue-boosts-panel.tsx
// Section 12.B — Venue boost rules inspection panel.
//
// Renders all VenueBoostRule entries with full scope context.
// Sponsor disclosure status is highlighted because it drives the disclosure
// pill shown to end users in venue discovery results.

import { ControlPlaneSectionCard } from "@/components/admin/control-plane-section-card"
import { KVRow, KVGroup, StatusBadge } from "@/components/admin/control-plane-key-value"
import { ControlPlaneEmptyState } from "@/components/admin/control-plane-empty-state"
import type { VenueBoostRule } from "@/types/control-plane"

type Props = {
  venueBoosts: VenueBoostRule[] | null | undefined
}

export function VenueBoostsPanel({ venueBoosts }: Props) {
  const boosts = venueBoosts ?? []

  return (
    <ControlPlaneSectionCard
      id="venue-boosts"
      title="Venue Boosts"
      description="Sponsored / boosted venue rules. Boosts are additive to organic scoring and must not silently corrupt relevance."
    >
      {boosts.length === 0 ? (
        <ControlPlaneEmptyState
          message="No venue boost rules configured."
          note="All venue ordering is purely organic until rules are added here."
        />
      ) : (
        <div className="space-y-3">
          {boosts.map((boost, i) => (
            <div
              key={`${boost.venueId}-${i}`}
              className="rounded-lg border border-border/60 bg-muted/30 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-sm">{boost.venueId}</span>
                <div className="flex items-center gap-2">
                  {boost.sponsorDisclosure && (
                    <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-yellow-700 dark:text-yellow-400">
                      Sponsored
                    </span>
                  )}
                  <StatusBadge enabled={boost.enabled} />
                </div>
              </div>
              <KVGroup>
                <KVRow label="Scope"       value={boost.scope} />
                {boost.sport         && <KVRow label="Sport"       value={boost.sport} />}
                {boost.competitionId && <KVRow label="Competition" value={boost.competitionId} mono />}
                {boost.eventId       && <KVRow label="Event"       value={boost.eventId}       mono />}
                {boost.notes         && <KVRow label="Notes"       value={boost.notes} />}
              </KVGroup>
            </div>
          ))}
        </div>
      )}
    </ControlPlaneSectionCard>
  )
}
