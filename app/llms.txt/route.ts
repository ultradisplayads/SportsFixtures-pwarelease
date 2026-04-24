import { NextResponse } from "next/server"

export async function GET() {
  const body = `# SportsFixtures

> SportsFixtures provides live sports fixtures, results, TV schedules, venues, and sports news.
> Time-zone accurate data for all sports globally.

## Core public sections
- https://sportsfixtures.net/live
- https://sportsfixtures.net/fixtures
- https://sportsfixtures.net/results
- https://sportsfixtures.net/news
- https://sportsfixtures.net/tv
- https://sportsfixtures.net/venues

## High-value entity types
- /team/[slug] — team fixtures, results, squad, TV schedule
- /league/[slug] — league fixtures, standings, TV coverage
- /match/[slug] — match details, live score, TV channels, venue
- /venues/[slug] — sports bars and venues showing live sport
- /news/[slug] — sports news articles

## Sitemap
- https://sportsfixtures.net/sitemap.xml

## Notes
- All public entity pages are SSR-rendered and extractable without JavaScript
- Private and utility pages (/account, /settings, /auth, /admin) are not intended for indexing
- Live data refreshes hourly; results and scores update in real time
`

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
