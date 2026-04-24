"use client"

/**
 * AdInjection — Strapi-backed affiliate ad banner for free-tier (Bronze) users.
 *
 * Data source: GET /api/ads?placement=<placement>
 *   — proxies Strapi CMS, falls back to static affiliate-registry entries
 *   — all ad slots are managed in Strapi: headline, sub, CTA, URL, badge,
 *     gradient colours, placement, and active flag
 *
 * Rendering rules:
 *   - Renders only for Bronze (free) users
 *   - The caller controls WHEN to render (every 6 fixtures/modules)
 *   - `index` drives rotation through the slot list so different ads show
 *     at each injection point in a single page render
 *   - Dismissible per session (not persisted — re-appears on next visit)
 */

import { useState, useEffect } from "react"
import { X, ExternalLink } from "lucide-react"
import { useSubscription } from "@/lib/use-subscription"
import type { AdPlacement, StrapiAdSlot } from "@/lib/strapi-ads"

interface AdInjectionProps {
  /** Which Strapi placement bucket to pull from */
  placement: AdPlacement
  /**
   * Rotation index — the ad shown is slots[index % slots.length].
   * Pass the fixture group index or module index so adjacent injections
   * show different ads.
   */
  index?: number
  className?: string
}

// Module-level SWR-lite cache so all AdInjection instances on a page share one fetch
const cache: Map<AdPlacement, { slots: StrapiAdSlot[]; ts: number }> = new Map()
const CACHE_TTL = 60_000 // 60 s

async function loadSlots(placement: AdPlacement): Promise<StrapiAdSlot[]> {
  const hit = cache.get(placement)
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.slots

  try {
    const res = await fetch(`/api/ads?placement=${placement}`, { cache: "no-store" })
    if (!res.ok) throw new Error(`${res.status}`)
    const slots: StrapiAdSlot[] = await res.json()
    cache.set(placement, { slots, ts: Date.now() })
    return slots
  } catch {
    return []
  }
}

export function AdInjection({ placement, index = 0, className = "" }: AdInjectionProps) {
  const { tier } = useSubscription()
  const [slots, setSlots] = useState<StrapiAdSlot[]>([])
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (tier !== "bronze") return
    loadSlots(placement).then(setSlots)
  }, [tier, placement])

  // Only show for free tier
  if (tier !== "bronze") return null
  if (dismissed) return null
  if (slots.length === 0) return null

  const ad = slots[index % slots.length]
  if (!ad) return null

  return (
    <div
      className={`relative my-2 rounded-xl border border-border bg-gradient-to-r ${ad.color} overflow-hidden ${className}`}
      role="complementary"
      aria-label={`Sponsored: ${ad.headline}`}
    >
      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 z-10 rounded-full bg-background/70 p-1 transition-colors hover:bg-background"
        aria-label="Close ad"
        type="button"
      >
        <X className="h-3 w-3" />
      </button>

      <div className="flex items-center gap-3 p-3 pr-8">
        {/* Badge */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          <span className="rounded-md bg-background/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-foreground border border-border">
            {ad.badgeLabel}
          </span>
          {ad.isAffiliate && (
            <span className="text-[8px] uppercase text-muted-foreground tracking-wider">Ad</span>
          )}
        </div>

        {/* Copy */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight truncate">{ad.headline}</p>
          {ad.sub && (
            <p className="mt-0.5 text-xs text-muted-foreground leading-snug line-clamp-1">{ad.sub}</p>
          )}
        </div>

        {/* CTA */}
        <a
          href={ad.url}
          target="_blank"
          rel={`noopener noreferrer${ad.isAffiliate ? " sponsored" : ""}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          {ad.ctaLabel}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}

/**
 * AdInjectionRow — convenience wrapper used inside flat lists.
 * Shows the ad only when `groupIndex` is a multiple of `every` (and > 0).
 */
export function AdInjectionRow({
  groupIndex,
  every = 6,
  placement,
}: {
  groupIndex: number
  every?: number
  placement: AdPlacement
}) {
  if (groupIndex === 0 || groupIndex % every !== 0) return null
  return <AdInjection placement={placement} index={Math.floor(groupIndex / every) - 1} />
}
