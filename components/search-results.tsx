"use client"

import Link from "next/link"
import { Users, User } from "lucide-react"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { SmartLogo } from "@/components/assets/smart-logo"
import { SmartAvatar } from "@/components/assets/smart-avatar"

interface SearchResultsProps {
  teams: any[]
  players: any[]
  query: string
}

export function SearchResults({ teams, players, query }: SearchResultsProps) {
  const hasResults = teams.length > 0 || players.length > 0

  if (!hasResults) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="text-lg font-semibold">No results found</p>
        <p className="mt-2 text-sm text-muted-foreground">Try a different search term</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      {teams.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold">Teams ({teams.length})</h2>
          </div>
          <div className="space-y-2">
            {teams.map((team) => (
              <Link
                key={team.idTeam}
                href={`/team/${team.idTeam}`}
                onClick={() => triggerHaptic("light")}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-accent"
              >
                <SmartLogo
                  name={team.strTeam}
                  src={team.strTeamBadge || null}
                  className="h-12 w-12 object-contain"
                />
                <div className="flex-1">
                  <div className="font-semibold">{team.strTeam}</div>
                  <div className="text-sm text-muted-foreground">{team.strLeague}</div>
                  {team.strStadium && <div className="text-xs text-muted-foreground">{team.strStadium}</div>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {players.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold">Players ({players.length})</h2>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {players.map((player) => (
              <Link
                key={player.idPlayer}
                href={`/player/${player.idPlayer}`}
                onClick={() => triggerHaptic("light")}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-accent"
              >
                <SmartAvatar
                  name={player.strPlayer}
                  variant="player"
                  src={player.strThumb || null}
                  candidates={[player.strCutout]}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="flex-1 overflow-hidden">
                  <div className="truncate font-semibold">{player.strPlayer}</div>
                  <div className="text-sm text-muted-foreground">{player.strPosition}</div>
                  <div className="text-xs text-muted-foreground">{player.strTeam}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
