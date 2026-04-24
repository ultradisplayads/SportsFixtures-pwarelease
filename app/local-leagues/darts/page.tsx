"use client"

import { useState } from "react"
import { Target, Users, MapPin, Calendar } from "lucide-react"
import Link from "next/link"
import { triggerHaptic } from "@/lib/haptic-feedback"

interface DartsLeague {
  id: string
  name: string
  venue: string
  location: string
  teams: number
  season: string
  nextMatch: string
}

export default function DartsLeaguesPage() {
  const [leagues] = useState<DartsLeague[]>([
    {
      id: "1",
      name: "Bangkok Darts League - Premier Division",
      venue: "The Goal Post",
      location: "Bangkok, Thailand",
      teams: 10,
      season: "2024 Spring",
      nextMatch: "Tonight 8:00 PM",
    },
    {
      id: "2",
      name: "Thailand Darts Championship",
      venue: "Champions Lounge",
      location: "Bangkok, Thailand",
      teams: 16,
      season: "2024 Spring",
      nextMatch: "Friday 7:00 PM",
    },
  ])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-4">
        <h1 className="text-xl font-bold">Darts Leagues & Tables</h1>
        <p className="text-sm text-muted-foreground">Local darts competitions and standings</p>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {leagues.map((league) => (
          <Link
            key={league.id}
            href={`/local-leagues/darts/${league.id}`}
            className="rounded-lg border border-border bg-card p-4 hover:bg-accent transition-colors"
            onClick={() => triggerHaptic("light")}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{league.name}</h3>
                <p className="text-sm text-muted-foreground">{league.season}</p>

                <div className="mt-3 flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {league.venue}, {league.location}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {league.teams} teams
                  </div>
                  <div className="flex items-center gap-2 text-primary">
                    <Calendar className="h-4 w-4" />
                    Next match: {league.nextMatch}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {/* CTA for Venue Owners */}
        <div className="mt-6 rounded-lg border-2 border-primary bg-primary/5 p-4">
          <h3 className="font-semibold">Run a Darts League?</h3>
          <p className="mt-1 text-sm text-muted-foreground">Add your league and tables to reach more players</p>
          <Link
            href="/venues/owner-signup"
            className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Sign Up Your Venue
          </Link>
        </div>
      </div>
    </div>
  )
}
