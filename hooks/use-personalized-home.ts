"use client"

/**
 * hooks/use-personalized-home.ts
 *
 * Orchestration hook for the personalized home screen.
 *
 * Derives a fully scored, ranked, and module-resolved home context from
 * the user's current follow state, location consent, and timezone.
 * Components never contain scoring logic — they consume this hook.
 *
 * Architecture:
 *  - Reads follows from useFollows() (cache-seeded, server-hydrated)
 *  - Reads location consent from getSavedLocationConsent()
 *  - Derives timezone from the sf:timezone-change event + localStorage
 *  - Scores and sorts live / upcoming match data when provided
 *  - Resolves the active home module order via resolveHomeModules()
 *    (respects the existing HomeModuleEditor's localStorage order)
 *  - All scoring delegated to lib/personalization.ts scoreHomeItem()
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { useFollows } from "@/hooks/use-follows"
import { scoreHomeItem, resolveHomeModules, type HomeModuleId } from "@/lib/personalization"
import { getSavedLocationConsent } from "@/lib/personalization-prefs"
import { getDisplayTimezone } from "@/components/timezone-selector"

// ── Types ─────────────────────────────────────────────────────────────────────

export type PersonalizedHomeContext = {
  timezone: string
  locationConsent: boolean
  followedTeams: string[]
  followedCompetitions: string[]
  followedPlayers: string[]
  followedVenues: string[]
  /** Derived from followed teams' entity_meta.sport field */
  followedSports: string[]
  hiddenHomeModules: string[]
  homeModuleOrder: string[]
}

export type ScoredMatch = {
  /** Original match data — type is any because it comes from multiple APIs */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
  _score: number
  _topReason: string | null
}

export type PersonalizedHomeData = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  liveMatches?: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  upcomingMatches?: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  results?: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  news?: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  venues?: any[]
}

// ── Home module order ─────────────────────────────────────────────────────────

const HOME_MODULES_KEY = "sf_home_modules"

/**
 * Read the module order saved by the existing HomeModuleEditor.
 * Returns null when no saved order exists (use resolveHomeModules defaults).
 */
function readSavedModuleOrder(): { order: string[]; hidden: string[] } {
  try {
    const raw = localStorage.getItem(HOME_MODULES_KEY)
    if (!raw) return { order: [], hidden: [] }
    const modules: Array<{ id: string; enabled: boolean }> = JSON.parse(raw)
    return {
      order:  modules.map((m) => m.id),
      hidden: modules.filter((m) => !m.enabled).map((m) => m.id),
    }
  } catch {
    return { order: [], hidden: [] }
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePersonalizedHome(data: PersonalizedHomeData = {}) {
  const { grouped, isHydrating } = useFollows()

  const [locationConsent, setLocationConsent] = useState<boolean>(false)
  const [timezone, setTimezone] = useState<string>("UTC")
  const [moduleState, setModuleState] = useState<{ order: string[]; hidden: string[] }>(
    { order: [], hidden: [] }
  )

  // Hydrate client-only values after mount
  useEffect(() => {
    setLocationConsent(getSavedLocationConsent())
    setTimezone(getDisplayTimezone())
    setModuleState(readSavedModuleOrder())
  }, [])

  // React to location consent changes from the settings toggle
  useEffect(() => {
    const onConsent = (e: Event) => {
      setLocationConsent((e as CustomEvent<{ enabled: boolean }>).detail.enabled)
    }
    window.addEventListener("sf:location-consent-change", onConsent)
    return () => window.removeEventListener("sf:location-consent-change", onConsent)
  }, [])

  // React to timezone changes
  useEffect(() => {
    const onTz = (e: Event) => {
      setTimezone((e as CustomEvent<{ tz: string }>).detail.tz)
    }
    window.addEventListener("sf:timezone-change", onTz)
    return () => window.removeEventListener("sf:timezone-change", onTz)
  }, [])

  // React to home module editor saves
  useEffect(() => {
    const onModules = () => setModuleState(readSavedModuleOrder())
    window.addEventListener("sf:home-modules-change", onModules)
    // Storage event catches cross-tab changes
    const onStorage = (e: StorageEvent) => {
      if (e.key === HOME_MODULES_KEY) setModuleState(readSavedModuleOrder())
    }
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("sf:home-modules-change", onModules)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  // ── Derived follow lists ────────────────────────────────────────────────────

  const followedTeamIds = useMemo(
    () => grouped.teams.map((x) => x.entity_id),
    [grouped.teams]
  )

  const followedCompetitionIds = useMemo(
    () => grouped.competitions.map((x) => x.entity_id),
    [grouped.competitions]
  )

  const followedPlayerIds = useMemo(
    () => grouped.players.map((x) => x.entity_id),
    [grouped.players]
  )

  const followedVenueIds = useMemo(
    () => grouped.venues.map((x) => x.entity_id),
    [grouped.venues]
  )

  /** Infer followed sports from team entity_meta.sport */
  const followedSports = useMemo(
    () =>
      Array.from(
        new Set(
          grouped.teams
            .map((x) => (x.entity_meta as Record<string, string> | undefined)?.sport ?? "")
            .filter(Boolean)
        )
      ),
    [grouped.teams]
  )

  // ── Context object ──────────────────────────────────────────────────────────

  const context: PersonalizedHomeContext = useMemo(
    () => ({
      timezone,
      locationConsent,
      followedTeams:        followedTeamIds,
      followedCompetitions: followedCompetitionIds,
      followedPlayers:      followedPlayerIds,
      followedVenues:       followedVenueIds,
      followedSports,
      hiddenHomeModules:    moduleState.hidden,
      homeModuleOrder:      moduleState.order,
    }),
    [
      timezone,
      locationConsent,
      followedTeamIds,
      followedCompetitionIds,
      followedPlayerIds,
      followedVenueIds,
      followedSports,
      moduleState,
    ]
  )

  // ── Home module order ───────────────────────────────────────────────────────

  const activeModules: HomeModuleId[] = useMemo(
    () =>
      resolveHomeModules({
        homeModuleOrder: context.homeModuleOrder,
        hiddenHomeModules: context.hiddenHomeModules,
      }),
    [context.homeModuleOrder, context.hiddenHomeModules]
  )

  // ── Scored live matches ─────────────────────────────────────────────────────

  const scoredLive: ScoredMatch[] = useMemo(() => {
    if (!data.liveMatches?.length) return []
    return data.liveMatches
      .map((match) => {
        const { score, reasons } = scoreHomeItem({
          isLive: true,
          startsSoon: false,
          followedTeam:
            followedTeamIds.includes(match.homeTeamId ?? match.strHomeTeam) ||
            followedTeamIds.includes(match.awayTeamId ?? match.strAwayTeam),
          followedCompetition:
            followedCompetitionIds.includes(match.competitionId ?? match.idLeague),
          followedPlayer: false,
          followedVenue:  followedVenueIds.includes(match.venueId ?? match.idVenue ?? ""),
          sameSport:      followedSports.includes(match.sport ?? match.strSport ?? ""),
          nearby:         Boolean(locationConsent && match.isNearby),
          editorialBoost: Boolean(match.editorialBoost),
        })
        return {
          ...match,
          _score:     score,
          _topReason: reasons[0]?.label ?? null,
        }
      })
      .sort((a, b) => b._score - a._score)
  }, [data.liveMatches, followedTeamIds, followedCompetitionIds, followedVenueIds, followedSports, locationConsent])

  // ── Scored upcoming matches ─────────────────────────────────────────────────

  const scoredUpcoming: ScoredMatch[] = useMemo(() => {
    if (!data.upcomingMatches?.length) return []
    return data.upcomingMatches
      .map((match) => {
        const kickoffMs =
          match.kickoffTs ??
          (match.dateEvent ? new Date(`${match.dateEvent}T${match.strTime ?? "00:00"}Z`).getTime() : null)

        const startsSoon =
          typeof kickoffMs === "number"
            ? kickoffMs - Date.now() < 2 * 60 * 60 * 1000
            : false

        const { score, reasons } = scoreHomeItem({
          isLive: false,
          startsSoon,
          followedTeam:
            followedTeamIds.includes(match.homeTeamId ?? match.strHomeTeam) ||
            followedTeamIds.includes(match.awayTeamId ?? match.strAwayTeam),
          followedCompetition:
            followedCompetitionIds.includes(match.competitionId ?? match.idLeague),
          followedPlayer: false,
          followedVenue:  followedVenueIds.includes(match.venueId ?? match.idVenue ?? ""),
          sameSport:      followedSports.includes(match.sport ?? match.strSport ?? ""),
          nearby:         Boolean(locationConsent && match.isNearby),
          editorialBoost: Boolean(match.editorialBoost),
        })
        return {
          ...match,
          _score:     score,
          _topReason: reasons[0]?.label ?? null,
        }
      })
      .sort((a, b) => b._score - a._score)
  }, [data.upcomingMatches, followedTeamIds, followedCompetitionIds, followedVenueIds, followedSports, locationConsent])

  // ── Followed venue cards ────────────────────────────────────────────────────

  const followedVenueCards = useMemo(
    () =>
      (data.venues ?? []).filter((v) =>
        followedVenueIds.includes(v.id ?? v.slug ?? v.entity_id ?? "")
      ),
    [data.venues, followedVenueIds]
  )

  // ── Has follows flag ────────────────────────────────────────────────────────

  const hasAnyFollows = useMemo(
    () =>
      followedTeamIds.length > 0 ||
      followedCompetitionIds.length > 0 ||
      followedPlayerIds.length > 0 ||
      followedVenueIds.length > 0,
    [followedTeamIds, followedCompetitionIds, followedPlayerIds, followedVenueIds]
  )

  return {
    /** Full context for downstream components that need raw follow lists */
    context,
    /** Resolved ordered module IDs respecting the HomeModuleEditor config */
    activeModules,
    /** Live matches scored + sorted by personalization weight */
    scoredLive,
    /** Upcoming matches scored + sorted by personalization weight */
    scoredUpcoming,
    /** Followed venue objects filtered from the venues data prop */
    followedVenueCards,
    /** True while follow state is being hydrated from the server */
    isHydrating,
    /** True if the user follows anything — used for onboarding nudges */
    hasAnyFollows,
  }
}
