// Geo-targeted commercial card — renders only when the item is geo_ad or venue_promo
// AND the item has real data. Must disclose its nature via DisclosurePill.
// This replaces/normalizes the old geo-ad-card.tsx ad-hoc implementation.

import type { CommercialCard as CommercialCardType } from "@/types/monetization"
import { CommercialCard } from "@/components/commercial/commercial-card"

interface GeoTargetedCardProps {
  item: CommercialCardType
  className?: string
}

export function GeoTargetedCard({ item, className }: GeoTargetedCardProps) {
  if (item.type !== "geo_ad" && item.type !== "venue_promo") return null
  if (!item.title) return null
  return <CommercialCard item={{ ...item, disclosure: item.disclosure ?? "sponsored" }} className={className} />
}
