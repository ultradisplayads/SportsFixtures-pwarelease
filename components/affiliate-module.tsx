"use client"

import { ExternalLink, Ticket, Plane, Tv, Hotel } from "lucide-react"
import { triggerHaptic } from "@/lib/haptic-feedback"

export type AffiliateContext = "event" | "venue" | "watch" | "travel" | "ticket"

interface AffiliateLink {
  label: string
  url: string
  icon: React.ElementType
  description: string
  badge?: string
}

// Affiliate link sets per context — swap hrefs with real partner URLs
const AFFILIATE_LINKS: Record<AffiliateContext, AffiliateLink[]> = {
  event: [
    {
      label: "Buy Tickets",
      url: "https://www.ticketmaster.com",
      icon: Ticket,
      description: "Official match tickets",
      badge: "Official",
    },
    {
      label: "Watch Live",
      url: "https://www.sportsfixtures.net/watch",
      icon: Tv,
      description: "Stream this match online",
    },
    {
      label: "Book Travel",
      url: "https://www.booking.com",
      icon: Plane,
      description: "Hotels & flights near the venue",
    },
  ],
  venue: [
    {
      label: "Reserve a Table",
      url: "#reserve",
      icon: Ticket,
      description: "Book your spot at the bar",
      badge: "Recommended",
    },
    {
      label: "Directions",
      url: "#directions",
      icon: Plane,
      description: "Get there easily",
    },
  ],
  watch: [
    {
      label: "Stream Now",
      url: "https://www.sportsfixtures.net/watch",
      icon: Tv,
      description: "Watch this match live online",
      badge: "Partner",
    },
    {
      label: "Find a Bar",
      url: "/venues",
      icon: Hotel,
      description: "Watch with a crowd",
    },
  ],
  travel: [
    {
      label: "Book Hotel",
      url: "https://www.booking.com",
      icon: Hotel,
      description: "Accommodation near the match",
      badge: "Partner",
    },
    {
      label: "Flights",
      url: "https://www.skyscanner.com",
      icon: Plane,
      description: "Find the best flight deals",
    },
  ],
  ticket: [
    {
      label: "Official Tickets",
      url: "https://www.ticketmaster.com",
      icon: Ticket,
      description: "Buy direct from the organiser",
      badge: "Official",
    },
    {
      label: "Resale Market",
      url: "https://www.viagogo.com",
      icon: Ticket,
      description: "Last-minute and resale tickets",
    },
  ],
}

interface Props {
  context: AffiliateContext
  title?: string
  className?: string
}

export function AffiliateModule({ context, title, className = "" }: Props) {
  const links = AFFILIATE_LINKS[context]
  if (!links?.length) return null

  const defaultTitles: Record<AffiliateContext, string> = {
    event: "For this match",
    venue: "Venue options",
    watch: "Where to watch",
    travel: "Plan your trip",
    ticket: "Get tickets",
  }

  return (
    <div className={`rounded-xl border border-border bg-card ${className}`}>
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-bold">{title ?? defaultTitles[context]}</p>
      </div>
      <div className="divide-y divide-border">
        {links.map((link) => {
          const Icon = link.icon
          const isInternal = link.url.startsWith("/")
          return (
            <a
              key={link.label}
              href={link.url}
              target={isInternal ? undefined : "_blank"}
              rel={isInternal ? undefined : "noopener noreferrer"}
              onClick={() => triggerHaptic("light")}
              className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{link.label}</span>
                  {link.badge && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {link.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{link.description}</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
            </a>
          )
        })}
      </div>
    </div>
  )
}
