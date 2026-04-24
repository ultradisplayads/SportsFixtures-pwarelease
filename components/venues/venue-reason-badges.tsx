import type { VenueDiscoveryReason } from "@/types/venues"

const REASON_LABELS: Record<VenueDiscoveryReason, string> = {
  near_you: "Near you",
  showing_this_match: "Showing this match",
  showing_this_sport: "Showing this sport",
  showing_this_competition: "Showing this competition",
  you_follow_this_venue: "You follow this venue",
  has_live_offer: "Has an offer",
  editorial_boost: "Featured",
  sponsored: "Sponsored",
}

// Reasons that should be visually prominent
const HIGHLIGHT_REASONS = new Set<VenueDiscoveryReason>([
  "showing_this_match",
  "you_follow_this_venue",
  "has_live_offer",
])

interface Props {
  reasons: VenueDiscoveryReason[]
  /** Limit how many badges to show (default: 3) */
  max?: number
}

export function VenueReasonBadges({ reasons, max = 3 }: Props) {
  if (!reasons?.length) return null

  const visible = reasons.slice(0, max)

  return (
    <div className="mb-2.5 flex flex-wrap gap-1.5">
      {visible.map((reason) => (
        <span
          key={reason}
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
            HIGHLIGHT_REASONS.has(reason)
              ? "bg-primary/10 text-primary"
              : "border border-border bg-muted text-muted-foreground"
          }`}
        >
          {REASON_LABELS[reason]}
        </span>
      ))}
    </div>
  )
}
