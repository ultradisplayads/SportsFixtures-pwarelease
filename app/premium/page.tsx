"use client"

// Premium page — one-screen conversion first, full plans below.
// Data-driven: plans and entitlement profile come from /api/entitlements.
// No hardcoded pricing. No fake urgency. No fake discounts.

import { useState } from "react"
import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"
import { PremiumHero } from "@/components/premium/premium-hero"
import { PlanCard } from "@/components/premium/plan-card"
import { FeatureComparison } from "@/components/premium/feature-comparison"
import { useEntitlements } from "@/hooks/use-entitlements"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { useToast } from "@/hooks/use-toast"
import type { PremiumPlan } from "@/types/monetization"
import { Spinner } from "@/components/ui/spinner"

export default function PremiumPage() {
  const { plans, isLoading, error } = useEntitlements()
  const [showFullPlans, setShowFullPlans] = useState(false)
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  // Featured plan for the hero — prefer the one with featured:true, fall back to gold
  const featuredPlan =
    plans.find((p) => p.featured && p.visible) ??
    plans.find((p) => p.tier === "gold" && p.visible) ??
    plans[0]

  // Plans shown in the full list — all visible ones
  const visiblePlans = plans.filter((p) => p.visible)

  const handleCta = (plan: PremiumPlan) => {
    triggerHaptic("success")
    setSubmitted((s) => ({ ...s, [plan.id]: true }))
    toast({
      title: plan.tier === "founder_vip" ? "VIP request received" : "Early access requested",
      description:
        plan.tier === "founder_vip"
          ? "We'll be in touch to complete your VIP Lifetime access."
          : `We'll notify you when ${plan.title} billing goes live.`,
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <HeaderMenu />

      <main className="flex-1 overflow-y-auto">
        {/* Loading */}
        {isLoading && (
          <div className="flex min-h-[calc(100dvh-112px)] items-center justify-center">
            <Spinner className="h-6 w-6 text-primary" />
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="flex min-h-[calc(100dvh-112px)] items-center justify-center px-6 text-center">
            <p className="text-sm text-muted-foreground">
              Could not load plans right now. Please try again.
            </p>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && featuredPlan && (
          <>
            {/* Above-the-fold: one-screen hero */}
            <PremiumHero
              featuredPlan={featuredPlan}
              onShowFullPlans={() => {
                setShowFullPlans(true)
                // Scroll to full plans section
                document
                  .getElementById("full-plans")
                  ?.scrollIntoView({ behavior: "smooth" })
              }}
            />

            {/* Below-the-fold: full plan cards + comparison */}
            <section
              id="full-plans"
              className="space-y-4 border-t border-border px-4 py-6"
              aria-label="All plans"
            >
              <h2 className="text-base font-bold">All plans</h2>
              <div className="space-y-4">
                {visiblePlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onCta={handleCta}
                    ctaSubmitted={!!submitted[plan.id]}
                  />
                ))}
              </div>
            </section>

            {/* Feature comparison matrix */}
            <FeatureComparison plans={visiblePlans} />

            {/* Footer reassurance */}
            <div className="space-y-1.5 px-4 pb-6 text-center text-xs text-muted-foreground">
              <p>Bronze is free forever. No credit card ever required.</p>
              <p>
                Paid tiers launch with Founder pricing locked in for early subscribers.
                Cancel anytime.
              </p>
              <p className="font-medium text-foreground">
                Cheaper than FotMob (£2.99/mo) and Sofascore (£2.49/mo).
              </p>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
