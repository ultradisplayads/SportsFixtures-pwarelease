/**
 * Title templates for all entity types.
 * Rule: use Strapi override first, then template, then append site name via metadata builder.
 */

export function teamTitle(name: string): string {
  return `${name} Fixtures, Results, Squad & TV Schedule`
}

export function leagueTitle(name: string): string {
  return `${name} Fixtures, Results, Standings & TV Coverage`
}

export function matchTitle(home: string, away: string): string {
  return `${home} vs ${away}: Live Score, TV & Match Details`
}

export function venueTitle(name: string, city?: string): string {
  return city
    ? `${name} ${city} | Sports Bar, Live Sport & TV Coverage`
    : `${name} | Sports Venue, Live Sport & TV Coverage`
}

export function articleTitle(headline: string): string {
  return headline
}

export function tvTitle(channelOrEvent: string): string {
  return `${channelOrEvent} | Live Sport TV Schedule`
}

export function cityWatchTitle(sport: string, city: string): string {
  return `Where to Watch ${sport} in ${city} | Sports Bars & Venues`
}
