import { NextRequest, NextResponse } from "next/server"
import { fetchStrapiAds, filterByPlacement, type AdPlacement } from "@/lib/strapi-ads"

// Revalidate edge cache every 60 s so Strapi changes propagate quickly
export const revalidate = 60

export async function GET(req: NextRequest) {
  const placement = (req.nextUrl.searchParams.get("placement") ?? "all") as AdPlacement
  try {
    const all  = await fetchStrapiAds()
    const slots = filterByPlacement(all, placement)
    return NextResponse.json(slots, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
