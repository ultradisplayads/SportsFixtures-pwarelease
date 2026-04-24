import { getTeamDetails } from "@/app/actions/sports-api"
import { ChevronLeft, Star } from "lucide-react"
import Link from "next/link"
import { SmartImage } from "@/components/assets/smart-image"
import { normalizeTeamBadge } from "@/lib/asset-normalization"

interface TeamHeaderProps {
  teamId: string
}

export async function TeamHeader({ teamId }: TeamHeaderProps) {
  const team = await getTeamDetails(teamId)

  if (!team) {
    return null
  }

  // Normalize badge via central resolver — no raw provider fields in JSX
  const badgeSet = normalizeTeamBadge(team as Record<string, unknown>, team.strTeam)

  return (
    <div className="border-b border-border bg-card">
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href="/" className="rounded-lg p-2 hover:bg-accent">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <SmartImage
          kind="team_badge"
          src={badgeSet.primary}
          fallbackLabel={badgeSet.fallbackLabel}
          alt={team.strTeam ?? "Team badge"}
          className="h-10 w-10 object-contain"
          width={40}
          height={40}
        />
        <div className="flex-1">
          <h1 className="text-lg font-bold">{team.strTeam}</h1>
          <p className="text-xs text-muted-foreground">{team.strStadium}</p>
        </div>
        <button className="rounded-lg p-2 hover:bg-accent">
          <Star className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
