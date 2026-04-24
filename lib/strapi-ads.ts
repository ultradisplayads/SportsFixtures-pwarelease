/**
 * lib/strapi-ads.ts
 *
 * Fetches affiliate ad slots from Strapi CMS.
 *
 * Strapi content-type expected:
 *   Collection: "ad-slots"  (api::ad-slot.ad-slot)
 *   Fields:
 *     headline      Text (required)
 *     sub           Text
 *     ctaLabel      Text  (default "View offer")
 *     url           Text (required)
 *     badgeLabel    Text  (e.g. "Streaming", "TV", "Betting")
 *     colorFrom     Text  (Tailwind from-* class, e.g. "from-orange-500/10")
 *     colorTo       Text  (Tailwind to-* class,   e.g. "to-orange-600/5")
 *     isAffiliate   Boolean
 *     placement     Enumeration: "fixtures" | "home" | "tv" | "venues" | "all"  (default "all")
 *     active        Boolean (default true)
 *
 * Environment variables:
 *   NEXT_PUBLIC_STRAPI_URL  — base URL of your Strapi instance, e.g. https://cms.example.com
 *   STRAPI_API_TOKEN        — read-only API token (server-only)
 */

import { SMART_ADS, type SmartAdEntry } from "@/lib/affiliate-registry"

export type AdPlacement = "fixtures" | "home" | "tv" | "venues" | "all"

export interface StrapiAdSlot {
  id: number
  headline: string
  sub: string
  ctaLabel: string
  url: string
  badgeLabel: string
  color: string          // pre-built "from-X to-Y" gradient string
  isAffiliate: boolean
  placement: AdPlacement
  active: boolean
}

interface StrapiResponse {
  data: Array<{
    id: number
    attributes: {
      headline: string
      sub?: string
      ctaLabel?: string
      url: string
      badgeLabel?: string
      colorFrom?: string
      colorTo?: string
      isAffiliate?: boolean
      placement?: AdPlacement
      active?: boolean
    }
  }>
}

function toStrapiAdSlot(raw: StrapiResponse["data"][number]): StrapiAdSlot {
  const a = raw.attributes
  return {
    id: raw.id,
    headline: a.headline,
    sub: a.sub ?? "",
    ctaLabel: a.ctaLabel ?? "View offer",
    url: a.url,
    badgeLabel: a.badgeLabel ?? "Partner",
    color: `${a.colorFrom ?? "from-primary/10"} ${a.colorTo ?? "to-primary/5"}`,
    isAffiliate: a.isAffiliate ?? true,
    placement: a.placement ?? "all",
    active: a.active ?? true,
  }
}

/** Convert the static SMART_ADS fallback into the same StrapiAdSlot shape. */
function smartAdToSlot(ad: SmartAdEntry, idx: number): StrapiAdSlot {
  return {
    id: -(idx + 1),
    headline: ad.headline,
    sub: ad.sub,
    ctaLabel: ad.ctaLabel,
    url: ad.url,
    badgeLabel: ad.badgeLabel,
    color: ad.color,
    isAffiliate: true,
    placement: "all",
    active: true,
  }
}

/**
 * Server-side fetch — call this from the /api/ads route.
 * Caches for 60 s so Strapi is not hammered on every request.
 * Falls back to the static SMART_ADS from affiliate-registry if Strapi is not configured.
 */
export async function fetchStrapiAds(): Promise<StrapiAdSlot[]> {
  const base = process.env.NEXT_PUBLIC_STRAPI_URL
  const token = process.env.STRAPI_API_TOKEN

  if (!base || !token) {
    // Strapi not yet configured — return the static affiliate fallback
    return SMART_ADS.map(smartAdToSlot)
  }

  try {
    const res = await fetch(
      `${base}/api/ad-slots?filters[active][$eq]=true&populate=*&pagination[pageSize]=50`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 60 },
      },
    )

    if (!res.ok) throw new Error(`Strapi ${res.status}`)

    const json: StrapiResponse = await res.json()
    const slots = json.data.map(toStrapiAdSlot).filter((s) => s.active)
    return slots.length > 0 ? slots : SMART_ADS.map(smartAdToSlot)
  } catch (err) {
    console.error("[strapi-ads] fetch failed, using static fallback:", err)
    return SMART_ADS.map(smartAdToSlot)
  }
}

/**
 * Filter slots by placement — matches "all" or the exact placement key.
 */
export function filterByPlacement(
  slots: StrapiAdSlot[],
  placement: AdPlacement,
): StrapiAdSlot[] {
  return slots.filter((s) => s.placement === "all" || s.placement === placement)
}
