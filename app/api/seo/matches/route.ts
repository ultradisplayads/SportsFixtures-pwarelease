import { NextResponse } from "next/server"

/**
 * GET /api/seo/matches
 * Returns slugs + updatedAt for sitemap generation.
 */
export async function GET() {
  try {
    const STRAPI = process.env.STRAPI_URL
    if (STRAPI) {
      const res = await fetch(`${STRAPI}/api/matches?fields[0]=slug&fields[1]=updatedAt&pagination[pageSize]=500`, {
        next: { revalidate: 1800 },
        headers: process.env.STRAPI_API_TOKEN
          ? { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` }
          : {},
      })
      if (res.ok) {
        const json = await res.json()
        const rows = (json?.data ?? []).map((m: { attributes?: { slug?: string; updatedAt?: string }; slug?: string; updatedAt?: string }) => ({
          slug: m.attributes?.slug ?? m.slug ?? "",
          updatedAt: m.attributes?.updatedAt ?? m.updatedAt ?? new Date().toISOString(),
        }))
        return NextResponse.json(rows)
      }
    }
  } catch {
    // Fall through to empty
  }

  return NextResponse.json([])
}
