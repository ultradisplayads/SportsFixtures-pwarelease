import Link from "next/link"
import { getNextEventsByTeam, type Event } from "@/app/actions/sports-api"
import { SmartLogo } from "@/components/assets/smart-logo"
import { getMatchStatus } from "@/lib/match-utils"

interface TeamFixturesProps {
  teamId: string
}

function formatDateLabel(dateEvent?: string) {
  if (!dateEvent) return "Date TBC"
  try {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(new Date(dateEvent))
  } catch {
    return dateEvent
  }
}

function TeamFixtureRow({ event }: { event: Event }) {
  const status = getMatchStatus(event.strProgress || "NS")
  const kickoff = event.strTime?.slice(0, 5) || "TBC"

  return (
    <Link
      href={`/match/${event.idEvent}`}
      className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 transition-colors hover:bg-muted/40"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDateLabel(event.dateEvent)}</span>
          <span>•</span>
          <span>{kickoff}</span>
          <span>•</span>
          <span>{status.label}</span>
        </div>
        <div className="mt-2 grid gap-2">
          <div className="flex items-center gap-2">
            <SmartLogo
              name={event.strHomeTeam || "Home team"}
              src={event.strHomeTeamBadge || null}
              className="h-6 w-6 object-contain p-0.5"
            />
            <span className="truncate text-sm font-medium">{event.strHomeTeam || "Home team"}</span>
          </div>
          <div className="flex items-center gap-2">
            <SmartLogo
              name={event.strAwayTeam || "Away team"}
              src={event.strAwayTeamBadge || null}
              className="h-6 w-6 object-contain p-0.5"
            />
            <span className="truncate text-sm font-medium">{event.strAwayTeam || "Away team"}</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{event.strLeague || event.strSport || "Competition"}</p>
      </div>
    </Link>
  )
}

export async function TeamFixtures({ teamId }: TeamFixturesProps) {
  const fixtures = await getNextEventsByTeam(teamId)

  return (
    <section className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold">Upcoming Fixtures</h2>
        <span className="text-xs text-muted-foreground">{fixtures.length} scheduled</span>
      </div>

      {fixtures.length ? (
        <div className="grid gap-3">
          {fixtures.slice(0, 6).map((event) => (
            <TeamFixtureRow key={event.idEvent} event={event} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
          No upcoming fixtures are available for this team right now.
        </div>
      )}
    </section>
  )
}
