import { ChevronLeft, Calendar, MapPin, Ruler, Weight } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import { SkeletonLoader } from "@/components/skeleton-loader"
import { getPlayerDetails } from "@/app/actions/player-api"
import { FollowButton } from "@/components/follow-button"
import { SmartAvatar } from "@/components/assets/smart-avatar"
import { SmartLogo } from "@/components/assets/smart-logo"

export default async function PlayerPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Suspense fallback={<SkeletonLoader count={8} />}>
        <PlayerContent playerId={params.id} />
      </Suspense>
    </div>
  )
}

async function PlayerContent({ playerId }: { playerId: string }) {
  const player = await getPlayerDetails(playerId)

  if (!player) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Player not found</p>
      </div>
    )
  }

  return (
    <>
      <div className="border-b border-border bg-card">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href={`/team/${player.idTeam}`} className="rounded-lg p-2 hover:bg-accent">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold">{player.strPlayer}</h1>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4 flex items-start gap-4 rounded-xl border border-border bg-card p-4">
          <SmartAvatar
            name={player.strPlayer}
            variant="player"
            src={player.strThumb || null}
            candidates={[player.strCutout]}
            className="h-24 w-24 rounded-lg object-cover"
          />
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold">{player.strPlayer}</h2>
                <p className="text-sm text-muted-foreground">{player.strPosition}</p>
              </div>
              <FollowButton
                entityType="player"
                entityId={String(player.idPlayer || playerId)}
                entityName={player.strPlayer}
                entityLogo={player.strThumb || player.strCutout || undefined}
                entityMeta={{ team: player.strTeam || "", sport: player.strSport || "" }}
                size="sm"
              />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <SmartLogo
                name={player.strTeam || ""}
                src={player.strTeamBadge || null}
                className="h-6 w-6 object-contain"
              />
              <span className="text-sm font-medium">{player.strTeam}</span>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-base font-bold">Player Info</h3>
          <div className="grid grid-cols-2 gap-3">
            {player.dateBorn && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Born</div>
                  <div className="text-sm font-medium">{new Date(player.dateBorn).toLocaleDateString()}</div>
                </div>
              </div>
            )}
            {player.strBirthLocation && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Birthplace</div>
                  <div className="text-sm font-medium">{player.strBirthLocation}</div>
                </div>
              </div>
            )}
            {player.strHeight && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-3">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Height</div>
                  <div className="text-sm font-medium">{player.strHeight}</div>
                </div>
              </div>
            )}
            {player.strWeight && (
              <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-3">
                <Weight className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Weight</div>
                  <div className="text-sm font-medium">{player.strWeight}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {player.strDescriptionEN && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-2 text-base font-bold">Biography</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{player.strDescriptionEN}</p>
          </div>
        )}
      </div>
    </>
  )
}
