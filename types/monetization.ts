// Canonical monetization types for the SportsFixtures PWA.
// All commercial surfaces, entitlement checks, and plan rendering must derive from these.

export type MembershipTier =
  | "free"
  | "bronze"
  | "silver"
  | "gold"
  | "gold_launch_pass"
  | "founder_vip"

export type CommercialItemType =
  | "premium_cta"
  | "affiliate_block"
  | "sponsored_slot"
  | "venue_promo"
  | "geo_ad"
  | "editorial_promo"

export type CommercialDisclosure =
  | "affiliate"
  | "sponsored"
  | "promo"
  | "editorial"

export type EntitlementKey =
  | "advanced_alerts"
  | "premium_calendar"
  | "ad_light_experience"
  | "extra_personalization"
  | "premium_badge"
  | "premium_insights"
  | "priority_support"
  | "venue_boost_visibility"
  | "extended_history"
  | "exclusive_offers"

export type UserEntitlementProfile = {
  membershipTier: MembershipTier
  active: boolean
  expiresAt?: string | null
  entitlements: EntitlementKey[]
  source?: "manual" | "subscription" | "promo" | "launch_pass"
}

export type PremiumPlan = {
  id: string
  tier: MembershipTier
  title: string
  subtitle?: string
  priceLabel: string
  billingLabel?: string
  features: string[]
  featured?: boolean
  strikePriceLabel?: string
  ctaLabel?: string
  ctaHref?: string
  visible: boolean
}

export type CommercialCard = {
  id: string
  type: CommercialItemType
  title: string
  body?: string
  imageUrl?: string
  href?: string
  disclosure?: CommercialDisclosure
  sponsorName?: string
  featured?: boolean
  geoTargeted?: boolean
  venueId?: string
  campaignId?: string
  positionKey?: string
  expiresAt?: string
}

export type ModuleGate = {
  moduleKey: string
  visible: boolean
  locked: boolean
  lockReason?: string
  upgradeCta?: {
    label: string
    href: string
  }
}

export type EntitlementsResponse = {
  profile: UserEntitlementProfile
  gates: ModuleGate[]
  plans: PremiumPlan[]
}

export type CommercialFeedResponse = {
  items: CommercialCard[]
  generatedAt: string
}
