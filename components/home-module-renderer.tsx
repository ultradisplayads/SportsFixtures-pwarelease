"use client"

// components/home-module-renderer.tsx
// Section 12 — Homepage module order and visibility is now operator-controlled
// via the control plane. Module keys map to HomepageModuleConfig.key in
// types/control-plane.ts. Operators can reorder, disable, or title-override
// modules without any code changes.
//
// Section 14 — Tournament hero is injected at the top when tournament mode
// is active and homepageBoost is enabled. It sits above the operator-ordered
// modules and disappears cleanly when tournament mode is off.

import { useHomeModuleManager } from "@/hooks/use-home-module-manager"
import { usePersonalizedHome } from "@/hooks/use-personalized-home"
import { useControlPlane } from "@/hooks/use-control-plane"
import { useTournamentMode } from "@/hooks/use-tournament-mode"
import { HomeModuleShell } from "@/components/home/home-module-shell"
import { RecommendedMatches } from "@/components/recommended-matches"
import { PersonalizedCalendar } from "@/components/personalized-calendar"
import { WatchHereHomeModule } from "@/components/home/watch-here-home-module"
import { GeoAdCard } from "@/components/geo-ad-card"
import { AdInjectionRow } from "@/components/ad-injection"
import { FixturesList } from "@/components/fixtures-list"
import { HomepageNewsSection } from "@/components/home/homepage-news-section"
import { Leaderboard } from "@/components/leaderboard"
import { SportsSelector } from "@/components/sports-selector"
import { CountriesSelector } from "@/components/countries-selector"
import { LeaguesSelector } from "@/components/leagues-selector"
import { TournamentHero } from "@/components/tournament/tournament-hero"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import type { HomepageModuleConfig } from "@/types/control-plane"

// Selectors sit above FixturesList — rendered inline as part of the fixtures module
function FixturesModule() {
  return (
    <>
      <div className="border-b border-border bg-background">
        <SportsSelector />
        <CountriesSelector />
        <LeaguesSelector />
      </div>
      <FixturesList />
    </>
  )
}

function PersonalizationNudge() {
  return (
    <div className="mx-3 mt-3 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
      <Sparkles className="h-5 w-5 shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Personalise your home</p>
        <p className="text-xs text-muted-foreground">
          Follow teams, players, and competitions to see ranked results.
        </p>
      </div>
      <Link
        href="/onboarding/follow-teams"
        className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Set up
      </Link>
    </div>
  )
}

// ── Module shell title / action config ────────────────────────────────────────
// Modules that own their own internal header (news, venues, fixtures) get
// title=undefined so the shell only provides the id anchor and border separator.
// Modules without an internal header (calendar, leaderboard) get a default title
// that the CP can override via titleOverride.

type ModuleShellConfig = {
  title?: string
  actionLabel?: string
  actionHref?: string
}

function getShellConfig(key: string, titleOverride?: string | null): ModuleShellConfig {
  switch (key) {
    case "calendar":
      return {
        title: titleOverride ?? "My Calendar",
        actionLabel: "View all",
        actionHref: "/calendar",
      }
    case "leaderboard":
      return { title: titleOverride ?? "Leaderboard" }
    // These modules render their own header — shell provides only the id anchor
    case "recommended":
    case "venues":
    case "fixtures":
    case "news":
    default:
      return {}
  }
}

/**
 * Returns the raw module content for a given key.
 * Returns null for unknown keys — operators cannot inject arbitrary content.
 */
function renderModuleContent(m: HomepageModuleConfig): React.ReactNode {
  switch (m.key) {
    case "recommended": return <RecommendedMatches />
    case "calendar":    return <div className="px-3 pb-3"><PersonalizedCalendar /></div>
    case "venues":      return <WatchHereHomeModule />
    case "fixtures":    return <FixturesModule />
    case "news":        return <HomepageNewsSection titleOverride={m.titleOverride} />
    case "leaderboard": return <Leaderboard />
    default:            return null
  }
}

export function HomeModuleRenderer() {
  // Section 07.B/E — useHomeModuleManager is the single authority for user prefs.
  // It shares the sf_home_modules storage key with the settings/home-layout page.
  const { disabledKeys } = useHomeModuleManager()

  // Personalization context
  const { hasAnyFollows, isHydrating } = usePersonalizedHome()

  // Operator-controlled module config from the control plane.
  // enabledModules is sorted by position and filtered to enabled only.
  // Falls back to DEFAULT_HOMEPAGE_MODULES when the control plane is unavailable.
  const { enabledModules: cpModules } = useControlPlane()

  // Section 14 — Tournament mode surface decisions.
  // Surface decisions are the authority — components must not re-derive from state.
  const { state: tournamentState, surface: tournamentSurface } = useTournamentMode()

  // Reconcile: control-plane ordering + visibility is authoritative.
  // User can additionally hide modules via local prefs (disabledKeys).
  const modulesToRender = cpModules.filter((m) => !disabledKeys.has(m.key))

  return (
    <>
      {/* Section 14 — Tournament hero sits above all operator-ordered modules.
          Renders only when heroVisible=true. Disappears cleanly when mode is off. */}
      {tournamentSurface.heroVisible && (
        <TournamentHero state={tournamentState} surface={tournamentSurface} />
      )}

      {!isHydrating && !hasAnyFollows && <PersonalizationNudge />}

      {modulesToRender.map((m, moduleIndex) => {
        const content = renderModuleContent(m)
        if (!content) return null
        const shellConfig = getShellConfig(m.key, m.titleOverride)
        return (
          <div key={m.key}>
            {/* Ad injected before every 6th module for free-tier users */}
            <AdInjectionRow groupIndex={moduleIndex} every={6} placement="home" />
            <HomeModuleShell
              moduleKey={m.key}
              title={shellConfig.title}
              actionLabel={shellConfig.actionLabel}
              actionHref={shellConfig.actionHref}
            >
              {content}
            </HomeModuleShell>
          </div>
        )
      })}

      {/* Geo ad always last — not operator-reorderable */}
      <GeoAdCard />
    </>
  )
}
