import { NextRequest, NextResponse } from "next/server"

const APP_BRAND_ICON = "/logo.png"
const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net").replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""
const strapiHeaders = {
  "Content-Type": "application/json",
  ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
}

// Simple in-memory rate limit
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

async function buildVapidHeaders(endpoint: string) {
  const vapidPublic = process.env.VAPID_PUBLIC_KEY!
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY!
  const vapidSubject = process.env.VAPID_SUBJECT!
  const origin = new URL(endpoint).origin
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600
  const header = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
  const payload = btoa(JSON.stringify({ aud: origin, exp, sub: vapidSubject })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
  const signingInput = `${header}.${payload}`
  const privateKeyBytes = Uint8Array.from(atob(vapidPrivate.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey("pkcs8", privateKeyBytes, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"])
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, cryptoKey, new TextEncoder().encode(signingInput))
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
  return { Authorization: `vapid t=${signingInput}.${sig},k=${vapidPublic}`, "Content-Type": "application/json" }
}

async function sendPush(sub: { endpoint: string; p256dh: string; auth: string; id: number }, payload: object) {
  try {
    const headers = await buildVapidHeaders(sub.endpoint)
    const res = await fetch(sub.endpoint, { method: "POST", headers, body: JSON.stringify(payload) })
    return { id: sub.id, ok: res.ok, status: res.status }
  } catch (e: any) {
    return { id: sub.id, ok: false, error: e.message }
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  const authHeader = req.headers.get("authorization")
  const pushSecret = process.env.PUSH_SECRET
  if (pushSecret && authHeader !== `Bearer ${pushSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { targetType, title, message, url, iconUrl, lat, lng, radiusKm, teamIds, leagueIds, tiers, country, campaignId } = body

    if (!title || !message) {
      return NextResponse.json({ error: "title and message are required" }, { status: 400 })
    }

    // ── Fetch subscribers from Strapi instead of direct DB ────────────────────
    const queryRes = await fetch(`${SF_API_URL}/api/push-subscriptions/query`, {
      method: "POST",
      headers: strapiHeaders,
      body: JSON.stringify({ targetType, lat, lng, radiusKm, teamIds, leagueIds, tiers, country }),
    })

    if (!queryRes.ok) {
      return NextResponse.json({ error: "Failed to fetch subscriptions" }, { status: 500 })
    }

    const queryData = await queryRes.json()
    let subs: any[] = queryData.data || []

    // Location haversine filter already done in Strapi for location type
    // but double-check here just in case
    if (targetType === "location" && lat && lng) {
      subs = subs.filter((s: any) =>
        s.lat != null && s.lng != null &&
        haversineKm(lat, lng, s.lat, s.lng) <= (radiusKm || 5)
      )
    }

    const payload = {
      title,
      body: message,
      icon: iconUrl || APP_BRAND_ICON,
      badge: APP_BRAND_ICON,
      url: url || "/",
      data: { campaignId, url: url || "/" },
    }

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
          // Deactivate gone subscriptions via Strapi
          if ((r as any).status === 410) {
            await fetch(`${SF_API_URL}/api/push-subscriptions/deactivate-by-id`, {
              method: "PATCH",
              headers: strapiHeaders,
              body: JSON.stringify({ id: r.id }),
            }).catch(() => {})
          }
        }
      }
    }

    // Update campaign stats in Strapi if campaignId provided
    // TODO: wire push_campaigns to Strapi when campaign content type is created

    return NextResponse.json({ success: true, recipients: subs.length, delivered, failed })
  } catch (err) {
    console.error("[push/send]", err)
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 })
  }
}
