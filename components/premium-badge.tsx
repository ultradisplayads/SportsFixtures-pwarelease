"use client"

// PremiumBadge — derives tier from the normalized entitlement profile.
// Consistent with /api/entitlements; does not drift from subscription-manager separately.

import { Crown } from "lucide-react"
import Link from "next/link"
import { useEntitlements } from "@/hooks/use-entitlements"
import type { MembershipTier } from "@/types/monetization"

const TIER_GRADIENT: Partial<Record<MembershipTier, string>> = {
  silver:          "from-slate-400 to-slate-300",
  gold:            "from-yellow-500 to-amber-400",
  gold_launch_pass:"from-yellow-500 to-amber-400",
  founder_vip:     "from-purple-600 to-indigo-500",
}

const TIER_LABEL: Partial<Record<MembershipTier, string>> = {
  silver:          "Silver",
  gold:            "Gold",
  gold_launch_pass:"Gold",
  founder_vip:     "Founder",
}

export function PremiumBadge() {
  const { tier, isLoading } = useEntitlements()

  if (isLoading) return null

  const gradient = TIER_GRADIENT[tier]
  const label    = TIER_LABEL[tier]

  if (gradient && label) {
    return (
      <div
        className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${gradient} px-2 py-1 text-xs font-medium text-white`}
      >
        <Crown className="h-3 w-3" aria-hidden="true" />
        <span>{label}</span>
      </div>
    )
  }

  // Free / bronze — upgrade prompt
  return (
    <Link
      href="/premium"
      className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
    >
      <Crown className="h-3 w-3" aria-hidden="true" />
      <span>Go Gold</span>
    </Link>
  )
}
