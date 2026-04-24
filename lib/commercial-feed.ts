export type CommercialFeedItem = {
  id: string
  type:
    | "premium_cta"
    | "affiliate_block"
    | "sponsored_slot"
    | "venue_promo"
    | "geo_ad"
    | "editorial_promo"
  title: string
  body?: string | null
  imageUrl?: string | null
  href?: string | null
  disclosure?: "affiliate" | "sponsored" | "promo" | "editorial" | null
  sponsorName?: string | null
  featured?: boolean
  geoTargeted?: boolean
  venueId?: string | null
  campaignId?: string | null
  positionKey?: string | null
  expiresAt?: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeCommercialItem(raw: any): CommercialFeedItem {
  return {
    id: String(raw?.id || raw?.campaignId || ""),
    type: raw?.type || "editorial_promo",
    title: String(raw?.title || "Untitled item"),
    body: typeof raw?.body === "string" ? raw.body : null,
    imageUrl: typeof raw?.imageUrl === "string" ? raw.imageUrl : null,
    href: typeof raw?.href === "string" ? raw.href : null,
    disclosure: raw?.disclosure || null,
    sponsorName: typeof raw?.sponsorName === "string" ? raw.sponsorName : null,
    featured: Boolean(raw?.featured),
    geoTargeted: Boolean(raw?.geoTargeted),
    venueId: typeof raw?.venueId === "string" ? raw.venueId : null,
    campaignId: typeof raw?.campaignId === "string" ? raw.campaignId : null,
    positionKey: typeof raw?.positionKey === "string" ? raw.positionKey : null,
    expiresAt: typeof raw?.expiresAt === "string" ? raw.expiresAt : null,
  }
}
