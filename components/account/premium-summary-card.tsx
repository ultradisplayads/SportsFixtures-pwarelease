// components/account/premium-summary-card.tsx
// Shows the user's current membership state in the profile hub.
// Derives from entitlement truth — does not hardcode premium state.

import Link from "next/link"
import { Crown, ChevronRight } from "lucide-react"

interface PremiumSummaryCardProps {
  tier?: string | null
  active?: boolean
  expiresAt?: string | null
}

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  founder_vip: "VIP Lifetime",
}

const TIER_COLORS: Record<string, string> = {
  free: "text-muted-foreground",
  bronze: "text-amber-600",
  silver: "text-slate-400",
  gold: "text-yellow-500",
  founder_vip: "text-purple-400",
}

export function PremiumSummaryCard({ tier, active, expiresAt }: PremiumSummaryCardProps) {
  const key = (tier || "free").toLowerCase()
  const label = TIER_LABELS[key] ?? tier ?? "Free"
  const color = TIER_COLORS[key] ?? "text-muted-foreground"
  const isFree = key === "free"

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${isFree ? "bg-muted" : "bg-primary/10"}`}>
            <Crown className={`h-4 w-4 ${isFree ? "text-muted-foreground" : "text-primary"}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Membership</p>
            <p className={`text-base font-bold ${color}`}>{label}</p>
            <p className="text-xs text-muted-foreground">
              {active ? "Active" : "Not active"}
              {expiresAt && ` · ${new Date(expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
            </p>
          </div>
        </div>
        <Link
          href="/premium"
          className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent"
        >
          {isFree ? "Upgrade" : "Manage"}
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
