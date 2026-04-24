"use client"

// One-screen conversion hero — targets mobile viewport.
// Contains: headline, subheadline, featured plan card (compact),
// 3-5 strongest benefit bullets, primary CTA, and reassurance line.
// Nothing below this fold is required to convert.

import { useState } from "react"
import { Check, ChevronDown, Gift } from "lucide-react"
import type { PremiumPlan } from "@/types/monetization"
import { cn } from "@/lib/utils"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { useToast } from "@/hooks/use-toast"

// Top 4 benefit bullets — kept to 4 max so hero fits one mobile viewport
const HERO_BULLETS = [
  "Ad-free across the whole app",
  "All alert windows — 5 min to 24 hours",
  "Premium venue tools and watch filters",
  "Every new feature, first",
]

interface PremiumHeroProps {
  featuredPlan: PremiumPlan
  onShowFullPlans: () => void
}

export function PremiumHero({ featuredPlan, onShowFullPlans }: PremiumHeroProps) {
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()

  const handleCta = () => {
    triggerHaptic("success")
    setSubmitted(true)
    toast({
      title: "Early access requested",
      description: "We'll notify you as soon as billing goes live.",
    })
  }

  const isLaunchFree = featuredPlan.priceLabel === "FREE"

  return (
    <section
      className="flex min-h-[calc(100dvh-112px)] flex-col justify-between px-4 py-4"
      aria-label="Premium upgrade"
    >
      {/* Top group — headline + plan card */}
      <div className="space-y-3">
        {/* Inline launch badge (small, doesn't eat vertical space) */}
        {isLaunchFree && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-2.5 py-1">
            <Gift className="h-3 w-3 text-primary" aria-hidden="true" />
            <span className="text-[10px] font-semibold text-primary">Free launch access — no card needed</span>
          </div>
        )}

        {/* Headline — tighter for mobile */}
        <div>
          <h1 className="text-balance text-2xl font-bold leading-snug">
            The full experience,{" "}
            {isLaunchFree ? (
              <span className="text-primary">free right now.</span>
            ) : (
              <span className="text-primary">yours to keep.</span>
            )}
          </h1>
          <p className="mt-1.5 text-balance text-sm leading-relaxed text-muted-foreground">
            {isLaunchFree
              ? "Gold included for all launch users. No commitment, no catch."
              : "Upgrade once. Get everything. No moving parts."}
          </p>
        </div>

        {/* Featured plan — compact price pill */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-2.5">
          <div>
            <p className="text-sm font-bold">{featuredPlan.title}</p>
            {featuredPlan.subtitle && (
              <p className="text-[11px] text-muted-foreground leading-snug">{featuredPlan.subtitle}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            {featuredPlan.strikePriceLabel && (
              <p className="text-[10px] text-muted-foreground line-through">{featuredPlan.strikePriceLabel}</p>
            )}
            <p className="text-xl font-bold text-primary">{featuredPlan.priceLabel}</p>
            {featuredPlan.billingLabel && (
              <p className="text-[10px] text-muted-foreground">{featuredPlan.billingLabel}</p>
            )}
          </div>
        </div>

        {/* Benefit bullets — compact */}
        <ul className="space-y-1.5">
          {HERO_BULLETS.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm">
              <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom group — CTA + secondary + reassurance */}
      <div className="mt-4 space-y-2.5">
        {/* Primary CTA */}
        {isLaunchFree ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-center text-sm font-semibold text-primary">
            Already included — enjoy Gold free
          </div>
        ) : (
          <button
            type="button"
            disabled={submitted}
            onClick={handleCta}
            className={cn(
              "flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-semibold transition-all active:scale-95",
              submitted
                ? "border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {submitted ? "Request submitted" : (featuredPlan.ctaLabel ?? "Get Gold")}
          </button>
        )}

        {/* Secondary action */}
        <button
          type="button"
          onClick={onShowFullPlans}
          className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Compare all plans
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        {/* Reassurance */}
        <p className="text-center text-[11px] text-muted-foreground">
          Bronze is free forever. No credit card required.
        </p>
      </div>
    </section>
  )
}
