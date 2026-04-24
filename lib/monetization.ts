// Monetization rules engine.
// All gating decisions, entitlement checks, plan ordering, and profile normalization
// must go through this file — never scatter business rules across UI components.

import type {
  MembershipTier,
  UserEntitlementProfile,
  ModuleGate,
  PremiumPlan,
  EntitlementKey,
  EntitlementsResponse,
} from "@/types/monetization"
import {
  subscriptionManager,
  isLaunchPassActive,
  LAUNCH_PASS_EXPIRY,
} from "@/lib/subscription-manager"

// ── Tier rank — used for ordering and comparison ────────────────────────────
const TIER_RANK: Record<MembershipTier, number> = {
  free:            0,
  bronze:          1,
  silver:          2,
  gold:            3,
  gold_launch_pass: 4,
  founder_vip:     5,
}

// ── Tier → entitlements map ─────────────────────────────────────────────────
// This is the single source of truth. The subscription-manager carries feature
// flags for runtime checks; this map carries the canonical entitlement keys
// consumed by ModuleGate and the /api/entitlements route.
const TIER_ENTITLEMENTS: Record<MembershipTier, EntitlementKey[]> = {
  free:            [],
  bronze:          [],
  silver:          [
    "ad_light_experience",
    "advanced_alerts",
    "extra_personalization",
    "premium_calendar",
  ],
  gold:            [
    "ad_light_experience",
    "advanced_alerts",
    "extra_personalization",
    "premium_calendar",
    "premium_badge",
    "premium_insights",
    "priority_support",
    "extended_history",
    "exclusive_offers",
  ],
  gold_launch_pass: [
    "ad_light_experience",
    "advanced_alerts",
    "extra_personalization",
    "premium_calendar",
    "premium_badge",
    "premium_insights",
    "priority_support",
    "extended_history",
    "exclusive_offers",
  ],
  founder_vip:     [
    "ad_light_experience",
    "advanced_alerts",
    "extra_personalization",
    "premium_calendar",
    "premium_badge",
    "premium_insights",
    "priority_support",
    "venue_boost_visibility",
    "extended_history",
    "exclusive_offers",
  ],
}

// ── Canonical plan definitions ───────────────────────────────────────────────
// Plans are built from subscription-manager data so pricing stays in one place.
// The premium page must consume these — never hardcode plan data in a component.
export function buildPlans(): PremiumPlan[] {
  const launchActive = isLaunchPassActive()
  const expiryLabel = LAUNCH_PASS_EXPIRY.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  })

  return [
    {
      id:           "bronze",
      tier:         "bronze",
      title:        "Bronze",
      subtitle:     "Core fixtures and venue discovery — free forever",
      priceLabel:   "Free",
      billingLabel: "forever",
      features:     subscriptionManager.getFeatureList("bronze"),
      visible:      true,
    },
    {
      id:           "silver",
      tier:         "silver",
      title:        "Silver",
      subtitle:     "More alerts, deeper personalisation, lighter ads",
      priceLabel:   `£${subscriptionManager.getPricing("silver", "monthly")}`,
      billingLabel: "/month",
      strikePriceLabel: undefined,
      features:     subscriptionManager.getFeatureList("silver"),
      visible:      true,
    },
    {
      id:           "gold",
      tier:         "gold",
      title:        "Gold",
      subtitle:     launchActive
        ? `Free with Launch Pass until ${expiryLabel}`
        : "Ad-free, all alerts, premium venue tools",
      priceLabel:   launchActive ? "FREE" : `£${subscriptionManager.getPricing("gold", "monthly")}`,
      billingLabel: launchActive ? "until " + expiryLabel : "/month",
      strikePriceLabel: launchActive
        ? `£${subscriptionManager.getPricing("gold", "monthly")}/month`
        : undefined,
      features:     subscriptionManager.getFeatureList("gold"),
      featured:     true,
      ctaLabel:     launchActive ? "Already included" : "Get Gold",
      visible:      true,
    },
    {
      id:                "founder_vip",
      tier:              "founder_vip",
      title:             "VIP Lifetime",
      subtitle:          "Pay once. Own it forever. Exclusive venue perks and secret invites.",
      priceLabel:        "£99.99",
      billingLabel:      "one-time",
      strikePriceLabel:  "£199.99",
      features:          subscriptionManager.getFeatureList("founder_vip"),
      ctaLabel:          "Claim VIP Lifetime — £99.99",
      ctaHref:           "/premium/vip",
      visible:           true,
    },
  ]
}

// ── Profile builder ──────────────────────────────────────────────────────────
// Derives a normalized UserEntitlementProfile from the subscription-manager.
// This is what the /api/entitlements route returns, and what all gating derives from.
export function buildEntitlementProfile(): UserEntitlementProfile {
  const sub = subscriptionManager.getSubscription()
  const launchActive = isLaunchPassActive()

  let tier: MembershipTier

  if (sub.tier === "founder_vip") {
    tier = "founder_vip"
  } else if (sub.tier === "bronze" && launchActive) {
    tier = "gold_launch_pass"
  } else {
    // Map subscription-manager tier to monetization MembershipTier
    const map: Record<string, MembershipTier> = {
      bronze:      "bronze",
      silver:      "silver",
      gold:        "gold",
      founder_vip: "founder_vip",
    }
    tier = map[sub.tier] ?? "free"
  }

  return {
    membershipTier: tier,
    active:         sub.active,
    expiresAt:      sub.expiresAt ? sub.expiresAt.toISOString() : null,
    entitlements:   TIER_ENTITLEMENTS[tier] ?? [],
    source:         tier === "gold_launch_pass" ? "launch_pass" : "subscription",
  }
}

// ── Entitlement check ────────────────────────────────────────────────────────
export function hasEntitlement(
  profile: UserEntitlementProfile | null,
  entitlement: EntitlementKey,
): boolean {
  if (!profile) return false
  return profile.entitlements.includes(entitlement)
}

// ── Module gate resolver ─────────────────────────────────────────────────────
export function resolveModuleGate(input: {
  moduleKey: string
  requiredEntitlement?: EntitlementKey
  profile: UserEntitlementProfile | null
  upgradeHref?: string
}): ModuleGate {
  if (!input.requiredEntitlement) {
    return { moduleKey: input.moduleKey, visible: true, locked: false }
  }

  const allowed = hasEntitlement(input.profile, input.requiredEntitlement)

  return {
    moduleKey:  input.moduleKey,
    visible:    true,
    locked:     !allowed,
    lockReason: allowed ? undefined : "Upgrade required",
    upgradeCta: allowed
      ? undefined
      : { label: "See Premium", href: input.upgradeHref ?? "/premium" },
  }
}

// ── Default module gates ─────────────────────────────────────────────────────
// The entitlements API returns these so the UI has a complete gate map.
export function buildDefaultGates(
  profile: UserEntitlementProfile,
): ModuleGate[] {
  const gate = (moduleKey: string, requiredEntitlement: EntitlementKey) =>
    resolveModuleGate({ moduleKey, requiredEntitlement, profile })

  return [
    gate("insights_panel",       "premium_insights"),
    gate("advanced_alerts",      "advanced_alerts"),
    gate("premium_calendar",     "premium_calendar"),
    gate("extended_history",     "extended_history"),
    gate("exclusive_offers",     "exclusive_offers"),
    gate("venue_boost",          "venue_boost_visibility"),
    gate("ad_light",             "ad_light_experience"),
    gate("priority_support",     "priority_support"),
    gate("extra_personalization","extra_personalization"),
  ]
}

// ── Plan ordering ────────────────────────────────────────────────────────────
export function normalizePlanOrder(plans: PremiumPlan[]): PremiumPlan[] {
  return [...plans].sort(
    (a, b) => (TIER_RANK[a.tier] ?? 0) - (TIER_RANK[b.tier] ?? 0),
  )
}

// ── Tier comparison helpers ──────────────────────────────────────────────────
export function tierAtLeast(
  profile: UserEntitlementProfile | null,
  minimum: MembershipTier,
): boolean {
  if (!profile) return false
  return (TIER_RANK[profile.membershipTier] ?? 0) >= (TIER_RANK[minimum] ?? 0)
}
