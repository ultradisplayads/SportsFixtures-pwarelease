"use client"

import { useState, useEffect } from "react"
import {
  subscriptionManager,
  type Subscription,
  type SubscriptionTier,
  type SubscriptionFeatures,
} from "@/lib/subscription-manager"

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription>(subscriptionManager.getSubscription())

  useEffect(() => {
    const checkSubscription = () => setSubscription(subscriptionManager.getSubscription())
    const interval = setInterval(checkSubscription, 60000)
    return () => clearInterval(interval)
  }, [])

  return {
    ...subscription,
    effectiveTier: subscriptionManager.getEffectiveTier(),
    isFounderVip: subscriptionManager.isFounderVip(),
    upgrade: (tier: SubscriptionTier, duration: "monthly" | "yearly") => {
      subscriptionManager.upgrade(tier, duration)
      setSubscription(subscriptionManager.getSubscription())
    },
    cancel: () => {
      subscriptionManager.cancel()
      setSubscription(subscriptionManager.getSubscription())
    },
    hasFeature: (feature: keyof SubscriptionFeatures) => subscriptionManager.hasFeature(feature),
    isPremium: () => subscriptionManager.isPremium(),
    getEffectiveTier: () => subscriptionManager.getEffectiveTier(),
    getFeatureList: (tier: SubscriptionTier) => subscriptionManager.getFeatureList(tier),
    getPricing: (tier: SubscriptionTier, duration: "monthly" | "yearly"): string =>
      subscriptionManager.getPricing(tier, duration),
  }
}
