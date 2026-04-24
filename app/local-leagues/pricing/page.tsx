"use client"

import { Trophy, Check, Sparkles, Crown } from "lucide-react"

export default function LocalLeaguesPricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-4">
        <h1 className="text-xl font-bold">Pool & Darts League Pricing</h1>
        <p className="text-sm text-muted-foreground">Digital scoring and league management</p>
      </div>

      <div className="space-y-6 p-4">
        <div className="grid gap-4">
          {/* Free Tier */}
          <div className="rounded-xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">Free</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Get started with basic league features</p>

            <div className="mt-4 text-3xl font-bold">Free</div>

            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">Up to 8 teams</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">Basic league tables</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">Manual score entry</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">Community support</span>
              </div>
            </div>

            <a
              href="/local-leagues/pool"
              className="mt-6 block w-full rounded-lg border border-border bg-card px-4 py-3 text-center text-sm font-medium hover:bg-accent active:scale-95"
            >
              Start Free League
            </a>
          </div>

          {/* Pro Tier */}
          <div className="relative rounded-xl border-2 border-primary bg-primary/5 p-6 shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              Most Popular
            </div>

            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">Pro League</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Full-featured league management</p>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold">£19.99</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">Unlimited teams</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">Digital scoring on venue displays</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">Advanced statistics</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">Player profiles & rankings</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">Fixtures & results management</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">Email notifications</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">Priority support</span>
              </div>
            </div>

            <a
              href="/local-leagues/pool"
              className="mt-6 block w-full rounded-lg bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-95"
            >
              Start Pro League
            </a>
          </div>

          {/* Enterprise Tier */}
          <div className="rounded-xl border-2 border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">Enterprise</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Multiple leagues and venues</p>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold">£49.99</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">Everything in Pro</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">Multiple leagues (pool & darts)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">Multi-venue management</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">Regional league coordination</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">Custom branding</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">API access</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">Dedicated account manager</span>
              </div>
            </div>

            <a
              href="/venues/owner-signup?tier=enterprise-league"
              className="mt-6 block w-full rounded-lg border border-border bg-card px-4 py-3 text-center text-sm font-medium hover:bg-accent active:scale-95"
            >
              Contact Sales
            </a>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/50 p-4 text-center text-xs text-muted-foreground">
          All prices in GBP. Annual billing available with 20% discount.
        </div>
      </div>
    </div>
  )
}
