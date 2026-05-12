-- SportsFixtures Postgres schema outline
-- This is a build blueprint for the Strapi/Postgres backend, not a final migration.

create extension if not exists pgcrypto;
create extension if not exists postgis;
create extension if not exists pg_trgm;

-- Core enums kept small; high-change provider/category values can stay text/jsonb.
do $$ begin
  create type owner_type as enum ('user', 'device');
exception when duplicate_object then null; end $$;

do $$ begin
  create type entity_type as enum ('sport', 'country', 'competition', 'season', 'event', 'team', 'player', 'venue', 'news_topic', 'offer', 'campaign');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_status_phase as enum ('scheduled', 'lineups_expected', 'lineups_confirmed', 'live_first_half', 'half_time', 'live_second_half', 'extra_time', 'penalties', 'full_time', 'postponed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type job_status as enum ('queued', 'processing', 'sent', 'failed', 'cancelled', 'skipped');
exception when duplicate_object then null; end $$;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  strapi_user_id text unique,
  email citext,
  username text,
  display_name text,
  first_name text,
  last_name text,
  phone text,
  city text,
  country text,
  timezone text default 'UTC',
  avatar_url text,
  role_type text,
  premium_tier text,
  premium_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete set null,
  device_token text not null unique,
  platform text,
  app_version text,
  timezone text,
  locale text,
  location_permission text,
  last_lat double precision,
  last_lng double precision,
  last_location_accuracy_m integer,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists user_consents (
  id uuid primary key default gen_random_uuid(),
  owner_type owner_type not null,
  owner_id text not null,
  terms_accepted boolean not null default false,
  cookies_accepted boolean not null default false,
  marketing_email boolean not null default false,
  marketing_push boolean not null default true,
  personalization boolean not null default true,
  location_recommendations boolean not null default true,
  analytics boolean not null default true,
  affiliate_tracking boolean not null default true,
  accepted_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (owner_type, owner_id)
);

create table if not exists sports (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  icon_url text,
  display_order integer default 0,
  enabled boolean not null default true,
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists countries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  iso2 text,
  iso3 text,
  flag_url text,
  enabled boolean not null default true,
  blocked boolean not null default false
);

create table if not exists competitions (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid references sports(id),
  country_id uuid references countries(id),
  slug text not null unique,
  name text not null,
  short_name text,
  competition_type text not null default 'league',
  logo_url text,
  gender text default 'all',
  tier integer,
  enabled boolean not null default true,
  blocked boolean not null default false
);

create table if not exists competition_seasons (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  name text not null,
  starts_on date,
  ends_on date,
  current boolean not null default false,
  provider_meta jsonb not null default '{}'::jsonb
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid references sports(id),
  country_id uuid references countries(id),
  slug text not null unique,
  name text not null,
  short_name text,
  logo_url text,
  colors jsonb not null default '{}'::jsonb,
  gender text default 'all',
  enabled boolean not null default true,
  blocked boolean not null default false
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid references sports(id),
  team_id uuid references teams(id),
  name text not null,
  slug text,
  position text,
  photo_url text,
  country_id uuid references countries(id),
  provider_meta jsonb not null default '{}'::jsonb
);

create table if not exists provider_entities (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  entity_type entity_type not null,
  internal_id uuid,
  provider_entity_id text not null,
  provider_slug text,
  raw jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz not null default now(),
  unique (provider, entity_type, provider_entity_id)
);

create table if not exists venues_stadiums (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  city text,
  country_id uuid references countries(id),
  location geography(Point, 4326),
  capacity integer,
  weather_location text,
  provider_meta jsonb not null default '{}'::jsonb
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid references sports(id),
  competition_id uuid references competitions(id),
  season_id uuid references competition_seasons(id),
  home_team_id uuid references teams(id),
  away_team_id uuid references teams(id),
  stadium_id uuid references venues_stadiums(id),
  name text not null,
  starts_at timestamptz not null,
  status_phase event_status_phase not null default 'scheduled',
  home_score integer,
  away_score integer,
  round text,
  gender text default 'all',
  provider_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists event_status_snapshots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  status_phase event_status_phase not null,
  minute integer,
  home_score integer,
  away_score integer,
  possession_home numeric(5,2),
  possession_away numeric(5,2),
  raw jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now()
);

create table if not exists event_timeline (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  minute integer,
  extra_minute integer,
  side text,
  event_type text not null,
  title text not null,
  description text,
  player_id uuid references players(id),
  player_name text,
  assist_player_id uuid references players(id),
  assist_name text,
  source text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists event_statistics (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  stat_key text not null,
  label text not null,
  home_value text,
  away_value text,
  home_numeric numeric,
  away_numeric numeric,
  source text,
  captured_at timestamptz not null default now(),
  unique (event_id, stat_key, captured_at)
);

create table if not exists standings_tables (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id),
  season_id uuid references competition_seasons(id),
  name text not null,
  stage text,
  updated_at timestamptz not null default now()
);

create table if not exists standings_rows (
  id uuid primary key default gen_random_uuid(),
  standings_table_id uuid not null references standings_tables(id) on delete cascade,
  team_id uuid references teams(id),
  rank integer not null,
  played integer default 0,
  won integer default 0,
  drawn integer default 0,
  lost integer default 0,
  goals_for integer default 0,
  goals_against integer default 0,
  goal_diff integer default 0,
  points integer default 0,
  form text,
  unique (standings_table_id, team_id)
);

create table if not exists event_tv_listings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  country_id uuid references countries(id),
  channel_name text not null,
  channel_logo_url text,
  service_type text default 'broadcast',
  affiliate_url text,
  sponsored boolean not null default false,
  raw jsonb not null default '{}'::jsonb
);

create table if not exists watch_venues (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  venue_type text,
  description text,
  address text,
  area text,
  city text,
  country_id uuid references countries(id),
  location geography(Point, 4326),
  phone text,
  website text,
  whatsapp text,
  line_id text,
  map_url text,
  photo_url text,
  screen_count integer default 0,
  capacity integer,
  price_band text,
  food boolean not null default false,
  cuisine text[] not null default '{}',
  kitchen_hours text,
  open_now_override boolean,
  sponsored boolean not null default false,
  ppc_radius_km numeric(8,2),
  ppc_bid numeric(10,2),
  is_active boolean not null default true,
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists venue_supported_teams (
  venue_id uuid references watch_venues(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  affinity_score integer default 50,
  primary key (venue_id, team_id)
);

create table if not exists venue_supported_competitions (
  venue_id uuid references watch_venues(id) on delete cascade,
  competition_id uuid references competitions(id) on delete cascade,
  primary key (venue_id, competition_id)
);

create table if not exists venue_scheduled_events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references watch_venues(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  showing_status text default 'confirmed',
  channel_name text,
  starts_at timestamptz,
  notes text,
  unique (venue_id, event_id)
);

create table if not exists venue_offers (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references watch_venues(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  offer_type text,
  sponsored boolean not null default false,
  active boolean not null default true
);

create table if not exists user_favourites (
  id uuid primary key default gen_random_uuid(),
  owner_type owner_type not null,
  owner_id text not null,
  entity_type entity_type not null,
  entity_id text not null,
  entity_name text,
  entity_logo text,
  entity_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (owner_type, owner_id, entity_type, entity_id)
);

create table if not exists onboarding_interests (
  id uuid primary key default gen_random_uuid(),
  owner_type owner_type not null,
  owner_id text not null,
  sports text[] not null default '{}',
  countries text[] not null default '{}',
  competitions text[] not null default '{}',
  events text[] not null default '{}',
  teams text[] not null default '{}',
  completed_step integer default 0,
  completed_at timestamptz,
  raw jsonb not null default '{}'::jsonb,
  unique (owner_type, owner_id)
);

create table if not exists user_preferences (
  id uuid primary key default gen_random_uuid(),
  owner_type owner_type not null,
  owner_id text not null,
  timezone text,
  theme text default 'system',
  disco_enabled boolean default false,
  disco_background text default 'dark',
  location_enabled boolean default true,
  calendar_mode text,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (owner_type, owner_id)
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete set null,
  device_token text,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  platform text,
  active boolean not null default true,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notification_preferences (
  id uuid primary key default gen_random_uuid(),
  owner_type owner_type not null,
  owner_id text not null,
  push_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  global_mute boolean not null default false,
  quiet_hours_enabled boolean not null default false,
  quiet_hours_start time,
  quiet_hours_end time,
  timezone text default 'UTC',
  default_reminder_offsets text[] not null default array['24h','8h','1h','5m'],
  enabled_categories text[] not null default '{}',
  disabled_categories text[] not null default '{}',
  allow_breaking_news boolean not null default true,
  allow_venue_offers boolean not null default true,
  allow_transfer_news boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (owner_type, owner_id)
);

create table if not exists notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_type owner_type not null,
  owner_id text not null,
  entity_type entity_type not null,
  entity_id text not null,
  entity_name text,
  categories text[] not null default '{}',
  reminder_offsets text[] not null default '{}',
  tier text default 'tier1',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_type, owner_id, entity_type, entity_id)
);

create table if not exists push_campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_key text unique,
  title text not null,
  body text,
  category text not null,
  target_rules jsonb not null default '{}'::jsonb,
  scheduled_at timestamptz,
  status text not null default 'draft',
  created_by uuid references app_users(id),
  created_at timestamptz not null default now()
);

create table if not exists push_delivery_jobs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references push_campaigns(id) on delete set null,
  subscription_id uuid references push_subscriptions(id) on delete cascade,
  notification_key text not null,
  payload jsonb not null,
  scheduled_at timestamptz not null,
  status job_status not null default 'queued',
  retry_count integer not null default 0,
  max_retries integer not null default 3,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (notification_key, subscription_id)
);

create table if not exists push_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references push_delivery_jobs(id) on delete cascade,
  status_code integer,
  provider_response text,
  error text,
  attempted_at timestamptz not null default now()
);

create table if not exists notification_history (
  id uuid primary key default gen_random_uuid(),
  owner_type owner_type,
  owner_id text,
  campaign_id uuid references push_campaigns(id) on delete set null,
  title text not null,
  body text,
  category text,
  tier text,
  entity_type entity_type,
  entity_id text,
  event_id uuid references events(id) on delete set null,
  url text,
  reason text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists venue_checkins (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references watch_venues(id) on delete cascade,
  event_id uuid references events(id) on delete set null,
  user_id uuid references app_users(id) on delete set null,
  device_token text,
  checked_in_at timestamptz not null default now(),
  expires_at timestamptz,
  meta jsonb not null default '{}'::jsonb
);

create table if not exists venue_watchers (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references watch_venues(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  owner_type owner_type not null,
  owner_id text not null,
  intent_status text default 'interested',
  created_at timestamptz not null default now(),
  unique (venue_id, event_id, owner_type, owner_id)
);

create table if not exists commercial_campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_key text unique,
  campaign_type text not null,
  title text not null,
  body text,
  image_url text,
  href text,
  sponsor_name text,
  venue_id uuid references watch_venues(id) on delete set null,
  target_rules jsonb not null default '{}'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists redeem_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_percent integer,
  grants_tier text,
  max_redemptions integer,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists redeem_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  redeem_code_id uuid references redeem_codes(id) on delete cascade,
  owner_type owner_type not null,
  owner_id text not null,
  redeemed_at timestamptz not null default now(),
  unique (redeem_code_id, owner_type, owner_id)
);

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  user_id uuid references app_users(id) on delete set null,
  device_token text,
  session_id text,
  page text,
  entity_type entity_type,
  entity_id text,
  meta jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists search_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete set null,
  device_token text,
  query text not null,
  search_scope text,
  result_count integer,
  selected_entity_type entity_type,
  selected_entity_id text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  owner_type owner_type not null,
  owner_id text not null,
  event_id uuid references events(id) on delete cascade,
  home_score integer not null,
  away_score integer not null,
  week_key text not null,
  result text,
  points_earned integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_type, owner_id, event_id)
);

create table if not exists gamification_stats (
  id uuid primary key default gen_random_uuid(),
  owner_type owner_type not null,
  owner_id text not null,
  total_points integer not null default 0,
  level integer not null default 1,
  rank_name text not null default 'Rookie Fan',
  predictions_count integer not null default 0,
  correct_predictions integer not null default 0,
  accuracy numeric(5,2) not null default 0,
  streak integer not null default 0,
  badges text[] not null default '{}',
  weekly_predictions_used integer not null default 0,
  prediction_week_key text,
  updated_at timestamptz not null default now(),
  unique (owner_type, owner_id)
);

create table if not exists news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  feed_url text,
  source_url text,
  active boolean not null default true,
  trust_score integer default 50
);

create table if not exists news_articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references news_sources(id) on delete set null,
  title text not null,
  summary text,
  url text not null unique,
  image_url text,
  published_at timestamptz,
  breaking boolean not null default false,
  transfer boolean not null default false,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists provider_cache_index (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  endpoint_hash text not null,
  endpoint text not null,
  r2_object_key text not null,
  stored_at timestamptz not null,
  expires_at timestamptz not null,
  stale_until timestamptz,
  status text default 'fresh',
  unique (provider, endpoint_hash)
);

create table if not exists provider_quota_windows (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  product text not null,
  quota_key text not null,
  window_date date not null,
  request_limit integer,
  requests_used integer not null default 0,
  reset_at timestamptz,
  unique (provider, product, quota_key, window_date)
);

create table if not exists feature_flags (
  key text primary key,
  enabled boolean not null default false,
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references app_users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

-- Search and performance indexes
create index if not exists idx_events_starts_at on events(starts_at);
create index if not exists idx_events_competition_start on events(competition_id, starts_at);
create index if not exists idx_events_home_team on events(home_team_id);
create index if not exists idx_events_away_team on events(away_team_id);
create index if not exists idx_event_status_event_time on event_status_snapshots(event_id, captured_at desc);
create index if not exists idx_watch_venues_location on watch_venues using gist(location);
create index if not exists idx_watch_venues_city on watch_venues(city);
create index if not exists idx_watch_venues_name_trgm on watch_venues using gin(name gin_trgm_ops);
create index if not exists idx_teams_name_trgm on teams using gin(name gin_trgm_ops);
create index if not exists idx_competitions_name_trgm on competitions using gin(name gin_trgm_ops);
create index if not exists idx_user_favourites_owner on user_favourites(owner_type, owner_id);
create index if not exists idx_push_delivery_due on push_delivery_jobs(status, scheduled_at);
create index if not exists idx_analytics_events_time on analytics_events(occurred_at desc);
create index if not exists idx_analytics_events_device on analytics_events(device_token, occurred_at desc);
create index if not exists idx_search_queries_text_trgm on search_queries using gin(query gin_trgm_ops);
create index if not exists idx_provider_cache_expiry on provider_cache_index(provider, expires_at);

