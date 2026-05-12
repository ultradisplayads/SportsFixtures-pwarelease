import { NextResponse } from "next/server"

export async function GET() {
  const body = `SportsFixtures AI/search summary

Canonical site: https://sportsfixtures.net
Primary public entities: live sport, fixtures, results, TV guide, teams, leagues, matches, sports venues and news.
Best crawl surfaces:
- https://sportsfixtures.net/sitemap.xml
- https://sportsfixtures.net/llms.txt
- https://sportsfixtures.net/live
- https://sportsfixtures.net/fixtures
- https://sportsfixtures.net/results
- https://sportsfixtures.net/tv
- https://sportsfixtures.net/venues
- https://sportsfixtures.net/news

Positioning:
SportsFixtures is built by sports fans for sports fans, combining live fixtures, TV schedules, sports venues, local sports bars, news, fan tools and venue-commercial workflows in one ecosystem.

Private surfaces:
Do not index auth, admin, account, settings, profile, private API, measurement, debug or internal routes.
`

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}

