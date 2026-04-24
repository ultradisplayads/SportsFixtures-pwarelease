import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

/** Explicit app brand icon for Web Push payloads — not a sports entity fallback. */
const APP_BRAND_ICON = "/logo.png"

const sql = neon(process.env.DATABASE_URL!)

// Simple in-memory rate limit — resets per serverless instance
// For production use Upstash Redis or Vercel KV
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 60_000

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

// ── Haversine distance (km) between two lat/lng points ────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Build VAPID-signed JWT ─────────────────────────────────────────────────────
async function buildVapidHeaders(endpoint: string) {
  const vapidPublic = process.env.VAPID_PUBLIC_KEY!
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY!
  const vapidSubject = process.env.VAPID_SUBJECT!

  const origin = new URL(endpoint).origin
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600

  const header = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
  const payload = btoa(JSON.stringify({ aud: origin, exp, sub: vapidSubject }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")

  const signingInput = `${header}.${payload}`

  // Import private key
  const privateKeyBytes = Uint8Array.from(
    atob(vapidPrivate.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0),
  )
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(signingInput),
  )
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")

  const jwt = `${signingInput}.${sig}`
  return {
    Authorization: `vapid t=${jwt},k=${vapidPublic}`,
    "Content-Type": "application/json",
  }
}

// ── Send one Web Push notification ───────────────────────────────────────────
async function sendPush(
  sub: { endpoint: string; p256dh: string; auth: string; id: number },
  payload: object,
) {
  try {
    const headers = await buildVapidHeaders(sub.endpoint)
    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })
    return { id: sub.id, ok: res.ok, status: res.status }
  } catch (e: any) {
    return { id: sub.id, ok: false, error: e.message }
  }
}

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  // Require internal secret for push sends — set PUSH_SECRET env var
  const authHeader = req.headers.get("authorization")
  const pushSecret = process.env.PUSH_SECRET
  if (pushSecret && authHeader !== `Bearer ${pushSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      targetType,   // "all" | "location" | "online" | "team" | "league" | "tier" | "country"
      title,
      message,
      url,
      iconUrl,
      // location targeting
      lat,
      lng,
      radiusKm,
      // other targeting
      teamIds,
      leagueIds,
      tiers,
      country,
      campaignId,
      notificationType = "bulk",
    } = body

    if (!title || !message) {
      return NextResponse.json({ error: "title and message are required" }, { status: 400 })
    }

    // ── Fetch candidates from DB based on target type ─────────────────────────
    let subs: any[]

    if (targetType === "all") {
      subs = await sql`SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE is_active = TRUE`
    } else if (targetType === "country") {
      subs = await sql`SELECT id, endpoint, p256dh, auth FROM push_subscriptions
        WHERE is_active = TRUE AND country ILIKE ${country}`
    } else if (targetType === "tier") {
      subs = await sql`SELECT id, endpoint, p256dh, auth FROM push_subscriptions
        WHERE is_active = TRUE AND tier = ANY(${tiers}::text[])`
    } else if (targetType === "team") {
      subs = await sql`SELECT id, endpoint, p256dh, auth FROM push_subscriptions
        WHERE is_active = TRUE AND followed_teams && ${teamIds}::text[]`
    } else if (targetType === "league") {
      subs = await sql`SELECT id, endpoint, p256dh, auth FROM push_subscriptions
        WHERE is_active = TRUE AND followed_leagues && ${leagueIds}::text[]`
    } else if (targetType === "online") {
      // "online" = devices seen in last 30 minutes
      subs = await sql`SELECT id, endpoint, p256dh, auth FROM push_subscriptions
        WHERE is_active = TRUE AND last_used_at > NOW() - INTERVAL '30 minutes'`
    } else if (targetType === "location") {
      // Bounding box pre-filter then haversine in-process
      const deltaLat = (radiusKm || 5) / 111
      const deltaLng = (radiusKm || 5) / (111 * Math.cos((lat * Math.PI) / 180))
      const candidates = await sql`
        SELECT id, endpoint, p256dh, auth, lat, lng FROM push_subscriptions
        WHERE is_active = TRUE
          AND lat BETWEEN ${lat - deltaLat} AND ${lat + deltaLat}
          AND lng BETWEEN ${lng - deltaLng} AND ${lng + deltaLng}
          AND lat IS NOT NULL AND lng IS NOT NULL`
      subs = candidates.filter(
        (s: any) => haversineKm(lat, lng, s.lat, s.lng) <= (radiusKm || 5),
      )
    } else {
      return NextResponse.json({ error: "Unknown targetType" }, { status: 400 })
    }

    const payload = {
      title,
      body: message,
      icon: iconUrl || APP_BRAND_ICON,
      badge: APP_BRAND_ICON,
      url: url || "/",
      data: { campaignId, url: url || "/" },
    }

    // Send in parallel (batches of 50 to avoid overwhelming)
    let delivered = 0
    let failed = 0
    for (let i = 0; i < subs.length; i += 50) {
      const batch = subs.slice(i, i + 50)
      const results = await Promise.all(batch.map((s: any) => sendPush(s, payload)))
      for (const r of results) {
        if (r.ok) {
          delivered++
        } else {
          failed++
          // Deactivate gone subscriptions (410 = unsubscribed)
          if ((r as any).status === 410) {
            await sql`UPDATE push_subscriptions SET is_active = FALSE WHERE id = ${r.id}`
          }
        }
      }
    }

    // Log to send_log
    if (campaignId) {
      await sql`UPDATE push_campaigns SET delivered_count = ${delivered}, sent_at = NOW(), status = 'sent'
        WHERE id = ${campaignId}`
    }

    return NextResponse.json({ success: true, recipients: subs.length, delivered, failed })
  } catch (err) {
    console.error("[push/send]", err)
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 })
  }
}
