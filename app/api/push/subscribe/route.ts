import { NextRequest, NextResponse } from "next/server"

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net").replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""
const strapiHeaders = {
  "Content-Type": "application/json",
  ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
}

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

    await fetch(`${SF_API_URL}/api/push-subscriptions/subscribe`, {
      method: "POST",
      headers: strapiHeaders,
      body: JSON.stringify({
        endpoint, p256dh, auth,
        deviceToken: deviceToken || null,
        userId: userId || null,
        lat: lat || null,
        lng: lng || null,
        country: country || null,
        timezone: timezone || null,
        pref_match_start: preferences.matchStart ?? true,
        pref_goals: preferences.goals ?? true,
        pref_halftime: preferences.halftime ?? false,
        pref_fulltime: preferences.fulltime ?? true,
        pref_cards: preferences.cards ?? false,
        pref_lineups: preferences.lineups ?? false,
        pref_venue_offers: preferences.venueOffers ?? false,
        pref_advertising: preferences.advertising ?? false,
        followed_teams: followedTeams,
        followed_leagues: followedLeagues,
      }),
    })

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

    await fetch(`${SF_API_URL}/api/push-subscriptions/unsubscribe`, {
      method: "DELETE",
      headers: strapiHeaders,
      body: JSON.stringify({ endpoint }),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[push/subscribe] unsubscribe", err)
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { endpoint, preferences, followedTeams, followedLeagues, lat, lng, country, timezone, tier } = await req.json()
    if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 })

    await fetch(`${SF_API_URL}/api/push-subscriptions/update-prefs`, {
      method: "PATCH",
      headers: strapiHeaders,
      body: JSON.stringify({ endpoint, preferences, followedTeams, followedLeagues, lat, lng, country, timezone, tier }),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[push/subscribe] patch", err)
    return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
  }
}