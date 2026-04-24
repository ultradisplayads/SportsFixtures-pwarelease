"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ChevronLeft, LogOut, Star, Trophy, Smartphone,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getFavourites, type Favourite } from "@/lib/favourites-api"
import { gamificationManager } from "@/lib/gamification-manager"
import { canEditIdentity, canChangePassword } from "@/lib/account"
import { useAccountOverview } from "@/hooks/use-account-overview"
import { Button } from "@/components/ui/button"
import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { AccountModeBanner } from "@/components/account/account-mode-banner"
import { ProfileSummaryCard } from "@/components/account/profile-summary-card"
import { PremiumSummaryCard } from "@/components/account/premium-summary-card"
import { PreferencesSummaryCard } from "@/components/account/preferences-summary-card"
import { ProfileEditForm } from "@/components/account/profile-edit-form"
import { PasswordChangeForm } from "@/components/account/password-change-form"
import { PrivacyConsentForm } from "@/components/account/privacy-consent-form"
import { DeleteAccountPanel } from "@/components/account/delete-account-panel"
import { AccountEmptyState } from "@/components/account/account-empty-state"

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, isAnonymous, deviceToken, signOut } = useAuth()
  const { data, isLoading, error, profile, security, preferences, consent, deletion, refresh } = useAccountOverview()

  // Follow surfaces — preserved from Section 01, unchanged
  const [favourites, setFavourites] = useState<Favourite[]>([])
  const [points, setPoints] = useState(0)
  const [streak, setStreak] = useState(0)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    getFavourites().then(setFavourites)
    const stats = gamificationManager.getUserStats()
    setPoints(stats.totalPoints ?? 0)
    setStreak(stats.streak ?? 0)
  }, [])

  const handleSignOut = async () => {
    triggerHaptic("medium")
    setSigningOut(true)
    await signOut()
    router.push("/")
  }

  const teamFavs        = favourites.filter(f => f.entity_type === "team")
  const playerFavs      = favourites.filter(f => f.entity_type === "player")
  const venueFavs       = favourites.filter(f => f.entity_type === "venue")
  const competitionFavs = favourites.filter(
    f => f.entity_type === "competition" || f.entity_type === "league"
  )

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <HeaderMenu />

      <main className="flex-1 p-4 space-y-4">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        {/* ── Account hub ──────────────────────────────────────────────── */}

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-16 w-full animate-pulse rounded-2xl bg-muted" />
            <div className="h-24 w-full animate-pulse rounded-2xl bg-muted" />
            <div className="h-16 w-full animate-pulse rounded-2xl bg-muted" />
          </div>
        ) : error ? (
          <AccountEmptyState mode="error" onRetry={refresh} />
        ) : profile ? (
          <>
            {/* 1. Account mode banner */}
            <AccountModeBanner
              mode={profile.mode}
              email={profile.email}
              onSignIn={isAnonymous ? () => router.push("/auth/signin") : undefined}
            />

            {/* 2. Profile summary card */}
            <ProfileSummaryCard profile={profile} />

            {/* 3. Premium summary card */}
            <PremiumSummaryCard
              tier={profile.premiumTier}
              active={profile.premiumActive}
            />

            {/* 4. Stats row (gamification — device-local, always visible) */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Teams",  value: teamFavs.length, icon: Star },
                { label: "Points", value: points,          icon: Trophy },
                { label: "Streak", value: streak,          icon: Trophy },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl border border-border bg-card p-3 text-center">
                  <Icon className="mx-auto mb-1 h-4 w-4 text-primary" />
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
                </div>
              ))}
            </div>

            {/* 5. Preferences summary (links to deeper settings) */}
            {preferences && (
              <PreferencesSummaryCard preferences={preferences} />
            )}

            {/* ── Follow surfaces — preserved from Section 01 ─────────── */}

            {teamFavs.length > 0 && (
              <FollowSection title="Followed teams" items={teamFavs} />
            )}
            {playerFavs.length > 0 && (
              <FollowSection title="Followed players" items={playerFavs} rounded />
            )}
            {venueFavs.length > 0 && (
              <FollowSection title="Saved venues" items={venueFavs} />
            )}
            {competitionFavs.length > 0 && (
              <FollowSection title="Followed competitions" items={competitionFavs} />
            )}

            {/* ── Control forms — gated by mode / security ─────────────── */}

            {/* 6. Profile edit (signed-in only) */}
            {canEditIdentity(profile) && (
              <ProfileEditForm
                profile={profile}
                onSaved={() => refresh()}
              />
            )}

            {/* 7. Password change (password login only) */}
            {canChangePassword(security) && (
              <PasswordChangeForm />
            )}

            {/* 8. Privacy / consent */}
            {consent && (
              <PrivacyConsentForm
                initial={consent}
                isAnonymous={isAnonymous}
              />
            )}

            {/* 9. Delete account */}
            {deletion && (
              <DeleteAccountPanel
                enabled={deletion.enabled}
                warningCopy={deletion.warningCopy}
              />
            )}
          </>
        ) : null}

        {/* ── Device token (always shown) ───────────────────────────────── */}
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
          <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-xs font-mono text-muted-foreground">
            Device: {deviceToken.slice(0, 16)}&hellip;
          </span>
        </div>

        {/* Sign out */}
        {isAuthenticated && (
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {signingOut ? "Signing out..." : "Sign out"}
          </Button>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

// ── Follow section component (unchanged from original) ──────────────────────

function FollowSection({
  title,
  items,
  rounded = false,
}: {
  title: string
  items: Favourite[]
  rounded?: boolean
}) {
  const visible = items.slice(0, 8)
  const overflow = items.length - visible.length

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      <div className="flex flex-wrap gap-2">
        {visible.map(f => (
          <div
            key={`${f.entity_type}:${f.entity_id}`}
            className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1"
          >
            {f.entity_logo && (
              <img
                src={f.entity_logo}
                alt=""
                className={`h-4 w-4 object-contain ${rounded ? "rounded-full object-cover" : ""}`}
              />
            )}
            <span className="text-xs font-medium">{f.entity_name ?? f.entity_id}</span>
          </div>
        ))}
        {overflow > 0 && (
          <span className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
            +{overflow} more
          </span>
        )}
      </div>
    </div>
  )
}
