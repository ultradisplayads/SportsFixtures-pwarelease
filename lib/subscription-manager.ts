// Subscription Management — Bronze / Silver / Gold / Founder VIP

export type SubscriptionTier = "bronze" | "silver" | "gold" | "founder_vip"

/** Dec 31 of the current year — Gold Launch Pass expiry */
export const LAUNCH_PASS_EXPIRY = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59)

export function isLaunchPassActive(): boolean {
  return new Date() < LAUNCH_PASS_EXPIRY
}

export interface SubscriptionFeatures {
  adFree: boolean
  unlimitedNotifications: boolean
  advancedStats: boolean
  videoHighlights: boolean
  prioritySupport: boolean
  multiDevice: boolean
  exportData: boolean
  venueTools: boolean
}

export interface Subscription {
  tier: SubscriptionTier
  active: boolean
  /** null = never expires (Bronze), set for Silver/Gold when billing is live */
  expiresAt?: Date
  /** true when user is on Bronze but has a Gold Launch Pass active */
  launchPassActive: boolean
  features: SubscriptionFeatures
}

const TIER_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  bronze: {
    adFree: false,
    unlimitedNotifications: false,
    advancedStats: false,
    videoHighlights: false,
    prioritySupport: false,
    multiDevice: false,
    exportData: false,
    venueTools: false,
  },
  silver: {
    adFree: false,           // lighter ad load vs bronze
    unlimitedNotifications: true,
    advancedStats: true,
    videoHighlights: false,
    prioritySupport: false,
    multiDevice: true,
    exportData: false,
    venueTools: true,
  },
  gold: {
    adFree: true,
    unlimitedNotifications: true,
    advancedStats: true,
    videoHighlights: true,
    prioritySupport: true,
    multiDevice: true,
    exportData: true,
    venueTools: true,
  },
  founder_vip: {
    adFree: true,
    unlimitedNotifications: true,
    advancedStats: true,
    videoHighlights: true,
    prioritySupport: true,
    multiDevice: true,
    exportData: true,
    venueTools: true,
  },
}

class SubscriptionManager {
  private subscription: Subscription = {
    tier: "bronze",
    active: true,
    launchPassActive: isLaunchPassActive(),
    features: TIER_FEATURES.bronze,
  }

  constructor() {
    this.loadSubscription()
  }

  private loadSubscription() {
    if (typeof window === "undefined") return
    try {
      const saved = localStorage.getItem("sf_subscription_v2")
      if (saved) {
        const parsed = JSON.parse(saved)
        this.subscription = {
          ...parsed,
          expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : undefined,
          launchPassActive: isLaunchPassActive(),
        }
      }
    } catch { /* ignore corrupted storage */ }
  }

  private saveSubscription() {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem("sf_subscription_v2", JSON.stringify(this.subscription))
    } catch { /* ignore */ }
  }

  getSubscription(): Subscription {
    // Paid tier expiry — fall back to bronze
    if (
      this.subscription.tier !== "bronze" &&
      this.subscription.expiresAt &&
      new Date() > this.subscription.expiresAt
    ) {
      this.subscription = {
        tier: "bronze",
        active: true,
        launchPassActive: isLaunchPassActive(),
        features: TIER_FEATURES.bronze,
      }
      this.saveSubscription()
    }
    return this.subscription
  }

  getTier(): SubscriptionTier {
    return this.getSubscription().tier
  }

  /** Effective tier — bronze users get gold features during launch pass; founder_vip always gets gold-level features */
  getEffectiveTier(): SubscriptionTier {
    const sub = this.getSubscription()
    if (sub.tier === "founder_vip") return "founder_vip"
    if (sub.tier === "bronze" && sub.launchPassActive) return "gold"
    return sub.tier
  }

  isFounderVip(): boolean {
    return this.getSubscription().tier === "founder_vip"
  }

  hasFeature(feature: keyof SubscriptionFeatures): boolean {
    const effective = this.getEffectiveTier()
    return TIER_FEATURES[effective][feature]
  }

  isPremium(): boolean {
    return this.getEffectiveTier() !== "bronze"
  }

  upgrade(tier: SubscriptionTier, duration: "monthly" | "yearly") {
    const expiresAt = new Date()
    if (duration === "monthly") expiresAt.setMonth(expiresAt.getMonth() + 1)
    else expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    this.subscription = {
      tier,
      active: true,
      expiresAt,
      launchPassActive: isLaunchPassActive(),
      features: TIER_FEATURES[tier],
    }
    this.saveSubscription()
  }

  cancel() {
    this.subscription = {
      tier: "bronze",
      active: true,
      launchPassActive: isLaunchPassActive(),
      features: TIER_FEATURES.bronze,
    }
    this.saveSubscription()
  }

  getFeatureList(tier: SubscriptionTier): string[] {
    if (tier === "bronze") {
      return [
        "Core fixtures, results and live scores",
        "Basic match alerts (up to 3 teams)",
        "Venue discovery",
        "Full fixture calendar",
        "Sponsored discovery modules",
      ]
    }
    if (tier === "silver") {
      return [
        "Everything in Bronze",
        "Unlimited match alerts and reminders",
        "Deeper personalisation",
        "Better venue and TV/watch filters",
        "Multi-device sync",
        "Reduced ad load",
      ]
    }
    if (tier === "gold") {
      return [
        "Everything in Silver",
        "Ad-free experience",
        "All alert windows (5m to 24h)",
        "Best personalisation",
        "Premium venue and watch tools",
        "Exclusive Founder offers",
        "Export your data",
        "Priority support",
      ]
    }
    // founder_vip
    return [
      "Everything in Gold — for life, no subscription ever",
      "Lifetime access — pay once, own it forever",
      "Exclusive VIP venue discounts (up to 20% off selected venues)",
      "Food and drinks discounts at partner venues",
      "Secret invites — private match events, watch parties and launch nights",
      "First look at every new feature before anyone else",
      "Founder VIP badge across the app",
      "Direct line to the team — your feedback shapes the roadmap",
      "Supporter recognition across the app",
    ]
  }

  getPricing(tier: SubscriptionTier, duration: "monthly" | "yearly"): string {
    const prices: Record<SubscriptionTier, { monthly: string; yearly: string }> = {
      bronze:      { monthly: "0",      yearly: "0" },
      silver:      { monthly: "1.99",   yearly: "14.99" },
      gold:        { monthly: "2.99",   yearly: "24.99" },
      founder_vip: { monthly: "99.99",  yearly: "99.99" },
    }
    return prices[tier][duration]
  }
}

export const subscriptionManager = new SubscriptionManager()
