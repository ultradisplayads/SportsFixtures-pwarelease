import { NextRequest, NextResponse } from "next/server"

// Thin proxy to /api/venues/discovery with eventId pre-set.
// Keeps the for-event URL contract clean for match pages.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params
  const sp = req.nextUrl.searchParams

  const qs = new URLSearchParams()
  qs.set("eventId", eventId)
  if (sp.get("sport")) qs.set("sport", sp.get("sport")!)
  if (sp.get("competitionId")) qs.set("competitionId", sp.get("competitionId")!)
  if (sp.get("lat")) qs.set("lat", sp.get("lat")!)
  if (sp.get("lng")) qs.set("lng", sp.get("lng")!)
  if (sp.get("followedIds")) qs.set("followedIds", sp.get("followedIds")!)
  if (sp.get("maxDistanceKm")) qs.set("maxDistanceKm", sp.get("maxDistanceKm")!)

  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    `${req.nextUrl.protocol}//${req.nextUrl.host}`

  const res = await fetch(`${base}/api/venues/discovery?${qs}`, {
    cache: "no-store",
  })

  const json = res.ok ? await res.json() : { items: [], filters: {} }
  return NextResponse.json(json)
}
