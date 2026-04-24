"use client"

// components/admin/commercial-slots-panel.tsx
// Section 12.B — Commercial slots inspection panel.
//
// Shows all CommercialSlotConfig entries: key, slotType, audience, position,
// and enabled state. No mock data — all values from snapshot.

import { ControlPlaneSectionCard } from "@/components/admin/control-plane-section-card"
import { KVRow, KVGroup, StatusBadge } from "@/components/admin/control-plane-key-value"
import { ControlPlaneEmptyState } from "@/components/admin/control-plane-empty-state"
import type { CommercialSlotConfig } from "@/types/control-plane"

const SLOT_TYPE_LABEL: Record<CommercialSlotConfig["slotType"], string> = {
  promo: "Promo",
  affiliate: "Affiliate",
  sponsored: "Sponsored",
  venue_boost: "Venue boost",
}

type Props = {
  commercialSlots: CommercialSlotConfig[] | null | undefined
}

export function CommercialSlotsPanel({ commercialSlots }: Props) {
  const slots = commercialSlots ?? []

  return (
    <ControlPlaneSectionCard
      id="commercial"
      title="Commercial Slots"
      description="Geo-ad slots, sponsor slots, and commercial content config. Audience rules must be explicit."
    >
      {slots.length === 0 ? (
        <ControlPlaneEmptyState
          message="No commercial slots configured."
          note="Paid content must be explicitly configured here before it can surface."
        />
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => (
            <div
              key={slot.key}
              className="rounded-lg border border-border/60 bg-muted/30 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-sm">{slot.key}</span>
                <StatusBadge enabled={slot.enabled} />
              </div>
              <KVGroup>
                <KVRow label="Type"     value={SLOT_TYPE_LABEL[slot.slotType] ?? slot.slotType} />
                <KVRow label="Audience" value={slot.audience ?? "all"} />
                <KVRow label="Position" value={slot.position ?? "—"} />
                {slot.notes && <KVRow label="Notes" value={slot.notes} />}
              </KVGroup>
            </div>
          ))}
        </div>
      )}
    </ControlPlaneSectionCard>
  )
}
