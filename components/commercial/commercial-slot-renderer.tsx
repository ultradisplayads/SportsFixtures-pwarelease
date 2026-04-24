"use client"

// components/commercial/commercial-slot-renderer.tsx
// Section 05 — Central dispatcher for all commercial content types.
//
// Given a CommercialCard, picks the right component to render based on `type`.
// This keeps all commercial type-dispatch logic in one place — no scattered
// if/switch statements in page or list components.
//
// Component selection rules:
//   sponsored_slot  → SponsoredSlot  (dismissible, session-scoped)
//   venue_promo     → VenuePromoCard (venue-specific offer)
//   geo_ad          → GeoTargetedCard
//   affiliate_block → AffiliateBlock
//   premium_cta     → CommercialCard (styled CTA toward premium)
//   editorial_promo → CommercialCard (default rich card)
//
// The `positionKey` prop is passed as `dismissKey` to enable slot-scoped
// session dismiss storage where applicable.

import type { CommercialCard as CommercialCardType } from "@/types/monetization"
import { CommercialCard }    from "@/components/commercial/commercial-card"
import { SponsoredSlot }     from "@/components/commercial/sponsored-slot"
import { VenuePromoCard }    from "@/components/commercial/venue-promo-card"
import { GeoTargetedCard }   from "@/components/commercial/geo-targeted-card"
import { AffiliateBlock }    from "@/components/commercial/affiliate-block"

interface CommercialSlotRendererProps {
  item: CommercialCardType
  className?: string
}

export function CommercialSlotRenderer({ item, className }: CommercialSlotRendererProps) {
  // Guard: never render a slot with no meaningful content
  if (!item.title) return null

  switch (item.type) {
    case "sponsored_slot":
      return (
        <SponsoredSlot
          item={item}
          dismissKey={item.positionKey ? `sf_slot_${item.positionKey}_${item.id}` : undefined}
        />
      )

    case "venue_promo":
      return <VenuePromoCard item={item} className={className} />

    case "geo_ad":
      return <GeoTargetedCard item={item} className={className} />

    case "affiliate_block":
      return <AffiliateBlock item={item} className={className} />

    case "premium_cta":
    case "editorial_promo":
    default:
      return <CommercialCard item={item} className={className} />
  }
}
