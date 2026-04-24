"use client"

import { useState } from "react"
import { Tv, Check, Sparkles, Crown, Building2, Zap } from "lucide-react"
import { triggerHaptic } from "@/lib/haptic-feedback"

export default function VenuePricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [screenCount, setScreenCount] = useState<1 | 2 | 5>(1)

  const handleBillingToggle = () => {
    triggerHaptic("selection")
    setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
  }

  const plans = [
    {
      name: "Free",
      icon: <Sparkles className="h-6 w-6" />,
      description: "Try before you buy",
      features: [
        "Limited to 2 sports per week",
        "3rd party advertisements",
        "Brought to you by GFP, SportsBarz & Sports Fixtures",
        "Basic fixture scheduling",
        "Community support",
      ],
      price: 0,
      popular: false,
    },
    {
      name: "Launch Special",
      icon: <Zap className="h-6 w-6" />,
      description: "Limited time offer",
      features: [
        "All sports coverage",
        "Your branding",
        "Custom team priorities",
        "Operating hours integration",
        "Email support",
        "Cancel anytime",
      ],
      price: billingCycle === "monthly" ? 9.99 : 99.99,
      originalPrice: billingCycle === "monthly" ? 29.99 : 299.99,
      popular: true,
      badge: "Save 67%",
    },
    {
      name: "Base",
      icon: <Tv className="h-6 w-6" />,
      description: "Single screen solution",
      features: [
        "1 screen",
        "All sports coverage",
        "Full customization",
        "Operating hours sync",
        "Priority email support",
        "Monthly updates",
      ],
      price: billingCycle === "monthly" ? 29.99 : 20.99,
      screens: 1,
    },
    {
      name: "Pro",
      icon: <Crown className="h-6 w-6" />,
      description: "Multi-screen venues",
      features: [
        "2-5 screens",
        "Everything in Base",
        "Advanced analytics",
        "Custom branding options",
        "Priority support",
        "Quarterly business review",
      ],
      price: billingCycle === "monthly" ? 79.99 : 55.99,
      screens: 5,
    },
    {
      name: "Enterprise",
      icon: <Building2 className="h-6 w-6" />,
      description: "Large venues & chains",
      features: [
        "6+ screens or multiple locations",
        "Everything in Pro",
        "Dedicated account manager",
        "Custom integrations",
        "SLA guarantees",
        "White-label options",
      ],
      price: "Custom",
      custom: true,
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <div className="sticky top-0 z-10 border-b border-border bg-card px-4 py-4">
        <h1 className="text-xl font-bold">Venue Display Pricing</h1>
        <p className="text-sm text-muted-foreground">Digital signage for sports venues</p>
      </div>

      <div className="space-y-6 p-4">
        {/* Billing Toggle */}
        <div className="mx-auto flex w-fit items-center gap-3 rounded-lg border border-border bg-card p-1">
          <button
            onClick={handleBillingToggle}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              billingCycle === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={handleBillingToggle}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              billingCycle === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Annual
            <span className="ml-1.5 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] text-white">Save 30%</span>
          </button>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border-2 p-6 ${
                plan.popular ? "border-primary bg-primary/5 shadow-lg" : "border-border bg-card"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white">
                  {plan.badge}
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-primary">{plan.icon}</div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              <div className="mt-4">
                {plan.custom ? (
                  <div className="text-2xl font-bold">Contact Us</div>
                ) : (
                  <div className="flex items-baseline gap-2">
                    {plan.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through">£{plan.originalPrice}</span>
                    )}
                    <span className="text-3xl font-bold">{plan.price === 0 ? "Free" : `£${plan.price}`}</span>
                    {plan.price !== 0 && (
                      <span className="text-sm text-muted-foreground">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <a
                href={plan.custom ? "/venues/owner-signup?tier=enterprise" : "/venues/owner-signup"}
                className={`mt-6 block w-full rounded-lg px-4 py-3 text-center text-sm font-medium transition-all ${
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                    : "border border-border bg-card hover:bg-accent active:scale-95"
                }`}
              >
                {plan.custom ? "Contact Sales" : plan.price === 0 ? "Start Free Trial" : "Get Started"}
              </a>
            </div>
          ))}
        </div>

        {/* UltraDisplayAds Integration */}
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-bold">Custom Advertising Solutions</h3>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Powered by UltraDisplayAds.com - Create custom image, template, or video ads for your venue
          </p>
          <div className="grid gap-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
              <span className="text-sm">Custom Image Ads</span>
              <span className="font-semibold">From £49/mo</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
              <span className="text-sm">Template-Based Ads</span>
              <span className="font-semibold">From £79/mo</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
              <span className="text-sm">Video Ad Creation</span>
              <span className="font-semibold">From £149/mo</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-purple-500/20 bg-purple-500/10 p-3">
              <span className="text-sm font-semibold">Fully Managed Service</span>
              <span className="font-bold text-purple-600">2x Base Price</span>
            </div>
          </div>
        </div>

        {/* Add-Ons */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 font-bold">Optional Add-Ons</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
              <div>
                <div className="font-semibold">Pool League Management</div>
                <div className="text-xs text-muted-foreground">Digital scoring & league tables</div>
              </div>
              <span className="font-semibold">£19.99/mo</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
              <div>
                <div className="font-semibold">Darts League Management</div>
                <div className="text-xs text-muted-foreground">Digital scoring & league tables</div>
              </div>
              <span className="font-semibold">£19.99/mo</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
              <div>
                <div className="font-semibold">Venue Listing (Premium)</div>
                <div className="text-xs text-muted-foreground">Featured on GFP & SportsBarz</div>
              </div>
              <span className="font-semibold">£49.99/mo</span>
            </div>
          </div>
        </div>

        {/* Competitive Note */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
          <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">Why Choose Sports Fixtures?</div>
          <ul className="mt-2 space-y-1 text-xs text-blue-600 dark:text-blue-400">
            <li>• Cheaper than Fanzy & SportsBarMarketing.com</li>
            <li>• Time-zone accurate for global sports</li>
            <li>• Integrates with pool & darts leagues</li>
            <li>• Free tier to try before you buy</li>
            <li>• 30-day money-back guarantee</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
