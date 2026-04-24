"use client"

import type { Event } from "@/app/actions/sports-api"
import Link from "next/link"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { SmartLogo } from "@/components/assets/smart-logo"

interface LeagueFixturesProps {
  nextEvents: Event[]
  pastEvents: Event[]
}

export function LeagueFixtures({ nextEvents, pastEvents }: LeagueFixturesProps) {
  const [showFixtures, setShowFixtures] = useState(true)
  const [showResults, setShowResults] = useState(false)

  return (
    <div className="flex flex-col gap-2 p-4">
      <button
        onClick={() => {
          triggerHaptic("light")
          setShowFixtures(!showFixtures)
        }}
        className="flex items-center justify-between rounded-lg bg-card p-3 hover:bg-accent"
      >
        <h3 className="font-bold">Upcoming Fixtures ({nextEvents?.length || 0})</h3>
        {showFixtures ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {showFixtures && nextEvents && nextEvents.length > 0 && (
        <div className="flex flex-col gap-2">
          {nextEvents.slice(0, 10).map((event) => (
            <Link
              key={event.idEvent}
              href={`/match/${event.idEvent}`}
              className="rounded-lg border border-border bg-card p-3 hover:bg-accent"
            >
              <div className="mb-2 text-xs text-muted-foreground">
                {new Date(event.dateEvent).toLocaleDateString()} {event.strTime}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-1 items-center gap-2">
                  <SmartLogo
                    name={event.strHomeTeam}
                    src={event.strHomeTeamBadge || null}
                    className="h-6 w-6 object-contain"
                  />
                  <span className="text-sm font-medium">{event.strHomeTeam}</span>
                </div>
                <div className="px-4 text-xs text-muted-foreground">vs</div>
                <div className="flex flex-1 items-center justify-end gap-2">
                  <span className="text-sm font-medium">{event.strAwayTeam}</span>
                  <SmartLogo
                    name={event.strAwayTeam}
                    src={event.strAwayTeamBadge || null}
                    className="h-6 w-6 object-contain"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <button
        onClick={() => {
          triggerHaptic("light")
          setShowResults(!showResults)
        }}
        className="flex items-center justify-between rounded-lg bg-card p-3 hover:bg-accent"
      >
        <h3 className="font-bold">Recent Results ({pastEvents?.length || 0})</h3>
        {showResults ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {showResults && pastEvents && pastEvents.length > 0 && (
        <div className="flex flex-col gap-2">
          {pastEvents.slice(0, 10).map((event) => (
            <Link
              key={event.idEvent}
              href={`/match/${event.idEvent}`}
              className="rounded-lg border border-border bg-card p-3 hover:bg-accent"
            >
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(event.dateEvent).toLocaleDateString()}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">FT</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-1 items-center gap-2">
                  <SmartLogo
                    name={event.strHomeTeam}
                    src={event.strHomeTeamBadge || null}
                    className="h-6 w-6 object-contain"
                  />
                  <span className="text-sm font-medium">{event.strHomeTeam}</span>
                </div>
                <div className="px-4 text-sm font-bold">
                  {event.intHomeScore} - {event.intAwayScore}
                </div>
                <div className="flex flex-1 items-center justify-end gap-2">
                  <span className="text-sm font-medium">{event.strAwayTeam}</span>
                  <SmartLogo
                    name={event.strAwayTeam}
                    src={event.strAwayTeamBadge || null}
                    className="h-6 w-6 object-contain"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
