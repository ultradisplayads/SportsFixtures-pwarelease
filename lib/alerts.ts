// ─────────────────────────────────────────────────────────────────────────────
// Section 02 — Core alert taxonomy, tiering, reminder ladders, deep-link helpers
// ─────────────────────────────────────────────────────────────────────────────
import type {
  AlertCategory,
  NotificationItem,
  NotificationTier,
  ReminderOffset,
  NotificationPreferenceProfile,
} from "@/types/notifications"

// ── Reminder ladder ───────────────────────────────────────────────────────────

export const REMINDER_OPTIONS: ReminderOffset[] = [
  "24h",
  "12h",
  "3h",
  "1h",
  "30m",
  "15m",
  "5m",
]

export const DEFAULT_REMINDER_OFFSETS: ReminderOffset[] = ["1h", "15m"]

export const REMINDER_LABELS: Record<ReminderOffset, string> = {
  "24h": "24 hours before",
  "12h": "12 hours before",
  "3h":  "3 hours before",
  "1h":  "1 hour before",
  "30m": "30 minutes before",
  "15m": "15 minutes before",
  "5m":  "5 minutes before",
}

export function reminderOffsetToMs(offset: ReminderOffset): number {
  switch (offset) {
    case "24h": return 24 * 60 * 60 * 1000
    case "12h": return 12 * 60 * 60 * 1000
    case "3h":  return  3 * 60 * 60 * 1000
    case "1h":  return      60 * 60 * 1000
    case "30m": return      30 * 60 * 1000
    case "15m": return      15 * 60 * 1000
    case "5m":  return       5 * 60 * 1000
  }
}

// ── Tier taxonomy ─────────────────────────────────────────────────────────────

/**
 * Tier 1 — critical/immediate: goals, red cards, full time, breaking news
 * Tier 2 — important: kickoff, lineups, half time, extra time, penalties, postponed/cancelled
 * Tier 3 — low urgency/commercial: match reminders, venue offers, transfer news
 */
export function categoryToTier(category: AlertCategory): NotificationTier {
  switch (category) {
    case "goal":
    case "red_card":
    case "full_time":
    case "breaking_news":
      return "tier1"
    case "kickoff":
    case "lineups":
    case "half_time":
    case "extra_time":
    case "penalties":
    case "postponed":
    case "cancelled":
      return "tier2"
    case "match_reminder":
    case "venue_offer":
    case "transfer_news":
    default:
      return "tier3"
  }
}

export const CATEGORY_LABELS: Record<AlertCategory, string> = {
  match_reminder: "Match Reminder",
  kickoff:        "Kick-off",
  lineups:        "Lineups",
  goal:           "Goal",
  red_card:       "Red Card",
  half_time:      "Half Time",
  extra_time:     "Extra Time",
  penalties:      "Penalties",
  full_time:      "Full Time",
  postponed:      "Postponed",
  cancelled:      "Cancelled",
  venue_offer:    "Venue Offer",
  breaking_news:  "Breaking News",
  transfer_news:  "Transfer News",
}

export const TIER_LABELS: Record<NotificationTier, string> = {
  tier1: "Tier 1 — Critical (goals, final score, breaking news)",
  tier2: "Tier 2 — Important (kick-off, lineups, half time)",
  tier3: "Tier 3 — Low priority (reminders, offers, transfers)",
}

// Categories that are commercial / must be explicitly opted-in
export const COMMERCIAL_CATEGORIES: AlertCategory[] = ["venue_offer", "transfer_news"]

// Default enabled categories
export const DEFAULT_ENABLED_CATEGORIES: AlertCategory[] = [
  "match_reminder",
  "kickoff",
  "goal",
  "full_time",
]

// ── Deep-link builder ─────────────────────────────────────────────────────────

export function buildNotificationUrl(input: {
  category: AlertCategory
  eventId?: string
  teamId?: string
  competitionId?: string
  venueId?: string
  articleId?: string
  articleSlug?: string
}): string {
  if (input.articleSlug) return `/news/${input.articleSlug}`
  if (input.articleId)   return `/news/${input.articleId}`
  if (input.eventId)     return `/match/${input.eventId}`
  if (input.venueId)     return `/venues/${input.venueId}`
  if (input.teamId)      return `/teams/${input.teamId}`
  if (input.competitionId) return `/competitions/${input.competitionId}`
  return "/notifications"
}

// ── Reason label ──────────────────────────────────────────────────────────────

export function buildReasonLabel(input: {
  followedTeamName?: string
  followedCompetitionName?: string
  followedPlayerName?: string
  followedVenueName?: string
  breaking?: boolean
}): string | null {
  if (input.breaking) return "Breaking news"
  if (input.followedTeamName) return `Because you follow ${input.followedTeamName}`
  if (input.followedCompetitionName) return `Because you follow ${input.followedCompetitionName}`
  if (input.followedPlayerName) return `Because you follow ${input.followedPlayerName}`
  if (input.followedVenueName) return `At a venue you follow`
  return null
}

// ── Quiet hours ───────────────────────────────────────────────────────────────

export function isWithinQuietHours(
  now: Date,
  timezone: string,
  start?: string,
  end?: string,
): boolean {
  if (!start || !end) return false

  const formatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  })

  const [hour, minute] = formatter.format(now).split(":").map(Number)
  const currentMinutes = hour * 60 + minute

  const [startH, startM] = start.split(":").map(Number)
  const [endH, endM] = end.split(":").map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  }
  // spans midnight
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes
}

// ── Delivery gate — canonical single entry-point for all delivery paths ──────
//
// Used by: cron routes, push send routes, in-app notification manager.
// No delivery path should invent its own rules — use this function.
//
// Tier 1 breaks through quiet hours by explicit product decision.
// That is the documented exception; it is not accidental.

export type DeliveryGateInput = {
  category: AlertCategory
  globalMute: boolean
  inAppEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
  timezone: string
  tierEnabled: Record<NotificationTier, boolean>
  disabledCategories: AlertCategory[]
  enabledCategories: AlertCategory[]
  allowBreakingNews: boolean
  allowVenueOffers: boolean
  allowTransferNews: boolean
  now?: Date
}

export function shouldDeliverNotification(input: DeliveryGateInput): boolean {
  const tier = categoryToTier(input.category)

  if (input.globalMute) return false
  if (!input.inAppEnabled) return false
  if (!input.tierEnabled[tier]) return false

  if (input.disabledCategories.includes(input.category)) return false
  if (
    input.enabledCategories.length > 0 &&
    !input.enabledCategories.includes(input.category)
  ) return false

  if (input.category === "breaking_news" && !input.allowBreakingNews) return false
  if (input.category === "venue_offer"   && !input.allowVenueOffers)  return false
  if (input.category === "transfer_news" && !input.allowTransferNews) return false

  if (input.quietHoursEnabled) {
    const inQuiet = isWithinQuietHours(
      input.now ?? new Date(),
      input.timezone,
      input.quietHoursStart,
      input.quietHoursEnd,
    )
    if (inQuiet) {
      // Tier 1 breaks through quiet hours — this is an explicit product decision.
      // All other tiers are suppressed.
      if (tier !== "tier1") return false
    }
  }

  return true
}

/**
 * shouldDeliverNotificationFromProfile — convenience wrapper for code that
 * still holds a NotificationPreferenceProfile (camelCase shape).
 * Delegates to shouldDeliverNotification.
 */
export function shouldDeliverNotificationFromProfile(
  category: AlertCategory,
  prefs: NotificationPreferenceProfile,
  now?: Date,
): boolean {
  return shouldDeliverNotification({
    category,
    globalMute:         prefs.globalMute,
    inAppEnabled:       prefs.inAppEnabled,
    quietHoursEnabled:  prefs.quietHoursEnabled,
    quietHoursStart:    prefs.quietHoursStart,
    quietHoursEnd:      prefs.quietHoursEnd,
    timezone:           prefs.timezone,
    tierEnabled:        prefs.tierEnabled,
    disabledCategories: prefs.disabledCategories,
    enabledCategories:  prefs.enabledCategories,
    allowBreakingNews:  prefs.allowBreakingNews,
    allowVenueOffers:   prefs.allowVenueOffers,
    allowTransferNews:  prefs.allowTransferNews,
    now,
  })
}

// ── Default preference profile ────────────────────────────────────────────────

export function buildDefaultNotificationPrefs(timezone?: string): NotificationPreferenceProfile {
  return {
    pushEnabled: false,
    inAppEnabled: true,
    globalMute: false,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    defaultReminderOffsets: DEFAULT_REMINDER_OFFSETS,
    enabledCategories: DEFAULT_ENABLED_CATEGORIES,
    disabledCategories: [],
    tierEnabled: { tier1: true, tier2: true, tier3: false },
    allowBreakingNews: false,
    allowVenueOffers: false,
    allowTransferNews: false,
  }
}

// ── Notification item helpers ─────────────────────────────────────────────────

export function sortNotificationsNewestFirst(items: NotificationItem[]): NotificationItem[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function formatNotificationAge(createdAt: string): string {
  const elapsed = Date.now() - new Date(createdAt).getTime()
  const minutes = Math.floor(elapsed / 60_000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
