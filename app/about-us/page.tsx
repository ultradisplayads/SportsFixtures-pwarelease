import Link from "next/link"
import { Activity, MapPin, Radio, Tv } from "lucide-react"

import { BottomNav } from "@/components/bottom-nav"
import { HeaderMenu } from "@/components/header-menu"

const points = [
  { icon: Radio, title: "Live sport first", copy: "Fast access to fixtures, live scores, results, tables, and match reminders." },
  { icon: Tv, title: "TV and places to watch", copy: "TV listings connect into nearby venues so fans can find somewhere showing the match." },
  { icon: MapPin, title: "Location-aware by design", copy: "The app uses location features for nearby matches, sports bars, offers, and check-ins when permitted." },
]

export default function AboutUsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <HeaderMenu />
      <main className="flex-1 p-4">
        <div className="mb-5 rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 inline-flex rounded-xl bg-primary/10 p-2 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold">About SportsFixtures</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            SportsFixtures is the mobile-first companion for live sport, TV guides, venues, reminders,
            fan favourites, and match-day discovery across the Shozzle ecosystem.
          </p>
        </div>

        <div className="space-y-3">
          {points.map((point) => {
            const Icon = point.icon
            return (
              <div key={point.title} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{point.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{point.copy}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <Link
          href="/browse"
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
        >
          Browse sports and competitions
        </Link>
      </main>
      <BottomNav />
    </div>
  )
}
