"use client"

import Link from "next/link"
import { Users } from "lucide-react"
import { SmartAvatar } from "@/components/assets/smart-avatar"

interface TeamSquadProps {
  players: any[]
}

export function TeamSquad({ players }: TeamSquadProps) {
  if (!players || players.length === 0) {
    return null
  }

  const positionOrder: Record<string, number> = {
    Goalkeeper: 1,
    Defender: 2,
    Midfielder: 3,
    Forward: 4,
    Attacker: 4,
  }

  const sortedPlayers = [...players].sort((a, b) => {
    const posA = positionOrder[a.strPosition] || 5
    const posB = positionOrder[b.strPosition] || 5
    return posA - posB
  })

  const groupedPlayers = sortedPlayers.reduce<Record<string, any[]>>(
    (acc, player) => {
      const position = player.strPosition || "Other"
      if (!acc[position]) acc[position] = []
      acc[position].push(player)
      return acc
    },
    {},
  )

  return (
    <div className="border-b border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-5 w-5" />
        <h2 className="text-base font-bold">Squad</h2>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedPlayers).map(([position, posPlayers]) => (
          <div key={position}>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{position}s</h3>
            <div className="grid grid-cols-2 gap-2">
              {posPlayers.map((player) => (
                <Link
                  key={player.idPlayer}
                  href={`/player/${player.idPlayer}`}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background p-2 hover:bg-accent"
                >
                  <SmartAvatar
                    name={player.strPlayer}
                    variant="player"
                    src={player.strThumb || null}
                    candidates={[player.strCutout]}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate text-sm font-medium">{player.strPlayer}</div>
                    <div className="text-xs text-muted-foreground">
                      {player.strNumber ? `#${player.strNumber}` : ""}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
