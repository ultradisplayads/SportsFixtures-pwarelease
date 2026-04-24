import type { MetadataRoute } from "next"

/**
 * robots.ts — v2.2 spec
 *
 * Public crawlable: core content, entity pages, TV guide, venues.
 * Disallowed: API, auth, account, admin, private, and utility routes.
 * OAI-SearchBot gets identical rules to allow ChatGPT search indexing.
 */
export default function robots(): MetadataRoute.Robots {
  const allowList = [
    "/",
    "/live",
    "/fixtures",
    "/results",
    "/news",
    "/tv",
    "/venues",
    "/team/",
    "/league/",
    "/match/",
  ]

  const disallowList = [
    "/api/",
    "/account",
    "/profile",
    "/settings",
    "/alerts",
    "/push",
    "/auth",
    "/admin",
    "/private",
    "/search",
    "/premium",
  ]

  return {
    rules: [
      { userAgent: "*", allow: allowList, disallow: disallowList },
      { userAgent: "OAI-SearchBot", allow: allowList, disallow: disallowList },
      { userAgent: "GPTBot", allow: allowList, disallow: disallowList },
      { userAgent: "anthropic-ai", allow: allowList, disallow: disallowList },
      { userAgent: "Bingbot", allow: allowList, disallow: disallowList },
    ],
    sitemap: "https://sportsfixtures.net/sitemap.xml",
    host: "https://sportsfixtures.net",
  }
}
