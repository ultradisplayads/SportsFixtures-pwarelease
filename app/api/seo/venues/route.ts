import { NextResponse } from "next/server"
import { getPattayaVenues } from "@/lib/venues-pattaya"

/**
 * GET /api/seo/venues
 * Returns slugs + updatedAt for sitemap generation.
 * Merges live Strapi venues (when available) with the Pattaya dataset.
 */
export async function GET() {
  const venues = await getPattayaVenues()
  const localVenues = venues.map((v) => ({
    slug: v.slug ?? v.id,
    updatedAt: new Date().toISOString(),
  }))

  try {
    const STRAPI = process.env.STRAPI_URL
    if (STRAPI) {
      const res = await fetch(`${STRAPI}/api/venues?fields[0]=slug&fields[1]=updatedAt&pagination[pageSize]=500`, {
        next: { revalidate: 3600 },
        headers: process.env.STRAPI_API_TOKEN
          ? { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` }
          : {},
      })
      if (res.ok) {
        const json = await res.json()
        const strapiVenues = (json?.data ?? []).map((v: { attributes?: { slug?: string; updatedAt?: string }; slug?: string; updatedAt?: string }) => ({
          slug: v.attributes?.slug ?? v.slug ?? "",
          updatedAt: v.attributes?.updatedAt ?? v.updatedAt ?? new Date().toISOString(),
        }))
        // Merge: Strapi takes precedence, local fills the rest
        const slugSet = new Set(strapiVenues.map((v: { slug: string }) => v.slug))
        const merged = [...strapiVenues, ...localVenues.filter((v) => !slugSet.has(v.slug))]
        return NextResponse.json(merged)
      }
    }
  } catch {
    // Fall through to local only
  }

  return NextResponse.json(localVenues)
}
