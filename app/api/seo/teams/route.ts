import { NextResponse } from "next/server"

/**
 * GET /api/seo/teams
 * Returns slugs + updatedAt for sitemap generation.
 * Hydrate from Strapi once the team entity model is live.
 */
export async function GET() {
  try {
    const STRAPI = process.env.STRAPI_URL
    if (STRAPI) {
      const res = await fetch(`${STRAPI}/api/teams?fields[0]=slug&fields[1]=updatedAt&pagination[pageSize]=500`, {
        next: { revalidate: 300, tags: ["strapi", "seo", "sitemap", "strapi:team"] },
        headers: process.env.STRAPI_API_TOKEN
          ? { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` }
          : {},
      })
      if (res.ok) {
        const json = await res.json()
        const rows = (json?.data ?? []).map((t: { attributes?: { slug?: string; updatedAt?: string }; slug?: string; updatedAt?: string }) => ({
          slug: t.attributes?.slug ?? t.slug ?? "",
          updatedAt: t.attributes?.updatedAt ?? t.updatedAt ?? new Date().toISOString(),
        }))
        return NextResponse.json(rows, {
          headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
        })
      }
    }
  } catch {
    // Fall through to empty
  }

  return NextResponse.json([], {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
  })
}
