// Normalized affiliate block — wraps CommercialCard for affiliate-type items.
// Also works as a standalone component when you have a hardcoded affiliate link
// to expose via the commercial feed (e.g. ticket partner, streaming partner).

import type { CommercialCard as CommercialCardType } from "@/types/monetization"
import { CommercialCard } from "@/components/commercial/commercial-card"

interface AffiliateBlockProps {
  item: CommercialCardType
  className?: string
}

export function AffiliateBlock({ item, className }: AffiliateBlockProps) {
  if (item.type !== "affiliate_block") return null
  return <CommercialCard item={item} className={className} />
}
