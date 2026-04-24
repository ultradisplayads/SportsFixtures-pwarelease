import { NextResponse } from "next/server"

/**
 * GET /api/seo/articles
 * Returns slugs + publishedAt + updatedAt for sitemap generation.
 */
export async function GET() {
  try {
    const STRAPI = process.env.STRAPI_URL
    if (STRAPI) {
      const res = await fetch(
        `${STRAPI}/api/articles?fields[0]=slug&fields[1]=updatedAt&fields[2]=publishedAt&pagination[pageSize]=500`,
        {
          next: { revalidate: 3600 },
          headers: process.env.STRAPI_API_TOKEN
            ? { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` }
            : {},
        },
      )
      if (res.ok) {
        const json = await res.json()
        const rows = (json?.data ?? []).map((a: { attributes?: { slug?: string; updatedAt?: string; publishedAt?: string }; slug?: string; updatedAt?: string; publishedAt?: string }) => ({
          slug: a.attributes?.slug ?? a.slug ?? "",
          publishedAt: a.attributes?.publishedAt ?? a.publishedAt ?? new Date().toISOString(),
          updatedAt: a.attributes?.updatedAt ?? a.updatedAt ?? new Date().toISOString(),
        }))
        return NextResponse.json(rows)
      }
    }
  } catch {
    // Fall through to empty
  }

  return NextResponse.json([])
}
