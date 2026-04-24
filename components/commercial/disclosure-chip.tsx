// components/commercial/disclosure-chip.tsx
// Section 05 — Inline disclosure chip: smaller and more compact than DisclosurePill.
// Use DisclosurePill for card headers; use DisclosureChip for tight inline surfaces
// such as ticker items, list rows, or small badges.

import type { CommercialDisclosure } from "@/types/monetization"

const LABELS: Record<CommercialDisclosure, string> = {
  affiliate: "Ad",
  sponsored: "Sponsored",
  promo:     "Promo",
  editorial: "Featured",
}

interface DisclosureChipProps {
  disclosure?: CommercialDisclosure | null
  className?: string
}

export function DisclosureChip({ disclosure, className = "" }: DisclosureChipProps) {
  if (!disclosure) return null

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded bg-muted/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-none tracking-wide text-muted-foreground ${className}`}
      aria-label={`Content disclosure: ${LABELS[disclosure]}`}
    >
      {LABELS[disclosure]}
    </span>
  )
}
