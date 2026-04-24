import type { CommercialDisclosure } from "@/types/monetization"

const LABELS: Record<CommercialDisclosure, string> = {
  affiliate: "Affiliate",
  sponsored: "Sponsored",
  promo:     "Promo",
  editorial: "Featured",
}

interface DisclosurePillProps {
  disclosure?: CommercialDisclosure
}

export function DisclosurePill({ disclosure }: DisclosurePillProps) {
  if (!disclosure) return null

  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium leading-none text-muted-foreground"
      aria-label={`Content type: ${LABELS[disclosure]}`}
    >
      {LABELS[disclosure]}
    </span>
  )
}
