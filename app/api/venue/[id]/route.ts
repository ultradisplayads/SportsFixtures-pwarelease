import { NextRequest, NextResponse } from "next/server"
import { getVenueBySlug, getPattayaVenues } from "@/lib/venues-pattaya"

export const runtime = "nodejs"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // Try slug lookup first, then numeric id scan
  const bySlug = await getVenueBySlug(id)
  if (bySlug) {
    return NextResponse.json(bySlug, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    })
  }

  // Numeric id fallback — scan all venues
  if (/^\d+$/.test(id)) {
    const all =await getPattayaVenues()
    const byId = all.find((v) => String(v.id) === id)
    if (byId) {
      return NextResponse.json(byId, {
        headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
      })
    }
  }

  return NextResponse.json({ error: "Venue not found" }, { status: 404 })
}
