import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      endpoint,
      keys: { p256dh, auth },
      deviceToken,
      userId,
      lat,
      lng,
      country,
      timezone,
      preferences = {},
      followedTeams = [],
      followedLeagues = [],
    } = body

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await sql`
      INSERT INTO push_subscriptions (
        endpoint, p256dh, auth, device_token, user_id,
        lat, lng, country, timezone,
        pref_match_start, pref_goals, pref_halftime, pref_fulltime,
        pref_cards, pref_lineups, pref_venue_offers, pref_advertising,
        followed_teams, followed_leagues,
        updated_at, last_used_at, is_active
      ) VALUES (
        ${endpoint}, ${p256dh}, ${auth}, ${deviceToken || null}, ${userId || null},
        ${lat || null}, ${lng || null}, ${country || null}, ${timezone || null},
        ${preferences.matchStart ?? true}, ${preferences.goals ?? true},
        ${preferences.halftime ?? false}, ${preferences.fulltime ?? true},
        ${preferences.cards ?? false}, ${preferences.lineups ?? false},
        ${preferences.venueOffers ?? false}, ${preferences.advertising ?? false},
        ${followedTeams}, ${followedLeagues},
        NOW(), NOW(), TRUE
      )
      ON CONFLICT (endpoint) DO UPDATE SET
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        device_token = COALESCE(EXCLUDED.device_token, push_subscriptions.device_token),
        user_id = COALESCE(EXCLUDED.user_id, push_subscriptions.user_id),
        lat = COALESCE(EXCLUDED.lat, push_subscriptions.lat),
        lng = COALESCE(EXCLUDED.lng, push_subscriptions.lng),
        country = COALESCE(EXCLUDED.country, push_subscriptions.country),
        timezone = COALESCE(EXCLUDED.timezone, push_subscriptions.timezone),
        pref_match_start = EXCLUDED.pref_match_start,
        pref_goals = EXCLUDED.pref_goals,
        pref_halftime = EXCLUDED.pref_halftime,
        pref_fulltime = EXCLUDED.pref_fulltime,
        pref_cards = EXCLUDED.pref_cards,
        pref_lineups = EXCLUDED.pref_lineups,
        pref_venue_offers = EXCLUDED.pref_venue_offers,
        pref_advertising = EXCLUDED.pref_advertising,
        followed_teams = EXCLUDED.followed_teams,
        followed_leagues = EXCLUDED.followed_leagues,
        updated_at = NOW(),
        last_used_at = NOW(),
        is_active = TRUE
    `

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[push/subscribe]", err)
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json()
    if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })
    await sql`
      UPDATE push_subscriptions
      SET is_active = FALSE, updated_at = NOW()
      WHERE endpoint = ${endpoint}
    `
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[push/subscribe] unsubscribe", err)
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { endpoint, preferences, followedTeams, followedLeagues, lat, lng, country, timezone, tier } =
      await req.json()
    if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })
    await sql`
      UPDATE push_subscriptions SET
        pref_match_start  = COALESCE(${preferences?.matchStart  ?? null}, pref_match_start),
        pref_goals        = COALESCE(${preferences?.goals        ?? null}, pref_goals),
        pref_halftime     = COALESCE(${preferences?.halftime     ?? null}, pref_halftime),
        pref_fulltime     = COALESCE(${preferences?.fulltime     ?? null}, pref_fulltime),
        pref_cards        = COALESCE(${preferences?.cards        ?? null}, pref_cards),
        pref_lineups      = COALESCE(${preferences?.lineups      ?? null}, pref_lineups),
        pref_venue_offers = COALESCE(${preferences?.venueOffers  ?? null}, pref_venue_offers),
        pref_advertising  = COALESCE(${preferences?.advertising  ?? null}, pref_advertising),
        followed_teams    = COALESCE(${followedTeams   ?? null}, followed_teams),
        followed_leagues  = COALESCE(${followedLeagues ?? null}, followed_leagues),
        lat      = COALESCE(${lat       ?? null}, lat),
        lng      = COALESCE(${lng       ?? null}, lng),
        country  = COALESCE(${country   ?? null}, country),
        timezone = COALESCE(${timezone  ?? null}, timezone),
        tier     = COALESCE(${tier      ?? null}, tier),
        updated_at = NOW()
      WHERE endpoint = ${endpoint}
    `
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[push/subscribe] patch", err)
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
  }
}
