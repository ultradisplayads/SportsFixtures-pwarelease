import { NextRequest, NextResponse } from "next/server"
import { cachedProviderJson } from "@/lib/provider-cache"

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net")
  .replace(/\/api-docs\/?$/, "")
  .replace(/\/$/, "")

const getSFToken = () => process.env.SF_API_TOKEN || ""

async function fetchEventFromStrapi(id: string) {
  const token = getSFToken()
  const url = `${SF_API_URL}/api/events/${id}`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  let text = ""
  let ok = false

  try {
    // @ts-ignore - undici is available in the Node.js runtime
    const { fetch: nodeFetch } = await import("undici")
    const res = await nodeFetch(url, { method: "GET", headers })
    ok = res.status >= 200 && res.status < 300
    text = ok ? await res.text() : ""
  } catch {
    try {
      const res = await globalThis.fetch(url, { cache: "no-store", headers })
      ok = res.ok
      text = ok ? await res.text() : ""
    } catch {
      return { success: false, data: null }
    }
  }

  if (!ok) return { success: false, data: null }

  try {
    return JSON.parse(text)
  } catch {
    return { success: false, data: null }
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json(
      { success: false, error: "Valid numeric event ID is required" },
      { status: 400 },
    )
  }

  try {
    const payload = await cachedProviderJson({
      provider: "strapi",
      endpoint: `GET:/api/events/${id}`,
      ttlSeconds: 300,
      staleWhileRevalidateSeconds: 86400,
      cacheNull: true,
      fetcher: () => fetchEventFromStrapi(id),
    })

    return NextResponse.json(payload || { success: false, data: null }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" },
    })
  } catch {
    return NextResponse.json({ success: false, data: null }, { status: 200 })
  }
}
