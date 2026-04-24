-- Push Subscriptions and Notification System
-- Stores device Web Push subscriptions + per-user preferences + advertiser campaigns

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_id TEXT,                          -- NULL = anonymous device
  device_token TEXT,                     -- stable device identifier (UUID stored client-side)
  -- location for geo-targeted pushes
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  country TEXT,
  timezone TEXT,
  -- preference flags
  pref_match_start BOOLEAN DEFAULT TRUE,
  pref_goals BOOLEAN DEFAULT TRUE,
  pref_halftime BOOLEAN DEFAULT FALSE,
  pref_fulltime BOOLEAN DEFAULT TRUE,
  pref_cards BOOLEAN DEFAULT FALSE,
  pref_lineups BOOLEAN DEFAULT FALSE,
  pref_venue_offers BOOLEAN DEFAULT FALSE,
  pref_advertising BOOLEAN DEFAULT FALSE,
  -- followed teams/leagues for targeted push
  followed_teams TEXT[] DEFAULT '{}',    -- array of team IDs
  followed_leagues TEXT[] DEFAULT '{}',  -- array of league IDs
  -- subscription tier
  tier TEXT DEFAULT 'free',              -- free | ad-supported | pro | vip
  tier_expires_at TIMESTAMPTZ,
  -- meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_push_subs_device_token ON push_subscriptions(device_token);
CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_country ON push_subscriptions(country);
CREATE INDEX IF NOT EXISTS idx_push_subs_active ON push_subscriptions(is_active);
-- Simple btree indexes for lat/lng — haversine filtering done in query WHERE clause
CREATE INDEX IF NOT EXISTS idx_push_subs_lat ON push_subscriptions(lat) WHERE lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_push_subs_lng ON push_subscriptions(lng) WHERE lng IS NOT NULL;

-- Advertiser campaigns table
CREATE TABLE IF NOT EXISTS push_campaigns (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  advertiser_name TEXT NOT NULL,
  -- targeting
  target_type TEXT NOT NULL,             -- all | location | online | team | league | tier
  target_radius_km DOUBLE PRECISION,     -- for location targeting
  target_lat DOUBLE PRECISION,
  target_lng DOUBLE PRECISION,
  target_team_ids TEXT[] DEFAULT '{}',
  target_league_ids TEXT[] DEFAULT '{}',
  target_tiers TEXT[] DEFAULT '{}',
  target_country TEXT,
  -- message
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon_url TEXT,
  action_url TEXT,
  -- schedule
  send_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  -- stats
  recipient_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  clicked_count INT DEFAULT 0,
  -- meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'draft'            -- draft | scheduled | sending | sent | failed
);

-- Notification send log
CREATE TABLE IF NOT EXISTS push_send_log (
  id SERIAL PRIMARY KEY,
  campaign_id INT REFERENCES push_campaigns(id) ON DELETE SET NULL,
  subscription_id INT REFERENCES push_subscriptions(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,       -- match_start | goal | halftime | fulltime | card | lineup | ad | venue_offer | bulk
  payload JSONB,
  delivered BOOLEAN DEFAULT FALSE,
  clicked BOOLEAN DEFAULT FALSE,
  error TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_send_log_campaign ON push_send_log(campaign_id);
CREATE INDEX IF NOT EXISTS idx_send_log_sub ON push_send_log(subscription_id);
CREATE INDEX IF NOT EXISTS idx_send_log_type ON push_send_log(notification_type);
