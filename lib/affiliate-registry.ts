/**
 * Affiliate & streaming partner registry.
 *
 * isAffiliate: true  → we have a referral deal; chip becomes a tracked link
 * isAffiliate: false → listed for user convenience only; no revenue share
 *
 * The `url` for affiliates should be the tracked referral URL.
 * Streaming services listed here are injected into every expanded TVCard
 * when the fixture's sport/channels match — so users always see relevant options.
 */

export interface AffiliateEntry {
  /** Display name */
  name: string
  /** Referral/affiliate URL (or service homepage for non-affiliates) */
  url: string
  /** True when we earn commission from clicks */
  isAffiliate: boolean
  /** Tailwind bg class for the badge */
  color: string
  /** Optional icon character / SVG label (used as aria-label fallback) */
  icon?: string
  /** Category — determines where in the card this entry appears */
  category: "tv" | "streaming" | "betting"
}

const REGISTRY: AffiliateEntry[] = [
  // ── TV Broadcasters (affiliate partners) ────────────────────────────────────
  {
    name: "TNT Sports",
    url: "https://www.tntsports.co.uk/?ref=sportsfixtures",
    isAffiliate: true,
    color: "bg-orange-600",
    category: "tv",
  },
  {
    name: "TNT Sports 1",
    url: "https://www.tntsports.co.uk/?ref=sportsfixtures",
    isAffiliate: true,
    color: "bg-orange-600",
    category: "tv",
  },
  {
    name: "TNT Sports 2",
    url: "https://www.tntsports.co.uk/?ref=sportsfixtures",
    isAffiliate: true,
    color: "bg-orange-600",
    category: "tv",
  },
  {
    name: "TNT Sports 3",
    url: "https://www.tntsports.co.uk/?ref=sportsfixtures",
    isAffiliate: true,
    color: "bg-orange-600",
    category: "tv",
  },
  {
    name: "TNT Sports 4",
    url: "https://www.tntsports.co.uk/?ref=sportsfixtures",
    isAffiliate: true,
    color: "bg-orange-600",
    category: "tv",
  },
  // ── TV Broadcasters (listed only, no deal yet) ───────────────────────────────
  {
    name: "Sky Sports",
    url: "https://www.skysports.com/",
    isAffiliate: false,
    color: "bg-sky-600",
    category: "tv",
  },
  {
    name: "BBC One",
    url: "https://www.bbc.co.uk/iplayer",
    isAffiliate: false,
    color: "bg-red-700",
    category: "tv",
  },
  {
    name: "BBC Two",
    url: "https://www.bbc.co.uk/iplayer",
    isAffiliate: false,
    color: "bg-red-700",
    category: "tv",
  },
  {
    name: "ITV",
    url: "https://www.itv.com/",
    isAffiliate: false,
    color: "bg-blue-700",
    category: "tv",
  },
  {
    name: "Channel 4",
    url: "https://www.channel4.com/",
    isAffiliate: false,
    color: "bg-purple-700",
    category: "tv",
  },
  {
    name: "beIN SPORTS",
    url: "https://www.beinsports.com/",
    isAffiliate: false,
    color: "bg-green-800",
    category: "tv",
  },
  {
    name: "ESPN",
    url: "https://www.espn.com/",
    isAffiliate: false,
    color: "bg-red-600",
    category: "tv",
  },
  {
    name: "MLB.tv",
    url: "https://www.mlb.com/live-stream-games",
    isAffiliate: false,
    color: "bg-blue-800",
    category: "tv",
  },
  {
    name: "True Sport 7",
    url: "https://www.truesport.tv/",
    isAffiliate: false,
    color: "bg-zinc-600",
    category: "tv",
  },
  {
    name: "True Sport 3",
    url: "https://www.truesport.tv/",
    isAffiliate: false,
    color: "bg-zinc-600",
    category: "tv",
  },
  {
    name: "MLS",
    url: "https://www.mlssoccer.com/",
    isAffiliate: false,
    color: "bg-blue-700",
    category: "tv",
  },
  // ── Streaming Services (affiliate) ──────────────────────────────────────────
  {
    name: "Amazon Prime Video",
    url: "https://www.amazon.co.uk/gp/video/offers?ref=sportsfixtures",
    isAffiliate: true,
    color: "bg-yellow-600",
    icon: "Prime",
    category: "streaming",
  },
  {
    name: "DAZN",
    url: "https://www.dazn.com/?ref=sportsfixtures",
    isAffiliate: true,
    color: "bg-green-700",
    category: "streaming",
  },
  // ── Streaming Services (listed only) ────────────────────────────────────────
  {
    name: "Netflix",
    url: "https://www.netflix.com/",
    isAffiliate: false,
    color: "bg-red-700",
    category: "streaming",
  },
  {
    name: "Disney+",
    url: "https://www.disneyplus.com/",
    isAffiliate: false,
    color: "bg-blue-900",
    category: "streaming",
  },
  {
    name: "Apple TV+",
    url: "https://tv.apple.com/",
    isAffiliate: false,
    color: "bg-zinc-800",
    category: "streaming",
  },
  {
    name: "Peacock",
    url: "https://www.peacocktv.com/",
    isAffiliate: false,
    color: "bg-violet-700",
    category: "streaming",
  },
  {
    name: "Paramount+",
    url: "https://www.paramountplus.com/",
    isAffiliate: false,
    color: "bg-blue-600",
    category: "streaming",
  },
]

/** Lookup by exact or partial channel name match */
export function getAffiliate(channelName: string): AffiliateEntry | null {
  const lower = channelName.toLowerCase()
  return (
    REGISTRY.find((e) => e.name.toLowerCase() === lower) ??
    REGISTRY.find((e) => lower.includes(e.name.toLowerCase()) || e.name.toLowerCase().includes(lower)) ??
    null
  )
}

/** Return affiliate-only streaming services to promote in every card */
export function getAffiliateStreamingPartners(): AffiliateEntry[] {
  return REGISTRY.filter((e) => e.category === "streaming" && e.isAffiliate)
}

/** Smart ad rows — rotate through these for free-tier users */
export interface SmartAdEntry {
  id: string
  headline: string
  sub: string
  ctaLabel: string
  url: string
  color: string
  badgeLabel: string
}

export const SMART_ADS: SmartAdEntry[] = [
  {
    id: "prime-sports",
    headline: "Watch live sport on Prime Video",
    sub: "TNT Sports included with select plans — Premier League, Champions League & more",
    ctaLabel: "Start free trial",
    url: "https://www.amazon.co.uk/gp/video/offers?ref=sportsfixtures-ad",
    color: "from-yellow-600/20 to-amber-500/10",
    badgeLabel: "Prime Video",
  },
  {
    id: "dazn-stream",
    headline: "Stream sport with DAZN",
    sub: "Boxing, MMA, football & motorsport — all in one place",
    ctaLabel: "Try DAZN free",
    url: "https://www.dazn.com/?ref=sportsfixtures-ad",
    color: "from-green-700/20 to-emerald-600/10",
    badgeLabel: "DAZN",
  },
  {
    id: "sky-stream",
    headline: "Never miss a match with Sky Stream",
    sub: "All Sky Sports channels, no dish required — from £22/mo",
    ctaLabel: "See Sky deals",
    url: "https://www.sky.com/shop/sky-stream?ref=sportsfixtures-ad",
    color: "from-sky-700/20 to-blue-600/10",
    badgeLabel: "Sky Sports",
  },
]
