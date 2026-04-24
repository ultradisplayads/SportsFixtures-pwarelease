import { NextRequest, NextResponse } from "next/server"
import { pushIndexNow } from "@/lib/seo/indexnow"

/**
 * POST /api/indexnow
 * Body: { urls: string[] }
 *
 * Call this from server actions or background jobs when:
 *   - match pages are created or materially updated
 *   - result pages change
 *   - article pages publish or update
 *   - venue pages materially change
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const urls: string[] = Array.isArray(body?.urls) ? body.urls : []

    if (!urls.length) {
      return NextResponse.json({ error: "No URLs provided" }, { status: 400 })
    }

    const result = await pushIndexNow(urls)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 },
    )
  }
}
