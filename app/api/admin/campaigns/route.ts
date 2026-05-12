import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/server/admin-auth"

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net").replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""
const strapiHeaders = {
  "Content-Type": "application/json",
  ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
}

export async function GET(req: NextRequest) {
  const session = await requireAdminSession(req)
  if (!session.ok) return session.response

  const campaignId = req.nextUrl.searchParams.get("campaignId")
  if (!campaignId) return NextResponse.json({ results: null })

  try {
    const [metricsRes, auditRes] = await Promise.all([
      fetch(`${SF_API_URL}/api/push-campaign-metrics?filters[campaignId][$eq]=${encodeURIComponent(campaignId)}&sort=recordedAt:desc&pagination[pageSize]=10`, {
        headers: strapiHeaders,
        cache: "no-store",
      }).catch(() => null),
      fetch(`${SF_API_URL}/api/push-campaign-audits?filters[campaignId][$eq]=${encodeURIComponent(campaignId)}&sort=createdAt:desc&pagination[pageSize]=10`, {
        headers: strapiHeaders,
        cache: "no-store",
      }).catch(() => null),
    ])

    const metrics = metricsRes?.ok ? await metricsRes.json().catch(() => null) : null
    const audits = auditRes?.ok ? await auditRes.json().catch(() => null) : null
    return NextResponse.json({ campaignId, metrics: metrics?.data ?? metrics ?? [], audits: audits?.data ?? audits ?? [] })
  } catch (error) {
    console.error("[admin/campaigns GET]", error)
    return NextResponse.json({ campaignId, metrics: [], audits: [] })
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdminSession(req)
  if (!session.ok) return session.response

  try {
    const body = await req.json()
    const campaignId = body.campaignId || `campaign-${Date.now()}`
    const payload = {
      ...body,
      campaignId,
      status: body.status || "scheduled",
      createdFrom: "pwa-admin",
      createdAt: new Date().toISOString(),
    }

    let strapiSaved = false
    if (SF_API_TOKEN) {
      const res = await fetch(`${SF_API_URL}/api/commercial-campaigns`, {
        method: "POST",
        headers: strapiHeaders,
        body: JSON.stringify({ data: payload }),
        cache: "no-store",
      }).catch(() => null)
      strapiSaved = !!res?.ok
    }

    return NextResponse.json({ success: true, campaign: payload, strapiSaved })
  } catch (error) {
    console.error("[admin/campaigns POST]", error)
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 })
  }
}
