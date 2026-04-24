"use client"

import { Star, Trash2, Bell, Search } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { SmartLogo } from "@/components/assets/smart-logo"

interface Favourite {
  id: string
  type: "team" | "league"
  name: string
  logo: string | null
  league: string
  nextMatch: string
  upcomingMatches?: {
    id: string
    opponent: string
    date: string
    time: string
    home: boolean
  }[]
}

export function FavouritesList() {
  const [favourites, setFavourites] = useState<Favourite[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "teams" | "leagues">("all")

  useEffect(() => {
    loadFavourites()
  }, [])

  const loadFavourites = async () => {
    const followedTeamsStr = localStorage.getItem("followedTeams")
    if (!followedTeamsStr) return

    const followedIds: string[] = JSON.parse(followedTeamsStr)
    if (followedIds.length === 0) return

    // Fetch real team data for each followed team from TheSportsDB
    const { getTeamDetails, getNextEvents } = await import("@/app/actions/sports-api")

    const results: Favourite[] = []
    for (const teamId of followedIds.slice(0, 10)) {
      try {
        const team = await getTeamDetails(teamId)
        if (!team) continue

        // Fetch next fixtures for this team's league
        const events = team.idLeague ? await getNextEvents(team.idLeague) : []
        const teamEvents = events
          .filter(
            (e: any) =>
              e.idHomeTeam === teamId || e.idAwayTeam === teamId
          )
          .slice(0, 3)

        const upcomingMatches = teamEvents.map((e: any, i: number) => ({
          id: e.idEvent,
          opponent: e.idHomeTeam === teamId ? e.strAwayTeam : e.strHomeTeam,
          date: e.dateEvent || "",
          time: e.strTime || "TBD",
          home: e.idHomeTeam === teamId,
        }))

        const nextMatch =
          upcomingMatches.length > 0
            ? `vs ${upcomingMatches[0].opponent} — ${upcomingMatches[0].date}`
            : "No upcoming fixtures"

        results.push({
          id: team.idTeam,
          type: "team",
          name: team.strTeam,
          logo: team.strTeamBadge || null,
          league: team.strLeague || "",
          nextMatch,
          upcomingMatches,
        })
      } catch {
        // skip team on error
      }
    }

    setFavourites(results)
  }

  const removeFavourite = (id: string) => {
    triggerHaptic("medium")
    setFavourites(favourites.filter((fav) => fav.id !== id))

    const followedTeamsStr = localStorage.getItem("followedTeams")
    if (followedTeamsStr) {
      const followedIds = JSON.parse(followedTeamsStr)
      const updated = followedIds.filter((fId: string) => fId !== id)
      localStorage.setItem("followedTeams", JSON.stringify(updated))
    }
  }

  const setReminder = (id: string) => {
    triggerHaptic("success")
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Reminder set!", {
        body: "You will be reminded before the match.",
        icon: "/icons/icon-192x192.png",
      })
    }
  }

  const filteredFavourites = favourites
    .filter((fav) => {
      if (activeTab === "teams") return fav.type === "team"
      if (activeTab === "leagues") return fav.type === "league"
      return true
    })
    .filter((fav) => fav.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="flex-1 overflow-y-auto bg-secondary/20 p-4">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search favourites..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b">
        <button
          className={`pb-3 px-4 text-sm font-semibold transition-colors ${
            activeTab === "all" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
          }`}
          onClick={() => {
            setActiveTab("all")
            triggerHaptic("selection")
          }}
        >
          All
        </button>
        <button
          className={`pb-3 px-4 text-sm font-semibold transition-colors ${
            activeTab === "teams" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
          }`}
          onClick={() => {
            setActiveTab("teams")
            triggerHaptic("selection")
          }}
        >
          Teams
        </button>
        <button
          className={`pb-3 px-4 text-sm font-semibold transition-colors ${
            activeTab === "leagues" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
          }`}
          onClick={() => {
            setActiveTab("leagues")
            triggerHaptic("selection")
          }}
        >
          Leagues
        </button>
      </div>

      {filteredFavourites.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
          <Star className="mb-4 h-16 w-16 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-bold">No Favourites Yet</h2>
          <p className="text-sm text-muted-foreground">Add your favourite teams and leagues to see them here</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">My Favourites</h2>
            <span className="text-sm text-muted-foreground">({filteredFavourites.length} items)</span>
          </div>

          {filteredFavourites.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <SmartLogo
                  name={item.name}
                  src={item.logo}
                  className="h-12 w-12 rounded-full object-contain"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.league}</p>
                    </div>
                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  </div>

                  {/* Next Match */}
                  <div className="mt-2 rounded-lg bg-accent/50 p-2">
                    <p className="text-xs font-medium text-muted-foreground">Next Match</p>
                    <p className="text-sm font-semibold">{item.nextMatch}</p>
                  </div>

                  {/* Upcoming Matches for Teams */}
                  {item.type === "team" && item.upcomingMatches && (
                    <div className="mt-3 space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Upcoming Fixtures</p>
                      {item.upcomingMatches.map((match) => (
                        <Link
                          key={match.id}
                          href={`/match/${match.id}`}
                          onClick={() => triggerHaptic("light")}
                          className="flex items-center justify-between rounded-lg border border-border bg-background p-2 text-xs transition-colors hover:bg-accent"
                        >
                          <span className="font-medium">
                            {match.home ? "vs" : "@"} {match.opponent}
                          </span>
                          <span className="text-muted-foreground">
                            {match.date}, {match.time}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setReminder(item.id)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95"
                    >
                      <Bell className="h-3 w-3" />
                      Remind Me
                    </button>
                    <button
                      onClick={() => removeFavourite(item.id)}
                      className="flex items-center gap-1 rounded-lg border border-destructive bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20 active:scale-95"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
