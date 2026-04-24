"use client"

import { Ticket, MapPin, ExternalLink, Plane, Hotel, Car } from "lucide-react"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { ExternalLinkGuard } from "@/components/platform/external-link-guard"

interface MatchTicketsProps {
  homeTeam: string
  awayTeam: string
  venue: string
  date: string
}

export function MatchTickets({ homeTeam, awayTeam, venue, date }: MatchTicketsProps) {
  const handleTicketClick = (_provider: string) => {
    triggerHaptic("medium")
  }

  const handleTravelClick = (_type: string) => {
    triggerHaptic("medium")
  }

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          <h3 className="font-bold">Match Tickets</h3>
        </div>

        <div className="mb-3 rounded-lg bg-muted/30 p-3">
          <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{venue}</span>
          </div>
          <div className="text-xs text-muted-foreground">{new Date(date).toLocaleDateString()}</div>
        </div>

        <div className="space-y-2">
          <ExternalLinkGuard
            href={`https://www.stubhub.com/search?q=${encodeURIComponent(`${homeTeam} vs ${awayTeam}`)}`}
            onClick={() => handleTicketClick("StubHub")}
            className="flex items-center justify-between rounded-lg border border-border bg-background p-3 hover:bg-accent"
          >
            <div>
              <div className="font-semibold">StubHub</div>
              <div className="text-xs text-muted-foreground">Official resale marketplace</div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </ExternalLinkGuard>

          <ExternalLinkGuard
            href={`https://www.viagogo.com/ww/Sports-Tickets/Football?s=${encodeURIComponent(`${homeTeam} ${awayTeam}`)}`}
            onClick={() => handleTicketClick("Viagogo")}
            className="flex items-center justify-between rounded-lg border border-border bg-background p-3 hover:bg-accent"
          >
            <div>
              <div className="font-semibold">Viagogo</div>
              <div className="text-xs text-muted-foreground">Compare prices worldwide</div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </ExternalLinkGuard>

          <ExternalLinkGuard
            href={`https://www.ticketmaster.com/search?q=${encodeURIComponent(`${homeTeam} vs ${awayTeam}`)}`}
            onClick={() => handleTicketClick("Ticketmaster")}
            className="flex items-center justify-between rounded-lg border border-border bg-background p-3 hover:bg-accent"
          >
            <div>
              <div className="font-semibold">Ticketmaster</div>
              <div className="text-xs text-muted-foreground">Official ticket partner</div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </ExternalLinkGuard>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 font-bold">Travel &amp; Accommodation</h3>

        <div className="space-y-2">
          <ExternalLinkGuard
            href={`https://www.skyscanner.com/`}
            onClick={() => handleTravelClick("flights")}
            className="flex items-center justify-between rounded-lg border border-border bg-background p-3 hover:bg-accent"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Plane className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="font-semibold">Find Flights</div>
                <div className="text-xs text-muted-foreground">Compare airline prices</div>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </ExternalLinkGuard>

          <ExternalLinkGuard
            href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(venue.split(",")[0])}`}
            onClick={() => handleTravelClick("hotels")}
            className="flex items-center justify-between rounded-lg border border-border bg-background p-3 hover:bg-accent"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <Hotel className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="font-semibold">Book Hotels</div>
                <div className="text-xs text-muted-foreground">Stay near the stadium</div>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </ExternalLinkGuard>

          <ExternalLinkGuard
            href={`https://www.rentalcars.com/`}
            onClick={() => handleTravelClick("car-rental")}
            className="flex items-center justify-between rounded-lg border border-border bg-background p-3 hover:bg-accent"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <Car className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <div className="font-semibold">Rent a Car</div>
                <div className="text-xs text-muted-foreground">Compare rental deals</div>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </ExternalLinkGuard>
        </div>
      </div>

      <div className="rounded-lg bg-primary/10 p-3 text-center text-xs text-primary">
        Sports Fixtures earns commission from ticket and travel bookings (3-10%)
      </div>
    </div>
  )
}
