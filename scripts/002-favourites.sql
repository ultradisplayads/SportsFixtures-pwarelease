-- Favourites table — device-keyed (no login required for MVP)
-- Uses stable device_token from localStorage (a UUID generated on first visit)
-- When auth is added, link device_token → user_id

CREATE TABLE IF NOT EXISTS favourites (
  id            SERIAL PRIMARY KEY,
  device_token  TEXT NOT NULL,
  entity_type   TEXT NOT NULL CHECK (entity_type IN ('team', 'league', 'player')),
  entity_id     TEXT NOT NULL,
  entity_name   TEXT,
  entity_logo   TEXT,
  entity_meta   JSONB DEFAULT '{}',   -- sport, league name, country etc
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (device_token, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_fav_device ON favourites(device_token);
CREATE INDEX IF NOT EXISTS idx_fav_entity ON favourites(entity_type, entity_id);
