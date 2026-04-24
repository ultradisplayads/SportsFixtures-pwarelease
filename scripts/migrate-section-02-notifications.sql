-- Section 02: Alerts, Reminders & Notification Logic
-- Creates the three new tables required by the notification API routes.
-- Safe to run multiple times (uses IF NOT EXISTS / DO NOTHING).

-- ── notification_preferences ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_preferences (
  id                       SERIAL PRIMARY KEY,
  device_token             TEXT NOT NULL UNIQUE,
  push_enabled             BOOLEAN NOT NULL DEFAULT FALSE,
  in_app_enabled           BOOLEAN NOT NULL DEFAULT TRUE,
  global_mute              BOOLEAN NOT NULL DEFAULT FALSE,
  quiet_hours_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
  quiet_hours_start        TEXT    NOT NULL DEFAULT '22:00',
  quiet_hours_end          TEXT    NOT NULL DEFAULT '08:00',
  timezone                 TEXT    NOT NULL DEFAULT 'UTC',
  default_reminder_offsets JSONB   NOT NULL DEFAULT '["1h","15m"]',
  enabled_categories       JSONB   NOT NULL DEFAULT '["match_reminder","kickoff","goal","full_time"]',
  disabled_categories      JSONB   NOT NULL DEFAULT '[]',
  tier1_enabled            BOOLEAN NOT NULL DEFAULT TRUE,
  tier2_enabled            BOOLEAN NOT NULL DEFAULT TRUE,
  tier3_enabled            BOOLEAN NOT NULL DEFAULT FALSE,
  allow_breaking_news      BOOLEAN NOT NULL DEFAULT FALSE,
  allow_venue_offers       BOOLEAN NOT NULL DEFAULT FALSE,
  allow_transfer_news      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── notification_subscriptions ───────────────────────────────────────────────
-- Per-entity subscriptions: team, competition, player, venue, event, news_topic
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id               SERIAL PRIMARY KEY,
  device_token     TEXT NOT NULL,
  entity_type      TEXT NOT NULL,  -- team | competition | player | venue | event | news_topic
  entity_id        TEXT NOT NULL,
  entity_name      TEXT,
  categories       JSONB NOT NULL DEFAULT '[]',
  reminder_offsets JSONB NOT NULL DEFAULT '["1h","15m"]',
  tier             TEXT NOT NULL DEFAULT 'tier2',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (device_token, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_device
  ON notification_subscriptions (device_token);

-- ── notification_history ──────────────────────────────────────────────────────
-- In-app notification center / bell drawer history
CREATE TABLE IF NOT EXISTS notification_history (
  id           SERIAL PRIMARY KEY,
  device_token TEXT NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT,
  category     TEXT NOT NULL,
  tier         TEXT NOT NULL DEFAULT 'tier2',
  entity_type  TEXT,
  entity_id    TEXT,
  event_id     TEXT,
  url          TEXT,
  reason       TEXT,
  read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_history_device
  ON notification_history (device_token, created_at DESC);

-- Keep only last 200 rows per device to avoid unbounded growth
-- (enforced by application layer; this index helps the cleanup query)
CREATE INDEX IF NOT EXISTS idx_notification_history_device_id
  ON notification_history (device_token, id DESC);
