"use client"

import type { TableEntry } from "@/app/actions/sports-api"
import Link from "next/link"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { SmartLogo } from "@/components/assets/smart-logo"

interface LeagueTableProps {
  table: TableEntry[]
  leagueId: string
}

export function LeagueTable({ table, leagueId }: LeagueTableProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!table || table.length === 0) {
    return null
  }

  const toggleExpand = () => {
    triggerHaptic("light")
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="border-b border-border bg-card">
      <button
        onClick={toggleExpand}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-accent"
      >
        <h2 className="text-base font-bold">Standings</h2>
        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="sticky left-0 bg-muted/50 px-2 py-2 text-left font-semibold">#</th>
                <th className="sticky left-8 bg-muted/50 px-2 py-2 text-left font-semibold">Team</th>
                <th className="px-2 py-2 text-center font-semibold">P</th>
                <th className="px-2 py-2 text-center font-semibold">W</th>
                <th className="px-2 py-2 text-center font-semibold">D</th>
                <th className="px-2 py-2 text-center font-semibold">L</th>
                <th className="px-2 py-2 text-center font-semibold">GD</th>
                <th className="px-2 py-2 text-center font-semibold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {table.map((entry, index) => {
                const rank = Number.parseInt(entry.intRank)
                let rankColor = ""
                if (rank <= 4) rankColor = "bg-blue-500/10 border-l-2 border-l-blue-500"
                else if (rank === 5) rankColor = "bg-orange-500/10 border-l-2 border-l-orange-500"
                else if (rank >= table.length - 2) rankColor = "bg-red-500/10 border-l-2 border-l-red-500"

                return (
                  <tr key={entry.idTeam} className={`border-b border-border hover:bg-accent ${rankColor}`}>
                    <td className="sticky left-0 bg-card px-2 py-2 text-center font-semibold">{entry.intRank}</td>
                    <td className="sticky left-8 bg-card">
                      <Link
                        href={`/team/${entry.idTeam}`}
                        className="flex items-center gap-2 px-2 py-2 hover:underline"
                      >
                        <SmartLogo
                          name={entry.strTeam}
                          src={entry.strTeamBadge || null}
                          className="h-5 w-5 object-contain"
                        />
                        <span className="truncate font-medium">{entry.strTeam}</span>
                      </Link>
                    </td>
                    <td className="px-2 py-2 text-center">{entry.intPlayed}</td>
                    <td className="px-2 py-2 text-center">{entry.intWin}</td>
                    <td className="px-2 py-2 text-center">{entry.intDraw}</td>
                    <td className="px-2 py-2 text-center">{entry.intLoss}</td>
                    <td className="px-2 py-2 text-center font-semibold">
                      {Number.parseInt(entry.intGoalDifference) >= 0 ? "+" : ""}
                      {entry.intGoalDifference}
                    </td>
                    <td className="px-2 py-2 text-center font-bold">{entry.intPoints}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
