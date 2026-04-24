"use client"

import { Check, Minus } from "lucide-react"
import type { PremiumPlan } from "@/types/monetization"

interface FeatureRow {
  label: string
  tiers: Partial<Record<string, boolean>>
}

// Feature matrix — one canonical list, not scattered per-plan.
// Tier keys must match PremiumPlan.id values.
const FEATURE_ROWS: FeatureRow[] = [
  { label: "Core fixtures & live scores",     tiers: { bronze: true, silver: true, gold: true, founder_vip: true } },
  { label: "Basic match alerts (up to 3)",    tiers: { bronze: true, silver: true, gold: true, founder_vip: true } },
  { label: "Venue discovery",                 tiers: { bronze: true, silver: true, gold: true, founder_vip: true } },
  { label: "Unlimited match alerts",          tiers: { bronze: false, silver: true, gold: true, founder_vip: true } },
  { label: "Reduced ad load",                 tiers: { bronze: false, silver: true, gold: true, founder_vip: true } },
  { label: "Deeper personalisation",          tiers: { bronze: false, silver: true, gold: true, founder_vip: true } },
  { label: "Multi-device sync",               tiers: { bronze: false, silver: true, gold: true, founder_vip: true } },
  { label: "Ad-free experience",              tiers: { bronze: false, silver: false, gold: true, founder_vip: true } },
  { label: "All alert windows (5m–24h)",      tiers: { bronze: false, silver: false, gold: true, founder_vip: true } },
  { label: "Premium venue & watch tools",     tiers: { bronze: false, silver: false, gold: true, founder_vip: true } },
  { label: "Export your data",                tiers: { bronze: false, silver: false, gold: true, founder_vip: true } },
  { label: "Priority support",                tiers: { bronze: false, silver: false, gold: true, founder_vip: true } },
  { label: "VIP venue discounts",             tiers: { bronze: false, silver: false, gold: false, founder_vip: true } },
  { label: "Food & drinks discounts",         tiers: { bronze: false, silver: false, gold: false, founder_vip: true } },
  { label: "Secret invites",                  tiers: { bronze: false, silver: false, gold: false, founder_vip: true } },
  { label: "Lifetime access — no renewal",    tiers: { bronze: false, silver: false, gold: false, founder_vip: true } },
]

interface FeatureComparisonProps {
  plans: PremiumPlan[]
}

export function FeatureComparison({ plans }: FeatureComparisonProps) {
  // Only show visible plans in the comparison
  const visible = plans.filter((p) => p.visible)

  return (
    <section aria-label="Plan feature comparison" className="px-4 py-6">
      <h2 className="mb-4 text-center text-base font-bold">Compare plans</h2>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[360px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground">
                Feature
              </th>
              {visible.map((p) => (
                <th
                  key={p.id}
                  className="px-2 py-3 text-center text-xs font-semibold"
                  scope="col"
                >
                  {p.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FEATURE_ROWS.map((row, i) => (
              <tr
                key={row.label}
                className={i % 2 === 0 ? "bg-background" : "bg-muted/10"}
              >
                <td className="px-3 py-2.5 text-xs text-foreground">{row.label}</td>
                {visible.map((p) => {
                  const has = row.tiers[p.id] ?? false
                  return (
                    <td key={p.id} className="px-2 py-2.5 text-center">
                      {has ? (
                        <Check
                          className="mx-auto h-4 w-4 text-primary"
                          aria-label="Included"
                        />
                      ) : (
                        <Minus
                          className="mx-auto h-4 w-4 text-muted-foreground/30"
                          aria-label="Not included"
                        />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
