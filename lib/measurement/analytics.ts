import type { ConversionType, PageType, TrafficSourceType } from "@/lib/measurement/types"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

export function trackEvent(eventName: string, params: Record<string, unknown>) {
  if (typeof window === "undefined") return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event: eventName, ...params })
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params)
  }
}

export function trackPageView(args: {
  path: string
  pageType: PageType
  sourceType?: TrafficSourceType
}) {
  trackEvent("sf_page_view", args)
}

export function trackConversion(args: {
  conversionType: ConversionType
  path: string
  pageType: PageType
  value?: number
}) {
  trackEvent("sf_conversion", args)
}

export function trackVenueIntent(args: {
  path: string
  city?: string
  eventName: "venue_click" | "watch_here_click" | "venue_impression"
}) {
  trackEvent("sf_venue_intent", args)
}

export function trackAiReferralLanding(args: {
  path: string
  sourceType: TrafficSourceType
}) {
  trackEvent("sf_ai_referral_landing", args)
}
