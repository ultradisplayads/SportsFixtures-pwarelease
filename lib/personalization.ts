/**
 * lib/personalization.ts
 *
 * Central personalization engine for SportsFixtures PWA.
 * All scoring, ranking, type definitions, and calendar/home helpers live here.
 * Components consume this module — they must not contain scoring logic directly.
 */

// ── Shared types ──────────────────────────────────────────────────────────────

export type EntityType =
  | "team"
  | "competition"
  | "league"
  | "player"
  | "venue"

export type UserPreferenceProfile = {
  timezone: string
  locationConsent: boolean
  followedSports: string[]
  followedTeams: string[]
  followedCompetitions: string[]
  followedPlayers: string[]
  followedVenues: string[]
  preferredHomeModules: string[]
  hiddenHomeModules: string[]
  homeModuleOrder?: string[]
  calendarMode?: "my-calendar" | "all-fixtures"
  updatedAt?: string
}

export type FollowRecord = {
  entity_type: EntityType
  entity_id: string
  entity_name?: string
  entity_meta?: Record<string, any>
}

export type RecommendationReason = {
  label: string
  weight: number
}

// ── Scoring input / output types ──────────────────────────────────────────────

export type ScoringInput = {
  isLive?: boolean
  startsSoon?: boolean
  followedTeam?: boolean
  followedCompetition?: boolean
  followedPlayer?: boolean
  followedVenue?: boolean
  sameSport?: boolean
  nearby?: boolean
  editorialBoost?: boolean
}

export type ScoreResult = {
  score: number
  reasons: RecommendationReason[]
}

// ── scoreHomeItem — core match/event scoring ──────────────────────────────────

export function scoreHomeItem(input: ScoringInput): ScoreResult {
  let score = 0
  const reasons: RecommendationReason[] = []

  if (input.isLive) {
    score += 50
    reasons.push({ label: "Live now", weight: 50 })
  }

  if (input.startsSoon) {
    score += 20
    reasons.push({ label: "Starting soon", weight: 20 })
  }

  if (input.followedTeam) {
    score += 40
    reasons.push({ label: "Because you follow this team", weight: 40 })
  }

  if (input.followedCompetition) {
    score += 25
    reasons.push({ label: "Because you follow this competition", weight: 25 })
  }

  if (input.followedPlayer) {
    score += 18
    reasons.push({ label: "Because you follow a player involved", weight: 18 })
  }

  if (input.followedVenue) {
    score += 15
    reasons.push({ label: "At a venue you follow", weight: 15 })
  }

  if (input.sameSport) {
    score += 10
    reasons.push({ label: "Matches your sport interests", weight: 10 })
  }

  if (input.nearby) {
    score += 8
    reasons.push({ label: "Near you", weight: 8 })
  }

  if (input.editorialBoost) {
    score += 5
    // editorial boost is silent — no badge
  }

  return { score, reasons: reasons.sort((a, b) => b.weight - a.weight) }
}

export function topReason(reasons: RecommendationReason[]): string | null {
  return reasons[0]?.label ?? null
}

// ── buildRecommendationReason — single-label builder for cards ────────────────

export type RecommendationContext = {
  followedTeamName?: string
  followedCompetitionName?: string
  followedPlayerName?: string
  followedVenueName?: string
  nearby?: boolean
  startsSoon?: boolean
  isLive?: boolean
}

export function buildRecommendationReason(
  _match: unknown,
  context: RecommendationContext
): string | null {
  if (context.isLive) return "Live now"
  if (context.followedTeamName) return `Because you follow ${context.followedTeamName}`
  if (context.followedCompetitionName) return `Because you follow ${context.followedCompetitionName}`
  if (context.followedPlayerName) return `Because you follow ${context.followedPlayerName}`
  if (context.followedVenueName) return `At a venue you follow`
  if (context.nearby) return `Near you tonight`
  if (context.startsSoon) return `Starting soon`
  return null
}

// ── scoreArticle — news feed ranking ─────────────────────────────────────────

export type ArticleFollowContext = {
  teams: string[]
  competitions: string[]
  players: string[]
  sports: string[]
}

export function scoreArticle(
  article: {
    title?: string
    description?: string
    excerpt?: string
    category?: string
    tags?: string[]
    isBreaking?: boolean
    publishedAt?: string
    sport?: { name?: string; strSport?: string }
  },
  follows: ArticleFollowContext
): number {
  const haystack = [
    article.title,
    article.description,
    article.excerpt,
    article.category,
    article.tags?.join(" "),
    article.sport?.name,
    article.sport?.strSport,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  let score = 0

  if (follows.teams.some((name) => haystack.includes(name.toLowerCase()))) score += 60
  if (follows.players.some((name) => haystack.includes(name.toLowerCase()))) score += 45
  if (follows.competitions.some((name) => haystack.includes(name.toLowerCase()))) score += 35
  if (follows.sports.some((name) => haystack.includes(name.toLowerCase()))) score += 20
  if (article.isBreaking) score += 20

  const ageHours = Math.max(
    1,
    (Date.now() - new Date(article.publishedAt ?? 0).getTime()) / 3_600_000
  )
  score += Math.max(0, 24 - ageHours)

  return score
}

// ── Calendar helpers ──────────────────────────────────────────────────────────

const CALENDAR_MODE_KEY = "sf_calendar_mode"
export type CalendarMode = "my-calendar" | "all-fixtures"

export function getSavedCalendarMode(): CalendarMode {
  if (typeof window === "undefined") return "my-calendar"
  const value = localStorage.getItem(CALENDAR_MODE_KEY)
  return value === "all-fixtures" ? "all-fixtures" : "my-calendar"
}

export function saveCalendarMode(mode: CalendarMode): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CALENDAR_MODE_KEY, mode)
}

// ── Home module resolver ──────────────────────────────────────────────────────

export type HomeModuleId =
  | "live-now"
  | "upcoming-followed"
  | "results-followed"
  | "recommended-matches"
  | "personalized-news"
  | "nearby-venues"
  | "followed-venues"
  | "quick-access"

const DEFAULT_MODULE_ORDER: HomeModuleId[] = [
  "live-now",
  "upcoming-followed",
  "recommended-matches",
  "personalized-news",
  "nearby-venues",
  "quick-access",
]

export function resolveHomeModules(
  profile: Pick<UserPreferenceProfile, "homeModuleOrder" | "hiddenHomeModules">
): HomeModuleId[] {
  const base = (profile.homeModuleOrder?.length
    ? profile.homeModuleOrder
    : DEFAULT_MODULE_ORDER) as HomeModuleId[]

  const hidden = new Set(profile.hiddenHomeModules ?? [])
  return base.filter((id) => !hidden.has(id))
}

// ── Timezone formatting helper ────────────────────────────────────────────────

export function formatInUserTimezone(
  value: string | number | Date,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const baseOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  }
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      ...baseOptions,
    }).format(new Date(value))
  } catch {
    return new Intl.DateTimeFormat("en-GB", baseOptions).format(new Date(value))
  }
}
