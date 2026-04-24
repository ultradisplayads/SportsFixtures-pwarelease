// components/account/profile-summary-card.tsx
// Strong profile overview card — not a skeleton of scattered rows.

import { MapPin } from "lucide-react"
import { getDisplayName, getInitials } from "@/lib/account"
import type { UserProfileSummary } from "@/types/account"

interface ProfileSummaryCardProps {
  profile: UserProfileSummary
}

export function ProfileSummaryCard({ profile }: ProfileSummaryCardProps) {
  const displayName = getDisplayName(profile)
  const initials = getInitials(profile)
  const location = [profile.city, profile.country].filter(Boolean).join(", ")

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative h-16 w-16 shrink-0">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={displayName}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
              {initials}
            </div>
          )}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <p className="truncate text-lg font-bold">{displayName}</p>
          {profile.email && (
            <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
          )}
          {location && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              {location}
            </p>
          )}
          {profile.timezone && (
            <p className="mt-0.5 text-xs text-muted-foreground/70">{profile.timezone}</p>
          )}
        </div>
      </div>

      {profile.createdAt && (
        <p className="mt-3 text-xs text-muted-foreground/60">
          Member since {new Date(profile.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </p>
      )}
    </div>
  )
}
