"use client"

// components/premium/premium-plan-stack.tsx
// Section 05 — Ordered stack of all visible PlanCards.
// Handles CTA state (loading / submitted) per plan and fires a shared
// onCta callback so the parent can manage checkout or early-access flow.
//
// Rules:
//   - Renders only visible plans, sorted by TIER_DISPLAY_ORDER.
//   - Featured plan is visually elevated — no custom sorting needed in the parent.
//   - Never renders a plan with no title.

import { useState } from "react"
import { PlanCard } from "@/components/premium/plan-card"
import { TIER_DISPLAY_ORDER } from "@/types/entitlements"
import type { PremiumPlan, MembershipTier } from "@/types/entitlements"
import { useToast } from "@/hooks/use-toast"
import { triggerHaptic } from "@/lib/haptic-feedback"

interface PremiumPlanStackProps {
  plans: PremiumPlan[]
  /**
   * Called when the user taps a plan CTA.
   * Return a resolved promise when the action completes (success or failure).
   * The stack handles per-plan loading state automatically.
   */
  onCta?: (plan: PremiumPlan) => Promise<void>
  className?: string
}

function sortPlans(plans: PremiumPlan[]): PremiumPlan[] {
  return [...plans]
    .filter((p) => p.visible && p.title)
    .sort((a, b) => {
      const ai = TIER_DISPLAY_ORDER.indexOf(a.tier as MembershipTier)
      const bi = TIER_DISPLAY_ORDER.indexOf(b.tier as MembershipTier)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
}

export function PremiumPlanStack({ plans, onCta, className = "" }: PremiumPlanStackProps) {
  const { toast } = useToast()
  // Track per-plan state: null = idle, "loading" = in flight, "submitted" = done
  const [planState, setPlanState] = useState<Record<string, "loading" | "submitted" | null>>({})

  const sorted = sortPlans(plans)

  async function handleCta(plan: PremiumPlan) {
    if (planState[plan.id]) return // already in flight or submitted
    triggerHaptic("medium")
    setPlanState((s) => ({ ...s, [plan.id]: "loading" }))

    try {
      if (onCta) {
        await onCta(plan)
      } else {
        // Default: early-access toast (pre-billing)
        await new Promise((r) => setTimeout(r, 600))
        toast({
          title: "Early access requested",
          description: `We will notify you when ${plan.title} is available.`,
        })
      }
      setPlanState((s) => ({ ...s, [plan.id]: "submitted" }))
    } catch {
      setPlanState((s) => ({ ...s, [plan.id]: null }))
      toast({ title: "Something went wrong", description: "Please try again." })
    }
  }

  if (sorted.length === 0) return null

  return (
    <section
      aria-label="Premium plans"
      className={`space-y-3 px-4 pb-6 ${className}`}
    >
      <h2 className="text-center text-base font-bold">Choose your plan</h2>
      {sorted.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          onCta={handleCta}
          ctaLoading={planState[plan.id] === "loading"}
          ctaSubmitted={planState[plan.id] === "submitted"}
        />
      ))}
    </section>
  )
}
