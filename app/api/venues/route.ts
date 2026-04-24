import { NextRequest, NextResponse } from "next/server"

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

    clearTimeout(timeout)
    const text = await response.text()

    if (!response.ok) {
      // 401 = bad/missing token, 404 = no venues — return empty, don't throw
      return NextResponse.json({ data: [], meta: {} }, { status: 200 })
    }

    try {
      return NextResponse.json(JSON.parse(text))
    } catch {
      return NextResponse.json({ data: [], meta: {} }, { status: 200 })
    }
  } catch (error: any) {
    clearTimeout(timeout)
    if (error?.name !== "AbortError") {
      console.error("[venues] Fetch error:", error?.message)
    }
    return NextResponse.json({ data: [], meta: {} }, { status: 200 })
  }
}
