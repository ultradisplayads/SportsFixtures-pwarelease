"use client"

interface TeamStatsProps {
  team: any
}

export function TeamStats({ team }: TeamStatsProps) {
  if (!team) return null

  return (
    <div className="border-b border-border bg-card p-4">
      <h2 className="mb-3 text-base font-bold">Team Info</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/30 p-3">
          <div className="text-xs text-muted-foreground">Founded</div>
          <div className="text-lg font-bold">{team.intFormedYear || "N/A"}</div>
        </div>
        <div className="rounded-lg bg-muted/30 p-3">
          <div className="text-xs text-muted-foreground">Stadium</div>
          <div className="text-sm font-bold">{team.strStadium || "N/A"}</div>
        </div>
        <div className="rounded-lg bg-muted/30 p-3">
          <div className="text-xs text-muted-foreground">Location</div>
          <div className="text-sm font-bold">{team.strStadiumLocation || "N/A"}</div>
        </div>
        <div className="rounded-lg bg-muted/30 p-3">
          <div className="text-xs text-muted-foreground">Capacity</div>
          <div className="text-lg font-bold">
            {team.intStadiumCapacity ? Number.parseInt(team.intStadiumCapacity).toLocaleString() : "N/A"}
          </div>
        </div>
      </div>

      {team.strDescriptionEN && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-bold">About</h3>
          <p className="text-sm text-muted-foreground line-clamp-4">{team.strDescriptionEN}</p>
        </div>
      )}
    </div>
  )
}
