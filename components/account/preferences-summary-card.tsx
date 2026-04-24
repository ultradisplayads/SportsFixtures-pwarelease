// components/account/preferences-summary-card.tsx
// Profile-page summary of personalization + notification state.
// Navigation layer only — does not duplicate detailed settings pages.

import Link from "next/link"
import { Users, Bell, MapPin, Calendar, ChevronRight } from "lucide-react"
import type { UserProfilePreferencesSummary } from "@/types/account"

interface PreferencesSummaryCardProps {
  preferences: UserProfilePreferencesSummary
}

export function PreferencesSummaryCard({ preferences: p }: PreferencesSummaryCardProps) {
  const stats = [
    { label: "Teams",        value: p.followedTeamsCount },
    { label: "Competitions", value: p.followedCompetitionsCount },
    { label: "Players",      value: p.followedPlayersCount },
    { label: "Venues",       value: p.followedVenuesCount },
  ].filter(s => s.value > 0)

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <p className="text-sm font-semibold">Your setup</p>

      {/* Follow counts */}
      {stats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stats.map(s => (
            <div key={s.label} className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        <StatusPill
          icon={Bell}
          label="Notifications"
          active={p.notificationsEnabled}
        />
        <StatusPill
          icon={MapPin}
          label="Location"
          active={p.locationRecommendationsEnabled}
        />
        {p.calendarMode && (
          <StatusPill
            icon={Calendar}
            label={p.calendarMode === "my-calendar" ? "My calendar" : "All fixtures"}
            active
          />
        )}
      </div>

      {/* Deep-link nav */}
      <div className="flex gap-2 pt-1">
        <NavLink href="/settings/personalization" label="Personalization" />
        <NavLink href="/settings/notifications" label="Notifications" />
      </div>
    </div>
  )
}

function StatusPill({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
}) {
  return (
    <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
      active
        ? "border-primary/20 bg-primary/5 text-primary"
        : "border-border bg-muted/40 text-muted-foreground"
    }`}>
      <Icon className="h-3 w-3" />
      <span>{label}: {active ? "On" : "Off"}</span>
    </div>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent"
    >
      {label}
      <ChevronRight className="h-3 w-3" />
    </Link>
  )
}
