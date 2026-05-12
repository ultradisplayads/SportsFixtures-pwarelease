export type OwnedBrandHub = {
  slug: "sportsbarz" | "gfp"
  name: string
  domain: string
  positioning: string
  audience: string
  primaryCta: string
  primaryHref: string
  secondaryCta: string
  secondaryHref: string
  iconKey: "food" | "trophy" | "map" | "tv"
  proof: string[]
  launchGaps: string[]
}

export const OWNED_BRAND_HUBS: Record<OwnedBrandHub["slug"], OwnedBrandHub> = {
  sportsbarz: {
    slug: "sportsbarz",
    name: "SportsBarz",
    domain: "sportsbarz.co",
    positioning: "Sports venue discovery and match-night conversion for bars, pubs and fans.",
    audience: "Fans looking for where to watch live sport, plus venues that want measurable match-night footfall.",
    primaryCta: "Find sports venues",
    primaryHref: "/venues",
    secondaryCta: "List a venue",
    secondaryHref: "/venues/owner-signup?source=sportsbarz",
    iconKey: "trophy",
    proof: [
      "Navigation link already exists in the PWA header.",
      "Venue pricing already includes SportsBarz as a premium listing channel.",
      "Local SportsBarz hub now routes users to venues, owner signup and display advertising pricing.",
    ],
    launchGaps: [
      "Dedicated domain deployment target.",
      "Marc-approved brand copy and screenshots.",
      "Production analytics/source attribution for venue leads.",
    ],
  },
  gfp: {
    slug: "gfp",
    name: "GFP",
    domain: "greatfoodplaces.com",
    positioning: "Food-led venue discovery with sports-night offers and partner listings.",
    audience: "People choosing food-led venues, plus restaurants and bars that want event-led bookings.",
    primaryCta: "Browse venues",
    primaryHref: "/venues",
    secondaryCta: "Advertise a venue",
    secondaryHref: "/venues/advertise?source=gfp",
    iconKey: "food",
    proof: [
      "Navigation link already exists in the PWA header.",
      "Venue pricing already includes GFP as a premium listing channel.",
      "Local GFP hub now routes users to food-led venue discovery and campaign onboarding.",
    ],
    launchGaps: [
      "Dedicated domain deployment target.",
      "Food/venue taxonomy proof against live venue data.",
      "Production affiliate and ad attribution proof.",
    ],
  },
}

export const ownedBrandHubHighlights = [
  { label: "Venue discovery", value: "PWA venues", iconKey: "map" as const },
  { label: "Display ads", value: "UDA / Displaz", iconKey: "tv" as const },
  { label: "Match-night demand", value: "SportsFixtures", iconKey: "trophy" as const },
]
