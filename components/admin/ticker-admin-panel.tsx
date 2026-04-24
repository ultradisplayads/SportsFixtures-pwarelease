"use client"

// components/admin/ticker-admin-panel.tsx
// Section 12.B — Ticker control-plane inspection panel.
//
// Renders all TickerControlDto fields in readable KV rows.
// All values come from the live snapshot — no hardcoded fallbacks in the UI.

import { ControlPlaneSectionCard } from "@/components/admin/control-plane-section-card"
import { KVRow, KVGroup, StatusBadge } from "@/components/admin/control-plane-key-value"
import type { TickerControlDto } from "@/types/control-plane"

type Props = {
  ticker: TickerControlDto | null | undefined
}

export function TickerAdminPanel({ ticker }: Props) {
  const t = ticker

  return (
    <ControlPlaneSectionCard id="ticker" title="Ticker">
      <KVGroup>
        <KVRow label="Mode"              value={t?.mode} />
        <KVRow label="Primary rail"      value={<StatusBadge enabled={t?.primaryEnabled    ?? false} />} />
        <KVRow label="Secondary rail"    value={<StatusBadge enabled={t?.secondaryEnabled   ?? false} />} />
        <KVRow label="Live scores"       value={<StatusBadge enabled={t?.includeLiveScores   ?? false} />} />
        <KVRow label="Breaking news"     value={<StatusBadge enabled={t?.includeBreakingNews ?? false} />} />
        <KVRow label="TV now"            value={<StatusBadge enabled={t?.includeTvNow        ?? false} />} />
        <KVRow label="Promos"            value={<StatusBadge enabled={t?.includePromos       ?? false} />} />
        <KVRow label="Venue messages"    value={<StatusBadge enabled={t?.includeVenueMessages ?? false} />} />
        <KVRow label="Sponsors"          value={<StatusBadge enabled={t?.includeSponsors     ?? false} />} />
        <KVRow label="Max primary items" value={t?.maxPrimaryItems} />
        <KVRow label="Max secondary"     value={t?.maxSecondaryItems} />
        <KVRow label="Refresh (s)"       value={t?.refreshSeconds} />
        <KVRow label="Empty mode"        value={t?.emptyMode} />
        <KVRow
          label="Allowed sports"
          value={
            !t?.allowedSports || t.allowedSports.length === 0
              ? "all"
              : t.allowedSports.join(", ")
          }
        />
      </KVGroup>
    </ControlPlaneSectionCard>
  )
}
