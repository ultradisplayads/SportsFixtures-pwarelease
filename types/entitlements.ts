// types/entitlements.ts
// Section 05 — Canonical entitlement and gate types.
// All premium, gate, and plan surfaces must import from here.
// Types that overlap with types/monetization.ts are re-exported for convenience;
// new code should prefer these imports.

import type {
  EntitlementKey,
  MembershipTier,
  UserEntitlementProfile,
  ModuleGate,
  PremiumPlan,
  EntitlementsResponse,
} from "@/types/monetization"

export type {
  EntitlementKey,
  MembershipTier,
  UserEntitlementProfile,
  ModuleGate,
  PremiumPlan,
  EntitlementsResponse,
}

// ── Entitlement evaluation result ───────────────────────────────────────────

export type EntitlementCheckResult = {
  /** True when the user holds the required entitlement. */
  allowed: boolean
  /** The tier that first grants this entitlement. Undefined when freely available. */
  requiredTier?: MembershipTier
  /** The user's current tier. */
  currentTier: MembershipTier
}

// ── Gate resolution input ────────────────────────────────────────────────────

export type GateResolutionInput = {
  moduleKey: string
  requiredEntitlement?: EntitlementKey
  profile: UserEntitlementProfile | null
}

// ── Plan stack display order ─────────────────────────────────────────────────

/**
 * Canonical display order for tier rendering.
 * Lower index = shown first (free → premium progression).
 */
export const TIER_DISPLAY_ORDER: MembershipTier[] = [
  "bronze",
  "silver",
  "gold",
  "gold_launch_pass",
  "founder_vip",
]
