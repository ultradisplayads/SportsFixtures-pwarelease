"use client"

// components/tournament/group-table-block.tsx
// Section 14 — Tournament Group Table
//
// Rules:
//   - only renders when groupTableVisible=true in the surface decision
//   - data must come from real normalized TournamentGroupTable[] — no improvised page logic
//   - if no groups are provided (empty array), renders an honest empty state
//   - compatible with Section 03 standings logic — does not duplicate it blindly
//   - qualification status shown only when explicitly provided in data

import type { TournamentGroupTable, TournamentSurfaceDecision } from "@/types/tournament-mode"
import { cn } from "@/lib/utils"

type Props = {
  groups: TournamentGroupTable[]
  surface: TournamentSurfaceDecision
  className?: string
}

const QUALIFICATION_CLASSES: Record<string, string> = {
  qualified:  "bg-primary/15 text-primary",
  eliminated: "bg-destructive/15 text-destructive",
  tbc:        "bg-muted text-muted-foreground",
}

function GroupTable({ group }: { group: TournamentGroupTable }) {
  const label = group.groupLabel ?? group.groupKey

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border bg-muted/40 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs" aria-label={`${label} standings`}>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 pl-3 pr-2 text-left font-medium">Team</th>
              <th className="px-2 py-2 text-center font-medium" title="Played">P</th>
              <th className="px-2 py-2 text-center font-medium" title="Won">W</th>
              <th className="px-2 py-2 text-center font-medium" title="Drawn">D</th>
              <th className="px-2 py-2 text-center font-medium" title="Lost">L</th>
              <th className="px-2 py-2 text-center font-medium" title="Goal Difference">GD</th>
              <th className="px-2 py-2 pr-3 text-center font-semibold text-foreground" title="Points">Pts</th>
            </tr>
          </thead>
          <tbody>
            {group.teams.map((team, idx) => {
              const qualClass = team.qualificationStatus
                ? QUALIFICATION_CLASSES[team.qualificationStatus] ?? ""
                : ""

              return (
                <tr
                  key={team.teamId}
                  className={cn(
                    "border-b border-border/50 last:border-0",
                    idx % 2 === 0 ? "bg-background" : "bg-card",
                  )}
                >
                  <td className="py-2 pl-3 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="w-4 shrink-0 text-center text-muted-foreground">
                        {idx + 1}
                      </span>
                      {team.qualificationStatus && (
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            qualClass,
                          )}
                          aria-label={team.qualificationStatus}
                        />
                      )}
                      <span className="font-medium text-foreground truncate max-w-[100px]">
                        {team.teamName}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">{team.played}</td>
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">{team.won}</td>
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">{team.drawn}</td>
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">{team.lost}</td>
                  <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">
                    {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                  </td>
                  <td className="px-2 py-2 pr-3 text-center tabular-nums font-semibold text-foreground">
                    {team.points}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function GroupTableBlock({ groups, surface, className }: Props) {
  // Gate: surface decision is the authority
  if (!surface.groupTableVisible) return null

  return (
    <div className={cn("px-3 py-3", className)}>
      <h2 className="mb-3 text-sm font-semibold text-foreground">Group Standings</h2>

      {groups.length === 0 ? (
        // Honest empty state — no fake data
        <div className="rounded-xl border border-border bg-card px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Group standings are not yet available.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <GroupTable key={group.groupKey} group={group} />
          ))}
        </div>
      )}
    </div>
  )
}
