"use client"

import type React from "react"
import { useState } from "react"
import {
  Check,
  Shield,
  Zap,
  Crown,
  Gift,
  ChevronRight,
  Star,
  Ticket,
  UtensilsCrossed,
  Building2,
} from "lucide-react"
import {
  subscriptionManager,
  isLaunchPassActive,
  LAUNCH_PASS_EXPIRY,
  type SubscriptionTier,
} from "@/lib/subscription-manager"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { useToast } from "@/hooks/use-toast"

const TIER_META: Record<
  SubscriptionTier,
  {
    label: string
    icon: React.ReactNode
    color: string
    borderClass: string
    tagline: string
    popular?: boolean
  }
> = {
  bronze: {
    label: "Bronze",
    icon: <Shield className="h-5 w-5" />,
    color: "text-amber-700 dark:text-amber-500",
    borderClass: "border-border",
    tagline: "Core fixtures and venue discovery — free forever",
  },
  silver: {
    label: "Silver",
    icon: <Zap className="h-5 w-5" />,
    color: "text-slate-400 dark:text-slate-300",
    borderClass: "border-primary",
    tagline: "More alerts, deeper personalisation, lighter ads",
    popular: true,
  },
  gold: {
    label: "Gold",
    icon: <Crown className="h-5 w-5" />,
    color: "text-yellow-500",
    borderClass: "border-yellow-500/50",
    tagline: "Ad-free, all alerts, premium venue tools and early offers",
  },
  founder_vip: {
    label: "VIP Lifetime",
    icon: <Star className="h-5 w-5" />,
    color: "text-purple-400",
    borderClass: "border-purple-500/60",
    tagline: "Pay once. Own it forever. Exclusive venue perks, food discounts and secret invites.",
  },
}

// VIP extras displayed as highlighted callout cards inside the VIP tier card
const VIP_EXTRAS = [
  {
    icon: <Building2 className="h-4 w-4 text-purple-400" />,
    label: "Venue discounts",
    detail: "Up to 20% off at partner venues",
  },
  {
    icon: <UtensilsCrossed className="h-4 w-4 text-purple-400" />,
    label: "Food & drinks discounts",
    detail: "Exclusive deals at watch-party venues",
  },
  {
    icon: <Ticket className="h-4 w-4 text-purple-400" />,
    label: "Secret invites",
    detail: "Private match events, watch parties and launch nights",
  },
]

export function PremiumPlans() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [requested, setRequested] = useState<SubscriptionTier | null>(null)
  const { toast } = useToast()
  const launchPassActive = isLaunchPassActive()
  const expiryFormatted = LAUNCH_PASS_EXPIRY.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const handleRequest = (tier: SubscriptionTier) => {
    triggerHaptic("success")
    setRequested(tier)
    toast({
      title: tier === "founder_vip" ? "VIP request received" : "Early access requested",
      description:
        tier === "founder_vip"
          ? "We'll be in touch to complete your VIP Lifetime access."
          : `We'll notify you when ${TIER_META[tier].label} billing goes live.`,
    })
  }

  const tiers: SubscriptionTier[] = ["bronze", "silver", "gold", "founder_vip"]

  return (
    <div className="space-y-5 p-4">

      {/* "No CC" Launch banner */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3">
        <Gift className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold text-primary">
            No credit card. No sign-up. Just enjoy it.
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Gold Launch Pass is included free until {expiryFormatted} for all users. After that,
            keep Bronze free forever or upgrade to stay premium.
          </p>
        </div>
      </div>

      {/* Billing toggle */}
      <div className="mx-auto flex w-fit items-center rounded-lg border border-border bg-card p-1">
        {(["monthly", "yearly"] as const).map((cycle) => (
          <button
            key={cycle}
            onClick={() => {
              triggerHaptic("selection")
              setBillingCycle(cycle)
            }}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              billingCycle === cycle
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            {cycle === "monthly" ? (
              "Monthly"
            ) : (
              <>
                Yearly{" "}
                <span className="ml-1 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] text-white">
                  -37%
                </span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Tier cards */}
      <div className="grid gap-4">
        {tiers.map((tier) => {
          const meta = TIER_META[tier]
          const features = subscriptionManager.getFeatureList(tier)
          const isFree = tier === "bronze"
          const isVip = tier === "founder_vip"
          const isRequested = requested === tier

          return (
            <div
              key={tier}
              className={`relative rounded-xl border-2 p-5 transition-all ${meta.borderClass} ${
                isVip
                  ? "bg-gradient-to-br from-purple-500/10 to-background shadow-lg shadow-purple-500/10"
                  : meta.popular
                  ? "bg-primary/5 shadow-md"
                  : "bg-card"
              }`}
            >
              {/* Badge labels */}
              {meta.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Most popular
                </div>
              )}
              {isVip && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-purple-600 px-3 py-0.5 text-xs font-semibold text-white">
                  Lifetime · Was £199.99
                </div>
              )}

              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={meta.color}>{meta.icon}</span>
                  <span className="text-lg font-bold">{meta.label}</span>
                  {tier === "gold" && launchPassActive && (
                    <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-semibold text-yellow-600 dark:text-yellow-400">
                      Your plan
                    </span>
                  )}
                  {tier === "bronze" && !launchPassActive && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      Current
                    </span>
                  )}
                </div>

                {/* Price */}
                {isFree ? (
                  <div className="shrink-0 text-right">
                    <div className="text-2xl font-bold">Free</div>
                    <div className="text-xs text-muted-foreground">forever</div>
                  </div>
                ) : isVip ? (
                  <div className="shrink-0 text-right">
                    <div className="flex items-baseline justify-end gap-0.5">
                      <span className="text-sm font-medium text-muted-foreground line-through opacity-60">
                        £199.99
                      </span>
                    </div>
                    <div className="flex items-baseline justify-end gap-0.5">
                      <span className="text-sm font-medium text-purple-400">£</span>
                      <span className="text-2xl font-bold text-purple-400">99.99</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">one-time · lifetime</div>
                  </div>
                ) : (
                  <div className="shrink-0 text-right">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-sm font-medium text-muted-foreground">£</span>
                      <span className="text-2xl font-bold">
                        {subscriptionManager.getPricing(tier, billingCycle)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        /{billingCycle === "monthly" ? "mo" : "yr"}
                      </span>
                    </div>
                    {launchPassActive && tier === "gold" ? (
                      <div className="text-xs font-semibold text-green-600 dark:text-green-400">
                        FREE now
                      </div>
                    ) : (
                      <div className="text-[10px] text-muted-foreground">Founder pricing</div>
                    )}
                  </div>
                )}
              </div>

              <p className="mt-1 text-xs text-muted-foreground">{meta.tagline}</p>

              {/* VIP extras callout strip */}
              {isVip && (
                <div className="mt-4 grid gap-2">
                  {VIP_EXTRAS.map((extra) => (
                    <div
                      key={extra.label}
                      className="flex items-center gap-3 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2.5"
                    >
                      {extra.icon}
                      <div>
                        <p className="text-xs font-semibold text-foreground">{extra.label}</p>
                        <p className="text-[11px] text-muted-foreground">{extra.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Feature list */}
              <ul className="mt-4 space-y-2">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        isVip ? "text-purple-400" : "text-primary"
                      }`}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {!isFree && (
                <button
                  onClick={() => handleRequest(tier)}
                  disabled={isRequested}
                  className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all active:scale-95 ${
                    isRequested
                      ? "cursor-default border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                      : isVip
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : meta.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border hover:bg-accent"
                  }`}
                >
                  {isRequested ? (
                    "Request submitted"
                  ) : isVip ? (
                    <>
                      Claim VIP Lifetime — £99.99
                      <ChevronRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Request early access
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <div className="space-y-2 text-center text-xs text-muted-foreground">
        <p>Bronze is free forever. No credit card ever required.</p>
        <p>
          Paid tiers launch with Founder pricing locked in for early subscribers. Cancel anytime.
        </p>
        <p className="font-medium text-foreground">
          Cheaper than FotMob (£2.99/mo) and Sofascore (£2.49/mo).
        </p>
      </div>
    </div>
  )
}
