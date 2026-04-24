// GET /api/commercial/feed
// Returns normalized commercial cards (affiliate, sponsored, promo, venue, geo).
// Accepts optional ?positionKey=<string> to scope cards to a specific surface.
// Reads from SF backend when NEXT_PUBLIC_ENABLE_HOUSE_ADS=true.
// Returns empty items array when the backend is unavailable or disabled.

import { NextResponse } from "next/server"
import type { CommercialCard, CommercialFeedResponse } from "@/types/monetization"
import {
  fetchControlPlaneSnapshot,
  getEnabledCommercialSlots,
} from "@/lib/control-plane"

export const dynamic = "force-dynamic"

const SF_API_URL = (process.env.SF_API_URL ?? "https://staging-api.sportsfixtures.net")
  .replace(/\/api-docs\/?$/, "")
  .replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN ?? ""
const HOUSE_ADS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_HOUSE_ADS === "true"

// Attempt to pull active campaigns from the SF backend.
// Returns an empty array when the backend is unavailable or returns no data.
async function fetchSFCampaigns(positionKey?: string): Promise<CommercialCard[]> {
  if (!SF_API_URL) return []
  try {
    const qs = new URLSearchParams({ "filters[active][$eq]": "true", "pagination[pageSize]": "10" })
    if (positionKey) qs.set("filters[positionKey][$eq]", positionKey)

    const res = await fetch(`${SF_API_URL}/api/commercial-campaigns?${qs}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return []
    const json = await res.json()
    const rows: any[] = Array.isArray(json?.data) ? json.data : []

    return rows.map((r): CommercialCard => ({
      id:          String(r.id),
      type:        r.type ?? "editorial_promo",
      title:       r.title ?? "",
      body:        r.body ?? r.description ?? undefined,
      imageUrl:    r.imageUrl ?? undefined,
      href:        r.href ?? r.ctaUrl ?? undefined,
      disclosure:  r.disclosure ?? undefined,
      sponsorName: r.sponsorName ?? undefined,
      featured:    !!r.featured,
      geoTargeted: !!r.geoTargeted,
      venueId:     r.venueId ? String(r.venueId) : undefined,
      campaignId:  String(r.id),
      positionKey: r.positionKey ?? undefined,
      expiresAt:   r.expiresAt ?? undefined,
    }))
  } catch {
    return []
  }
}

export async function GET(req: Request): Promise<NextResponse<CommercialFeedResponse>> {
  const { searchParams } = new URL(req.url)
  const positionKey = searchParams.get("positionKey") ?? undefined

  // Load control-plane snapshot to apply slot enable/disable rules.
  // Falls back to empty slots (all enabled) if Strapi is unavailable.
  const snapshot = await fetchControlPlaneSnapshot()
  const enabledSlots = getEnabledCommercialSlots(snapshot.commercialSlots)
  // If slots are configured, only keys listed in enabledSlots are allowed.
  // If no slots are configured (empty array), all items pass through — safe default.
  const slotKeyFilter = enabledSlots.length > 0
    ? new Set(enabledSlots.map((s) => s.key))
    : null

  let items: CommercialCard[] = []

  if (HOUSE_ADS_ENABLED) {
    items = await fetchSFCampaigns(positionKey)
  }

  // Apply control-plane slot key filter — items whose positionKey is not in
  // the enabled set are suppressed. Items with no positionKey are always shown
  // (they are not slot-controlled).
  if (slotKeyFilter && items.length > 0) {
    items = items.filter(
      (i) => !i.positionKey || slotKeyFilter.has(i.positionKey),
    )
  }

  // Filter by positionKey client-side too in case backend doesn't support filter
  if (positionKey && items.length > 0) {
    items = items.filter(
      (i) => !i.positionKey || i.positionKey === positionKey,
    )
  }

  const response: CommercialFeedResponse = {
    items,
    generatedAt: new Date().toISOString(),
  }

  return NextResponse.json(response)
}
