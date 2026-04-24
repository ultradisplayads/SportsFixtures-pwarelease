// lib/entitlements.ts
// Section 05 — Entitlement rules engine.
// All gate/entitlement logic must live here. Never scatter checks across components.
//
// Mirrors lib/monetization.ts resolveModuleGate but provides the canonical
// entitlements-module API. Import resolveGate from here in new code.

import type {
  EntitlementKey,
  MembershipTier,
  UserEntitlementProfile,
  ModuleGate,
} from "@/types/entitlements"
import type { GateResolutionInput, EntitlementCheckResult } from "@/types/entitlements"
import { TIER_DISPLAY_ORDER } from "@/types/entitlements"

// ── Tier hierarchy ───────────────────────────────────────────────────────────

/**
 * Returns true if `current` meets or exceeds `required` in the tier hierarchy.
 */
export function tierMeetsRequirement(
  current: MembershipTier,
  required: MembershipTier,
): boolean {
  const currentIdx = TIER_DISPLAY_ORDER.indexOf(current)
  const requiredIdx = TIER_DISPLAY_ORDER.indexOf(required)
  if (currentIdx === -1 || requiredIdx === -1) return false
  return currentIdx >= requiredIdx
}

// ── Entitlement helpers ──────────────────────────────────────────────────────

export function hasEntitlement(
  profile: UserEntitlementProfile | null,
  key: EntitlementKey,
): boolean {
  if (!profile || !profile.active) return false
  return profile.entitlements.includes(key)
}

export function checkEntitlement(
  profile: UserEntitlementProfile | null,
  requiredKey?: EntitlementKey,
): EntitlementCheckResult {
  const currentTier: MembershipTier = profile?.membershipTier ?? "bronze"

  if (!requiredKey) {
    return { allowed: true, currentTier }
  }

  const allowed = hasEntitlement(profile, requiredKey)

  // Determine which tier first grants this entitlement for upgrade messaging
  const requiredTier = TIER_ENTITLEMENT_MAP[requiredKey]

  return { allowed, requiredTier, currentTier }
}

// ── Gate resolution ──────────────────────────────────────────────────────────

export function resolveGate({
  moduleKey,
  requiredEntitlement,
  profile,
}: GateResolutionInput): ModuleGate {
  const { allowed, requiredTier } = checkEntitlement(profile, requiredEntitlement)
  const tier = requiredTier ?? "silver"

  return {
    moduleKey,
    visible: true,
    locked: !allowed,
    lockReason: !allowed
      ? `Requires ${TIER_LABEL[tier] ?? tier} or above`
      : undefined,
    upgradeCta: !allowed
      ? { label: `Upgrade to ${TIER_LABEL[tier] ?? tier}`, href: "/premium" }
      : undefined,
  }
}

// ── Convenience: build a gate list from a map of module → entitlement ────────

export function buildGateList(
  profile: UserEntitlementProfile | null,
  modules: Record<string, EntitlementKey | undefined>,
): ModuleGate[] {
  return Object.entries(modules).map(([moduleKey, requiredEntitlement]) =>
    resolveGate({ moduleKey, requiredEntitlement, profile }),
  )
}

// ── Tier → first entitlement map ─────────────────────────────────────────────
// Used for upgrade messaging — "You need Silver or above for X".

export const TIER_ENTITLEMENT_MAP: Partial<Record<EntitlementKey, MembershipTier>> = {
  advanced_alerts:         "silver",
  premium_calendar:        "silver",
  ad_light_experience:     "silver",
  extra_personalization:   "silver",
  premium_badge:           "gold",
  premium_insights:        "gold",
  priority_support:        "gold",
  venue_boost_visibility:  "gold",
  extended_history:        "gold",
  exclusive_offers:        "founder_vip",
}

export const TIER_LABEL: Record<MembershipTier, string> = {
  free:             "Free",
  bronze:           "Bronze",
  silver:           "Silver",
  gold:             "Gold",
  gold_launch_pass: "Gold (Launch)",
  founder_vip:      "Founder VIP",
}
