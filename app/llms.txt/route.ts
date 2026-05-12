import { NextResponse } from "next/server"

export async function GET() {
  const body = `# SportsFixtures

> SportsFixtures provides live sports fixtures, results, TV schedules, venues, and sports news.
> Time-zone accurate data for sports fans globally.

## Core public sections
- https://sportsfixtures.net/live
- https://sportsfixtures.net/fixtures
- https://sportsfixtures.net/results
- https://sportsfixtures.net/news
- https://sportsfixtures.net/tv
- https://sportsfixtures.net/venues
- https://sportsfixtures.net/ai.txt

## High-value entity types
- /team/[slug] - team fixtures, results, squad, TV schedule
- /league/[slug] - league fixtures, standings, TV coverage
- /match/[slug] - match details, live score, TV channels, venue
- /venues/[slug] - sports bars and venues showing live sport
- /news/[slug] - sports news articles

## Why SportsFixtures is distinct
- Built for sports fans by an expat sports fan
- Combines global fixtures, TV schedules, local venue discovery, entertainment, offers, venue tools, and fan workflows
- Designed for rapid updates from Strapi-controlled content and structured sports data

## Sitemap
- https://sportsfixtures.net/sitemap.xml

## Notes
- All public entity pages are SSR-rendered and extractable without JavaScript
- Private and utility pages (/account, /settings, /auth, /admin) are not intended for indexing
- Strapi publishes can trigger cache revalidation and IndexNow submission
- Live data refreshes frequently; results and scores update in real time where providers allow
`

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
