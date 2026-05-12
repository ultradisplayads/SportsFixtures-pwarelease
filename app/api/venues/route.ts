import { NextRequest, NextResponse } from "next/server"
import { cachedProviderJson } from "@/lib/provider-cache"

const getSFToken = () => process.env.SF_API_TOKEN || ""
const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net")
  .replace(/\/api-docs\/?$/, "")
  .replace(/\/$/, "")

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const query = new URLSearchParams()
  if (searchParams.get("lat")) query.set("lat", searchParams.get("lat")!)
  if (searchParams.get("lng")) query.set("lng", searchParams.get("lng")!)
  query.set("radius", searchParams.get("radius") || "50")
  query.set("pagination[pageSize]", searchParams.get("pageSize") || "50")

  const token = getSFToken()

  try {
    const payload = await cachedProviderJson({
      provider: "strapi",
      endpoint: `GET:/api/venues?${query}`,
      ttlSeconds: 300,
      staleWhileRevalidateSeconds: 86400,
      cacheNull: true,
      fetcher: async () => {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)
        try {
          const response = await fetch(`${SF_API_URL}/api/venues?${query}`, {
            cache: "no-store",
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          })
          if (!response.ok) return { data: [], meta: {} }
          return response.json()
        } finally {
          clearTimeout(timeout)
        }
      },
    })

    return NextResponse.json(payload || { data: [], meta: {} }, {
      status: 200,
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" },
    })
  } catch (error: any) {
    if (error?.name !== "AbortError") {
      console.error("[venues] Fetch error:", error?.message)
    }
    return NextResponse.json({ data: [], meta: {} }, { status: 200 })
  }
}
