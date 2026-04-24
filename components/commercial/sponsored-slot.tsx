"use client"

// Inline sponsored slot — replaces ad-injection.tsx for structured sponsored items.
// Renders only when the item has a title and href.
// Respects session-level dismiss state.

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import type { CommercialCard as CommercialCardType } from "@/types/monetization"
import { DisclosurePill } from "@/components/commercial/disclosure-pill"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { ExternalLinkGuard } from "@/components/platform/external-link-guard"

interface SponsoredSlotProps {
  item: CommercialCardType
  dismissKey?: string // sessionStorage key for dismiss persistence
}

export function SponsoredSlot({ item, dismissKey }: SponsoredSlotProps) {
  const [dismissed, setDismissed] = useState(false)
  const storeKey = dismissKey ?? `sf_sponsored_dismissed_${item.id}`

  useEffect(() => {
    const saved = sessionStorage.getItem(storeKey)
    if (saved && Date.now() - Number(saved) < 60 * 60 * 1000) setDismissed(true)
  }, [storeKey])

  if (dismissed || !item.title || !item.href) return null

  const dismiss = () => {
    triggerHaptic("light")
    sessionStorage.setItem(storeKey, String(Date.now()))
    setDismissed(true)
  }

  return (
    <div className="relative rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-start gap-3 pr-6">
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-lg object-cover"
            loading="lazy"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold leading-tight">{item.title}</p>
            <DisclosurePill disclosure={item.disclosure ?? "sponsored"} />
          </div>
          {item.body && (
            <p className="mt-0.5 text-xs text-muted-foreground">{item.body}</p>
          )}
        </div>
      </div>

      {/* Dismiss */}
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-2 rounded p-0.5 hover:bg-accent"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      </button>

      {/* CTA */}
      <ExternalLinkGuard
        href={item.href}
        className="mt-2.5 flex items-center justify-center rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {item.sponsorName ? `Visit ${item.sponsorName}` : "Learn more"}
      </ExternalLinkGuard>
    </div>
  )
}
