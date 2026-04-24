"use client"

// components/admin/tournament-mode-panel.tsx
// Section 12.C — Tournament mode inspection panel.
//
// Surfaces type, mode, stage, and all surface-toggle flags.
// When tournament mode is off, shows an informational callout so the operator
// understands why tournament content is not surfacing.

import { Info } from "lucide-react"
import { ControlPlaneSectionCard } from "@/components/admin/control-plane-section-card"
import { KVRow, KVGroup, StatusBadge } from "@/components/admin/control-plane-key-value"
import type { TournamentModeDto } from "@/types/control-plane"

type Props = {
  tournamentMode: TournamentModeDto | null | undefined
}

export function TournamentModePanel({ tournamentMode }: Props) {
  const tm = tournamentMode

  return (
    <ControlPlaneSectionCard id="tournament" title="Tournament Mode">
      <KVGroup>
        <KVRow label="Enabled"               value={<StatusBadge enabled={tm?.enabled ?? false} />} />
        <KVRow label="Type"                  value={tm?.type} />
        <KVRow label="Mode"                  value={tm?.mode} />
        <KVRow label="Stage"                 value={tm?.stage} />
        <KVRow label="Display name"          value={tm?.displayName} />
        <KVRow label="Short name"            value={tm?.shortName} />
        <KVRow label="Host location"         value={tm?.hostLocation} />
        <KVRow label="Start (ISO)"           value={tm?.tournamentStartIso} mono />
        <KVRow label="End (ISO)"             value={tm?.tournamentEndIso} mono />
        <KVRow label="Hero enabled"          value={<StatusBadge enabled={tm?.heroEnabled           ?? false} />} />
        <KVRow label="Nav boost"             value={<StatusBadge enabled={tm?.navEnabled            ?? false} />} />
        <KVRow label="Ticker boost"          value={<StatusBadge enabled={tm?.tickerBoostEnabled    ?? false} />} />
        <KVRow label="Homepage module"       value={<StatusBadge enabled={tm?.homepageModuleEnabled ?? false} />} />
        <KVRow label="Venue boost"           value={<StatusBadge enabled={tm?.venueBoostEnabled     ?? false} />} />
        <KVRow label="Editorial boost"       value={<StatusBadge enabled={tm?.editorialBoostEnabled ?? false} />} />
        <KVRow label="Countdown enabled"     value={<StatusBadge enabled={tm?.countdownEnabled      ?? false} />} />
        <KVRow
          label="Featured competitions"
          value={
            !tm?.featuredCompetitionIds || tm.featuredCompetitionIds.length === 0
              ? "none"
              : tm.featuredCompetitionIds.join(", ")
          }
          mono
        />
        <KVRow
          label="Featured teams"
          value={
            !tm?.featuredTeamIds || tm.featuredTeamIds.length === 0
              ? "none"
              : tm.featuredTeamIds.join(", ")
          }
          mono
        />
      </KVGroup>

      {/* Informational callout when mode is off */}
      {!tm?.enabled && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
          <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="text-xs text-muted-foreground">
            Tournament mode is currently OFF. World Cup / tournament content will not surface until enabled via CMS.
          </p>
        </div>
      )}
    </ControlPlaneSectionCard>
  )
}
