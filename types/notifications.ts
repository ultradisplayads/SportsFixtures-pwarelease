// ─────────────────────────────────────────────────────────────────────────────
// Section 02 — Alerts, Reminders, and Notification Logic
// Central domain types for the entire notification layer.
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationTier = "tier1" | "tier2" | "tier3"

export type ReminderOffset = "24h" | "12h" | "3h" | "1h" | "30m" | "15m" | "5m"

export type AlertCategory =
  | "match_reminder"
  | "kickoff"
  | "lineups"
  | "goal"
  | "red_card"
  | "half_time"
  | "extra_time"
  | "penalties"
  | "full_time"
  | "postponed"
  | "cancelled"
  | "venue_offer"
  | "breaking_news"
  | "transfer_news"

export type NotificationEntityType =
  | "team"
  | "competition"
  | "player"
  | "venue"
  | "event"
  | "news_topic"

// ── Global preference profile ─────────────────────────────────────────────────

export type NotificationPreferenceProfile = {
  pushEnabled: boolean
  inAppEnabled: boolean
  globalMute: boolean
  quietHoursEnabled: boolean
  quietHoursStart?: string   // "HH:MM" in user timezone
  quietHoursEnd?: string     // "HH:MM" in user timezone
  timezone: string
  defaultReminderOffsets: ReminderOffset[]
  enabledCategories: AlertCategory[]
  disabledCategories: AlertCategory[]
  tierEnabled: Record<NotificationTier, boolean>
  allowBreakingNews: boolean
  allowVenueOffers: boolean
  allowTransferNews: boolean
  updatedAt?: string
}

// ── Per-entity subscription (camelCase UI/hook shape) ─────────────────────────
// NOTE: The DB-native snake_case shape is `NotificationSubscription` further below.
// This type is used only for in-memory / hook-layer operations.

export type NotificationSubscriptionProfile = {
  id?: string
  entityType: NotificationEntityType
  entityId: string
  entityName?: string
  categories: AlertCategory[]
  reminderOffsets?: ReminderOffset[]
  tier?: NotificationTier
}

// ── Notification history item ─────────────────────────────────────────────────

export type NotificationItem = {
  id: string
  title: string
  body?: string
  category: AlertCategory
  tier: NotificationTier
  entityType?: NotificationEntityType
  entityId?: string
  eventId?: string
  url?: string
  createdAt: string
  read?: boolean
  reason?: string
}

// ── Push subscription shape (Web Push API) ────────────────────────────────────

export type PushSubscriptionPayload = {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DB-native snake_case types (used by hooks/use-notifications.ts and API routes)
// These map directly to the Postgres columns.
// ─────────────────────────────────────────────────────────────────────────────

/** Matches the `category` column values in notification_history. */
export type NotificationCategory =
  | "match_reminder"
  | "kickoff"
  | "lineups"
  | "goal"
  | "red_card"
  | "half_time"
  | "extra_time"
  | "penalties"
  | "full_time"
  | "postponed"
  | "cancelled"
  | "venue_offer"
  | "breaking_news"
  | "transfer_news"

/** Row shape from the `notification_preferences` table. */
export type NotificationPreferences = {
  push_enabled: boolean
  in_app_enabled: boolean
  global_mute: boolean
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  timezone: string
  default_reminder_offsets: string[]
  enabled_categories: NotificationCategory[]
  disabled_categories: NotificationCategory[]
  tier1_enabled: boolean
  tier2_enabled: boolean
  tier3_enabled: boolean
  allow_breaking_news: boolean
  allow_venue_offers: boolean
  allow_transfer_news: boolean
}

/** Row shape from the `notification_subscriptions` table. */
export type NotificationSubscription = {
  id: number
  device_token: string
  entity_type: string
  entity_id: string
  entity_name?: string
  categories: NotificationCategory[]
  reminder_offsets: string[]
  tier: string
  created_at: string
  updated_at: string
}

/** Row shape from the `notification_history` table. */
export type NotificationHistoryItem = {
  id: number
  device_token: string
  title: string
  body?: string
  category: NotificationCategory
  tier: string
  entity_type?: string
  entity_id?: string
  event_id?: string
  url?: string
  reason?: string
  read: boolean
  created_at: string
}

/** Params for subscribing to alerts for an entity. */
export type SubscribeEntityParams = {
  entity_type: string
  entity_id: string
  entity_name?: string
  categories?: NotificationCategory[]
  reminder_offsets?: string[]
  tier?: string
}
