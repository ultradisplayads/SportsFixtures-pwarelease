import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/server/admin-auth"

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
const DELIVERY_BATCH_SIZE = 50
const DELIVERY_MAX_ATTEMPTS = 3
const DEDUPE_TTL_MS = 6 * 60 * 60 * 1000
const dedupeMap = new Map<string, number>()

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function endpointHash(endpoint: string): Promise<string> {
  const bytes = new TextEncoder().encode(endpoint)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

function pruneDedupe(now = Date.now()) {
  for (const [key, expiresAt] of dedupeMap) {
    if (expiresAt <= now) dedupeMap.delete(key)
  }
}

function isDuplicateDelivery(key: string): boolean {
  const now = Date.now()
  pruneDedupe(now)
  if (dedupeMap.has(key)) return true
  dedupeMap.set(key, now + DEDUPE_TTL_MS)
  return false
}

async function postStrapiAudit(path: string, body: Record<string, unknown>) {
  if (!SF_API_TOKEN) return
  await fetch(`${SF_API_URL}${path}`, {
    method: "POST",
    headers: strapiHeaders,
    body: JSON.stringify(body),
    cache: "no-store",
  }).catch(() => {})
}

async function patchStrapiAudit(path: string, body: Record<string, unknown>) {
  if (!SF_API_TOKEN) return
  await fetch(`${SF_API_URL}${path}`, {
    method: "PATCH",
    headers: strapiHeaders,
    body: JSON.stringify(body),
    cache: "no-store",
  }).catch(() => {})
}

async function logDelivery(entry: Record<string, unknown>) {
  await postStrapiAudit("/api/push-delivery-logs", entry)
}

async function deactivateSubscription(id: number, reason: string) {
  await fetch(`${SF_API_URL}/api/push-subscriptions/deactivate-by-id`, {
    method: "PATCH",
    headers: strapiHeaders,
    body: JSON.stringify({ id, reason }),
    cache: "no-store",
  }).catch(() => {})
}

async function deliverWithRetry(sub: { endpoint: string; p256dh: string; auth: string; id: number }, payload: object, meta: Record<string, unknown>) {
  const hashedEndpoint = await endpointHash(sub.endpoint)
  const dedupeKey = `${String(meta.campaignId || meta.tag || "adhoc")}:${hashedEndpoint}`

  if (isDuplicateDelivery(dedupeKey)) {
    await logDelivery({ ...meta, subscriptionId: sub.id, endpointHash: hashedEndpoint, status: "duplicate_suppressed", attempts: 0 })
    return { id: sub.id, ok: true, duplicate: true, attempts: 0 }
  }

  let lastResult: Awaited<ReturnType<typeof sendPush>> | null = null
  for (let attempt = 1; attempt <= DELIVERY_MAX_ATTEMPTS; attempt++) {
    lastResult = await sendPush(sub, payload)
    if (lastResult.ok) {
      await logDelivery({ ...meta, subscriptionId: sub.id, endpointHash: hashedEndpoint, status: "delivered", attempts: attempt, providerStatus: lastResult.status })
      return { ...lastResult, attempts: attempt }
    }

    const status = (lastResult as any).status
    if (status === 404 || status === 410) {
      await deactivateSubscription(sub.id, `push_endpoint_${status}`)
      await logDelivery({ ...meta, subscriptionId: sub.id, endpointHash: hashedEndpoint, status: "unsubscribed_cleanup", attempts: attempt, providerStatus: status })
      return { ...lastResult, attempts: attempt, cleanedUp: true }
    }

    if (attempt < DELIVERY_MAX_ATTEMPTS) {
      await sleep(250 * attempt)
    }
  }

  await logDelivery({
    ...meta,
    subscriptionId: sub.id,
    endpointHash: hashedEndpoint,
    status: "failed",
    attempts: DELIVERY_MAX_ATTEMPTS,
    providerStatus: (lastResult as any)?.status,
    error: (lastResult as any)?.error,
  })
  return { ...(lastResult || { id: sub.id, ok: false }), attempts: DELIVERY_MAX_ATTEMPTS }
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
  if (!pushSecret) {
    const session = await requireAdminSession(req)
    if (!session.ok) return session.response
  }

  try {
    const body = await req.json()
    const {
      targetType, title, message, url, iconUrl, imageUrl, lat, lng, radiusKm,
      teamIds, leagueIds, tiers, country, deviceToken, campaignId, category, tag, actions,
      primaryUrl, secondaryUrl, requireInteraction,
    } = body

    if (!title || !message) {
      return NextResponse.json({ error: "title and message are required" }, { status: 400 })
    }

    // ── Fetch subscribers from Strapi instead of direct DB ────────────────────
    const queryRes = await fetch(`${SF_API_URL}/api/push-subscriptions/query`, {
      method: "POST",
      headers: strapiHeaders,
      body: JSON.stringify({ targetType, lat, lng, radiusKm, teamIds, leagueIds, tiers, country, deviceToken }),
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
      image: imageUrl || undefined,
      url: url || "/",
      primaryUrl,
      secondaryUrl,
      category,
      tag: tag || (category ? `sf-${category}-${campaignId || Date.now()}` : undefined),
      actions: Array.isArray(actions) ? actions.slice(0, 2) : undefined,
      requireInteraction: requireInteraction ?? false,
      data: { campaignId, url: url || "/", category },
    }

    const auditId = campaignId || `push-${Date.now()}`
    await postStrapiAudit("/api/push-campaign-audits", {
      campaignId: auditId,
      status: "started",
      targetType,
      category,
      tag: payload.tag,
      requestedRecipients: subs.length,
      title,
      url: url || "/",
      startedAt: new Date().toISOString(),
    })

    let delivered = 0
    let failed = 0
    let duplicates = 0
    let cleanedUp = 0

    for (let i = 0; i < subs.length; i += DELIVERY_BATCH_SIZE) {
      const batch = subs.slice(i, i + DELIVERY_BATCH_SIZE)
      const results = await Promise.all(batch.map((s: any) => deliverWithRetry(s, payload, {
        campaignId: auditId,
        category,
        tag: payload.tag,
        targetType,
      })))
      for (const r of results) {
        if ((r as any).duplicate) {
          duplicates++
        } else if ((r as any).cleanedUp) {
          failed++
          cleanedUp++
        } else if (r.ok) {
          delivered++
        } else {
          failed++
        }
      }
    }

    await patchStrapiAudit("/api/push-campaign-audits/complete", {
      campaignId: auditId,
      status: "completed",
      requestedRecipients: subs.length,
      delivered,
      failed,
      duplicates,
      cleanedUp,
      completedAt: new Date().toISOString(),
    })

    await postStrapiAudit("/api/push-campaign-metrics", {
      campaignId: auditId,
      delivered,
      failed,
      duplicates,
      cleanedUp,
      recipients: subs.length,
      category,
      targetType,
      recordedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, recipients: subs.length, delivered, failed, duplicates, cleanedUp, campaignId: auditId })
  } catch (err) {
    console.error("[push/send]", err)
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 })
  }
}
