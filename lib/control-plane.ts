// lib/control-plane.ts
// Section 12 — Control-Plane Service Layer
//
// All helpers in this file:
//   - validate operator input and resolve safe defaults
//   - never throw on bad config
//   - never allow bad config to crash the frontend
//
// The control plane is not magic: it must still reconcile with real data
// and coverage truth. These helpers enforce that contract.

import type {
  ControlPlaneSnapshot,
  HomepageModuleConfig,
  TickerControlDto,
  TournamentModeDto,
  CommercialSlotConfig,
  VenueBoostRule,
  FeatureFlagDto,
} from "@/types/control-plane"
import type { TickerConfig } from "@/types/ticker"

// ── Safe Defaults ─────────────────────────────────────────────────────────────

/**
 * The safe default ticker config used when the control plane is unavailable
 * or returns a malformed TickerControlDto. Matches DEFAULT_TICKER_CONFIG from
 * types/ticker.ts so both paths produce identical behavior.
 */
export const DEFAULT_TICKER_CONTROL: TickerControlDto = {
  mode: "dual",
  primaryEnabled: true,
  secondaryEnabled: true,
  includeLiveScores: true,
  includeBreakingNews: true,
  includeTvNow: true,
  includePromos: false,
  includeVenueMessages: false,
  includeSponsors: false,
  maxPrimaryItems: 20,
  maxSecondaryItems: 10,
  allowedSports: [],
  refreshSeconds: 30,
  emptyMode: "fallback_real",
}

/**
 * Default homepage module order and visibility.
 * Matches the hardcoded order previously in home-module-renderer.tsx.
 * Used when the control plane is unavailable.
 */
export const DEFAULT_HOMEPAGE_MODULES: HomepageModuleConfig[] = [
  { key: "recommended", enabled: true,  position: 0, audience: "all" },
  { key: "fixtures",    enabled: true,  position: 1, audience: "all" },
  { key: "venues",      enabled: true,  position: 2, audience: "all" },
  { key: "calendar",    enabled: true,  position: 3, audience: "all" },
  { key: "news",        enabled: true,  position: 4, audience: "all" },
  { key: "leaderboard", enabled: true,  position: 5, audience: "all" },
]

export const DEFAULT_TOURNAMENT_MODE: TournamentModeDto = {
  enabled: false,
  type: null,
  mode: "off",
  heroEnabled: false,
  navEnabled: false,
  tickerBoostEnabled: false,
  homepageModuleEnabled: false,
  venueBoostEnabled: false,
  featuredCompetitionIds: [],
}

export const EMPTY_SNAPSHOT: ControlPlaneSnapshot = {
  homepageModules: DEFAULT_HOMEPAGE_MODULES,
  ticker: DEFAULT_TICKER_CONTROL,
  tournamentMode: DEFAULT_TOURNAMENT_MODE,
  featureFlags: [],
  commercialSlots: [],
  venueBoosts: [],
  generatedAt: null,
}

// ── Validation Helpers ────────────────────────────────────────────────────────

/**
 * Clamps a refresh interval to sane bounds (10s minimum, 3600s maximum).
 * Operator mistakes (negative, NaN, absurdly high) must not break the app.
 */
export function clampRefreshSeconds(
  value: number | null | undefined,
  fallback = 30,
): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback
  return Math.min(Math.max(value, 10), 3600)
}

/**
 * Validates and normalizes a TickerControlDto from raw operator input.
 * Fills in any missing or invalid fields with safe defaults.
 */
export function validateTickerControl(
  raw: Partial<TickerControlDto> | null | undefined,
): TickerControlDto {
  if (!raw) return DEFAULT_TICKER_CONTROL
  const mode = (["off", "single", "dual"] as const).includes(raw.mode as any)
    ? (raw.mode as TickerControlDto["mode"])
    : DEFAULT_TICKER_CONTROL.mode
  const emptyMode = (["hide", "show_message", "fallback_real"] as const).includes(raw.emptyMode as any)
    ? (raw.emptyMode as TickerControlDto["emptyMode"])
    : DEFAULT_TICKER_CONTROL.emptyMode

  return {
    mode,
    primaryEnabled:      raw.primaryEnabled      ?? DEFAULT_TICKER_CONTROL.primaryEnabled,
    secondaryEnabled:    raw.secondaryEnabled     ?? DEFAULT_TICKER_CONTROL.secondaryEnabled,
    includeLiveScores:   raw.includeLiveScores    ?? DEFAULT_TICKER_CONTROL.includeLiveScores,
    includeBreakingNews: raw.includeBreakingNews  ?? DEFAULT_TICKER_CONTROL.includeBreakingNews,
    includeTvNow:        raw.includeTvNow         ?? DEFAULT_TICKER_CONTROL.includeTvNow,
    includePromos:       raw.includePromos        ?? DEFAULT_TICKER_CONTROL.includePromos,
    includeVenueMessages:raw.includeVenueMessages ?? DEFAULT_TICKER_CONTROL.includeVenueMessages,
    includeSponsors:     raw.includeSponsors      ?? DEFAULT_TICKER_CONTROL.includeSponsors,
    maxPrimaryItems:     typeof raw.maxPrimaryItems   === "number" && raw.maxPrimaryItems   > 0 ? raw.maxPrimaryItems   : DEFAULT_TICKER_CONTROL.maxPrimaryItems,
    maxSecondaryItems:   typeof raw.maxSecondaryItems === "number" && raw.maxSecondaryItems > 0 ? raw.maxSecondaryItems : DEFAULT_TICKER_CONTROL.maxSecondaryItems,
    allowedSports:       Array.isArray(raw.allowedSports) ? raw.allowedSports.filter((s) => typeof s === "string") : [],
    refreshSeconds:      clampRefreshSeconds(raw.refreshSeconds, DEFAULT_TICKER_CONTROL.refreshSeconds),
    emptyMode,
  }
}

/**
 * Converts a validated TickerControlDto to TickerConfig (types/ticker.ts).
 * These types are structurally aligned — this is a direct mapping.
 */
export function tickerControlDtoToConfig(dto: TickerControlDto): TickerConfig {
  return {
    mode: dto.mode,
    primaryEnabled: dto.primaryEnabled,
    secondaryEnabled: dto.secondaryEnabled,
    includeLiveScores: dto.includeLiveScores,
    includeBreakingNews: dto.includeBreakingNews,
    includeTvNow: dto.includeTvNow,
    includePromos: dto.includePromos,
    includeVenueMessages: dto.includeVenueMessages,
    includeSponsors: dto.includeSponsors,
    maxPrimaryItems: dto.maxPrimaryItems,
    maxSecondaryItems: dto.maxSecondaryItems,
    allowedSports: dto.allowedSports.length > 0 ? dto.allowedSports : undefined,
    refreshSeconds: dto.refreshSeconds,
    emptyMode: dto.emptyMode,
  }
}

// ── Homepage Module Helpers ───────────────────────────────────────────────────

/**
 * Returns enabled homepage modules sorted by position.
 * Handles duplicate positions by stable sort (original array order as tiebreak).
 * Safe-defaults to DEFAULT_HOMEPAGE_MODULES if input is null/undefined/empty.
 */
export function getEnabledHomepageModules(
  modules: HomepageModuleConfig[] | null | undefined,
): HomepageModuleConfig[] {
  const src = modules && modules.length > 0 ? modules : DEFAULT_HOMEPAGE_MODULES
  return [...src]
    .filter((m) => m.enabled)
    .sort((a, b) => a.position - b.position)
}

/**
 * Finds the config for a specific module key.
 * Returns null if not found or disabled.
 */
export function getModuleConfig(
  modules: HomepageModuleConfig[] | null | undefined,
  key: string,
): HomepageModuleConfig | null {
  const src = modules && modules.length > 0 ? modules : DEFAULT_HOMEPAGE_MODULES
  return src.find((m) => m.key === key && m.enabled) ?? null
}

// ── Commercial Slot Helpers ───────────────────────────────────────────────────

/**
 * Returns enabled commercial slot configs for a given slot type, sorted by position.
 * Handles null/empty input safely.
 */
export function getEnabledCommercialSlots(
  slots: CommercialSlotConfig[] | null | undefined,
  slotType?: CommercialSlotConfig["slotType"],
): CommercialSlotConfig[] {
  if (!slots) return []
  const filtered = slots.filter(
    (s) => s.enabled && (!slotType || s.slotType === slotType),
  )
  return filtered.sort((a, b) => (a.position ?? 999) - (b.position ?? 999))
}

/**
 * Returns true if a slot key is enabled in the control plane.
 * Commercial slots disabled here must be suppressed — not just hidden.
 */
export function isCommercialSlotEnabled(
  slots: CommercialSlotConfig[] | null | undefined,
  key: string,
): boolean {
  if (!slots) return false
  return slots.some((s) => s.key === key && s.enabled)
}

// ── Venue Boost Helpers ───────────────────────────────────────────────────────

/**
 * Returns the boost score delta (additive) for a venue given the current
 * event/competition/sport context. Returns 0 if no applicable rule is found.
 *
 * Boosts are additive and must not replace organic scoring.
 * The venue-discovery scoreVenueCard() call applies boost as editorialBoost=true
 * and sponsored=true flags, not by inflating raw scores directly.
 */
export function getVenueBoostScore(
  boosts: VenueBoostRule[] | null | undefined,
  venueId: string,
  ctx: {
    sport?: string | null
    competitionId?: string | null
    eventId?: string | null
  } = {},
): { boosted: boolean; sponsorDisclosure: boolean } {
  if (!boosts || !venueId) return { boosted: false, sponsorDisclosure: false }

  const applicableRules = boosts.filter((rule) => {
    if (!rule.enabled || rule.venueId !== venueId) return false
    switch (rule.scope) {
      case "global": return true
      case "sport": return !!ctx.sport && rule.sport?.toLowerCase() === ctx.sport.toLowerCase()
      case "competition": return !!ctx.competitionId && rule.competitionId === ctx.competitionId
      case "event": return !!ctx.eventId && rule.eventId === ctx.eventId
      default: return false
    }
  })

  if (applicableRules.length === 0) return { boosted: false, sponsorDisclosure: false }

  return {
    boosted: true,
    sponsorDisclosure: applicableRules.some((r) => r.sponsorDisclosure === true),
  }
}

// ── Tournament Mode Helpers ───────────────────────────────────────────────────

/**
 * Returns a safe, validated tournament mode DTO.
 * When tournament mode is disabled, returns DEFAULT_TOURNAMENT_MODE.
 */
export function resolveTournamentMode(
  raw: TournamentModeDto | null | undefined,
): TournamentModeDto {
  if (!raw || !raw.enabled) return DEFAULT_TOURNAMENT_MODE
  return {
    ...DEFAULT_TOURNAMENT_MODE,
    ...raw,
    featuredCompetitionIds: Array.isArray(raw.featuredCompetitionIds)
      ? raw.featuredCompetitionIds.filter((id) => typeof id === "string" && id.length > 0)
      : [],
  }
}

/**
 * Returns true if the tournament mode is active with a specific mode value.
 */
export function isTournamentModeActive(
  tm: TournamentModeDto | null | undefined,
  mode?: TournamentModeDto["mode"],
): boolean {
  if (!tm?.enabled) return false
  if (mode) return tm.mode === mode
  return tm.mode !== "off" && tm.mode != null
}

// ── Snapshot Validation ───────────────────────────────────────────────────────

/**
 * Validates an entire ControlPlaneSnapshot from raw Strapi/API data.
 * Any missing or invalid section is replaced with a safe default.
 * This is the single entry point for all control-plane data before it reaches
 * the frontend or any service layer consumer.
 */
export function validateSnapshot(raw: any): ControlPlaneSnapshot {
  if (!raw || typeof raw !== "object") return EMPTY_SNAPSHOT

  const homepageModules: HomepageModuleConfig[] = Array.isArray(raw.homepageModules)
    ? raw.homepageModules
        .filter((m: any) => m && typeof m.key === "string")
        .map((m: any): HomepageModuleConfig => ({
          key: String(m.key),
          enabled: typeof m.enabled === "boolean" ? m.enabled : true,
          position: typeof m.position === "number" ? m.position : 99,
          titleOverride: typeof m.titleOverride === "string" ? m.titleOverride : null,
          limit: typeof m.limit === "number" ? m.limit : null,
          audience: (["all", "free", "premium"] as const).includes(m.audience)
            ? m.audience
            : "all",
        }))
    : DEFAULT_HOMEPAGE_MODULES

  const ticker = validateTickerControl(raw.ticker)

  const featureFlags: FeatureFlagDto[] = Array.isArray(raw.featureFlags)
    ? raw.featureFlags.filter((f: any) => f && typeof f.key === "string")
    : []

  const commercialSlots: CommercialSlotConfig[] = Array.isArray(raw.commercialSlots)
    ? raw.commercialSlots.filter((s: any) => s && typeof s.key === "string")
    : []

  const venueBoosts: VenueBoostRule[] = Array.isArray(raw.venueBoosts)
    ? raw.venueBoosts.filter((b: any) => b && typeof b.venueId === "string")
    : []

  const tournamentMode = resolveTournamentMode(raw.tournamentMode)

  return {
    homepageModules,
    ticker,
    tournamentMode,
    featureFlags,
    commercialSlots,
    venueBoosts,
    generatedAt: typeof raw.generatedAt === "string" ? raw.generatedAt : new Date().toISOString(),
  }
}

// ── Strapi Bridge ─────────────────────────────────────────────────────────────

const SF_API_URL = (process.env.SF_API_URL ?? "https://staging-api.sportsfixtures.net")
  .replace(/\/api-docs\/?$/, "")
  .replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN ?? ""

/**
 * Fetches the control-plane snapshot from the SF Strapi backend.
 * Returns EMPTY_SNAPSHOT on any error — the frontend must always have
 * a coherent fallback rather than an undefined/null state.
 *
 * Future: this function should merge data from multiple Strapi
 * content types (app-config, feature-flags, venue-boosts, etc.).
 * Today it reads from /api/app-config as a single document.
 */
export async function fetchControlPlaneSnapshot(): Promise<ControlPlaneSnapshot> {
  if (!SF_API_URL) return EMPTY_SNAPSHOT

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(`${SF_API_URL}/api/app-config?populate=*`, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
      },
    })
    clearTimeout(timeout)

    if (!res.ok) return EMPTY_SNAPSHOT

    const json = await res.json()
    // Strapi single-type: data is at json.data.attributes or json.data
    const raw = json?.data?.attributes ?? json?.data ?? json
    return validateSnapshot(raw)
  } catch {
    return EMPTY_SNAPSHOT
  }
}
