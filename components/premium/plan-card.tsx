"use client"

import { Check, ChevronRight } from "lucide-react"
import type { PremiumPlan } from "@/types/monetization"
import { cn } from "@/lib/utils"

interface PlanCardProps {
  plan: PremiumPlan
  compact?: boolean
  onCta?: (plan: PremiumPlan) => void
  ctaLoading?: boolean
  ctaSubmitted?: boolean
}

export function PlanCard({
  plan,
  compact = false,
  onCta,
  ctaLoading = false,
  ctaSubmitted = false,
}: PlanCardProps) {
  const isVip  = plan.tier === "founder_vip"
  const isFree = plan.tier === "free" || plan.tier === "bronze"

  return (
    <article
      className={cn(
        "rounded-2xl border bg-card transition-shadow",
        compact ? "p-4" : "p-5",
        plan.featured && !isVip
          ? "border-primary shadow-md shadow-primary/10"
          : isVip
          ? "border-purple-500/50 shadow-lg shadow-purple-500/10"
          : "border-border",
      )}
    >
      {/* Title + price row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-bold leading-tight">{plan.title}</p>
          {plan.subtitle && (
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{plan.subtitle}</p>
          )}
        </div>

        <div className="shrink-0 text-right">
          {plan.strikePriceLabel && (
            <p className="text-xs text-muted-foreground line-through">{plan.strikePriceLabel}</p>
          )}
          <p
            className={cn(
              "text-2xl font-bold leading-none",
              isVip ? "text-purple-400" : plan.featured ? "text-primary" : "text-foreground",
            )}
          >
            {plan.priceLabel}
          </p>
          {plan.billingLabel && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{plan.billingLabel}</p>
          )}
        </div>
      </div>

      {/* Feature list */}
      {!compact && (
        <ul className={cn("mt-4 space-y-1.5")}>
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  isVip ? "text-purple-400" : "text-primary",
                )}
                aria-hidden="true"
              />
              <span className="leading-snug">{f}</span>
            </li>
          ))}
        </ul>
      )}

      {/* CTA */}
      {!isFree && plan.ctaLabel && (
        <button
          type="button"
          disabled={ctaLoading || ctaSubmitted}
          onClick={() => onCta?.(plan)}
          className={cn(
            "mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all active:scale-95 disabled:cursor-default",
            ctaSubmitted
              ? "border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
              : isVip
              ? "bg-purple-600 text-white hover:bg-purple-700"
              : plan.featured
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "border border-border hover:bg-accent",
          )}
        >
          {ctaSubmitted ? (
            "Request submitted"
          ) : (
            <>
              {plan.ctaLabel}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </>
          )}
        </button>
      )}
    </article>
  )
}
