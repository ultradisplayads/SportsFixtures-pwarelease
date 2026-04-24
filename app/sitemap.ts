import type { MetadataRoute } from "next"

const SITE_URL = "https://sportsfixtures.net"

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Failed ${url}`)
  return res.json()
}

type SeoRouteRow = {
  id?: string | number
  slug?: string
  updatedAt?: string
  publishedAt?: string
}

function getIdLikeValue(row: SeoRouteRow): string | null {
  if (row.id !== undefined && row.id !== null) return String(row.id)
  if (row.slug) return row.slug
  return null
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL,               changeFrequency: "hourly",   priority: 1 },
    { url: `${SITE_URL}/live`,     changeFrequency: "minutely", priority: 0.95 },
    { url: `${SITE_URL}/fixtures`, changeFrequency: "hourly",   priority: 0.9 },
    { url: `${SITE_URL}/results`,  changeFrequency: "hourly",   priority: 0.9 },
    { url: `${SITE_URL}/news`,     changeFrequency: "hourly",   priority: 0.9 },
    { url: `${SITE_URL}/tv`,       changeFrequency: "hourly",   priority: 0.85 },
    { url: `${SITE_URL}/venues`,   changeFrequency: "daily",    priority: 0.85 },
  ]

  const [teams, leagues, venues, articles, matches] = await Promise.allSettled([
    getJson<SeoRouteRow[]>(`${SITE_URL}/api/seo/teams`),
    getJson<SeoRouteRow[]>(`${SITE_URL}/api/seo/leagues`),
    getJson<SeoRouteRow[]>(`${SITE_URL}/api/seo/venues`),
    getJson<SeoRouteRow[]>(`${SITE_URL}/api/seo/articles`),
    getJson<SeoRouteRow[]>(`${SITE_URL}/api/seo/matches`),
  ])

  const dynamicRoutes: MetadataRoute.Sitemap = []

  if (teams.status === "fulfilled") {
    dynamicRoutes.push(
      ...teams.value
        .map((row) => {
          const id = getIdLikeValue(row)
          if (!id) return null
          return {
            url: `${SITE_URL}/team/${id}`,
            lastModified: row.updatedAt ? new Date(row.updatedAt) : undefined,
            changeFrequency: "hourly" as const,
            priority: 0.8,
          }
        })
        .filter(Boolean) as MetadataRoute.Sitemap,
    )
  }

  if (leagues.status === "fulfilled") {
    dynamicRoutes.push(
      ...leagues.value
        .map((row) => {
          const id = getIdLikeValue(row)
          if (!id) return null
          return {
            url: `${SITE_URL}/league/${id}`,
            lastModified: row.updatedAt ? new Date(row.updatedAt) : undefined,
            changeFrequency: "hourly" as const,
            priority: 0.8,
          }
        })
        .filter(Boolean) as MetadataRoute.Sitemap,
    )
  }

  if (venues.status === "fulfilled") {
    dynamicRoutes.push(
      ...venues.value
        .map((row) => {
          const id = getIdLikeValue(row)
          if (!id) return null
          return {
            url: `${SITE_URL}/venues/${id}`,
            lastModified: row.updatedAt ? new Date(row.updatedAt) : undefined,
            changeFrequency: "daily" as const,
            priority: 0.75,
          }
        })
        .filter(Boolean) as MetadataRoute.Sitemap,
    )
  }

  if (articles.status === "fulfilled") {
    dynamicRoutes.push(
      ...articles.value
        .map((row) => {
          const id = getIdLikeValue(row)
          if (!id) return null
          return {
            url: `${SITE_URL}/news/${id}`,
            lastModified: new Date(row.updatedAt ?? row.publishedAt ?? Date.now()),
            changeFrequency: "daily" as const,
            priority: 0.8,
          }
        })
        .filter(Boolean) as MetadataRoute.Sitemap,
    )
  }

  if (matches.status === "fulfilled") {
    dynamicRoutes.push(
      ...matches.value
        .map((row) => {
          const id = getIdLikeValue(row)
          if (!id) return null
          return {
            url: `${SITE_URL}/match/${id}`,
            lastModified: row.updatedAt ? new Date(row.updatedAt) : undefined,
            changeFrequency: "hourly" as const,
            priority: 0.75,
          }
        })
        .filter(Boolean) as MetadataRoute.Sitemap,
    )
  }

  return [...staticRoutes, ...dynamicRoutes]
}
