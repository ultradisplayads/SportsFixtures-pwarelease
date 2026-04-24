export interface PageMeta {
  title: string
  description: string
  keywords: string[]
  canonical?: string
  ogImage?: string
  structuredData?: Record<string, unknown>
}

export function generateMatchSEO(homeTeam: string, awayTeam: string, league: string, date: string): PageMeta {
  return {
    title: `${homeTeam} vs ${awayTeam} - Live Score, Fixtures & Tickets | Sports Fixtures`,
    description: `Watch ${homeTeam} vs ${awayTeam} live. Get ${league} fixtures, results, tickets, and time-zone accurate match information at Sports Fixtures.`,
    keywords: [homeTeam, awayTeam, league, "live score", "fixtures", "tickets", "sports bar", "watch live"],
    structuredData: {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: `${homeTeam} vs ${awayTeam}`,
      startDate: date,
      location: {
        "@type": "Place",
        name: "Stadium",
      },
      homeTeam: {
        "@type": "SportsTeam",
        name: homeTeam,
      },
      awayTeam: {
        "@type": "SportsTeam",
        name: awayTeam,
      },
    },
  }
}

export function generateLeagueSEO(leagueName: string, sport: string): PageMeta {
  return {
    title: `${leagueName} - Fixtures, Results, Table & Tickets | Sports Fixtures`,
    description: `Complete ${leagueName} coverage: fixtures, live scores, league table, tickets, and time-zone accurate ${sport} information.`,
    keywords: [leagueName, sport, "fixtures", "table", "standings", "tickets", "live scores"],
    structuredData: {
      "@context": "https://schema.org",
      "@type": "SportsOrganization",
      name: leagueName,
      sport: sport,
    },
  }
}

export function generateVenueSEO(venueName: string, city: string): PageMeta {
  return {
    title: `${venueName} - Sports Bar in ${city} | Watch Live Sports | Sports Fixtures`,
    description: `Find ${venueName} in ${city}. Watch live sports with great food and drinks. Time-zone accurate fixtures, tickets, and venue information.`,
    keywords: [venueName, city, "sports bar", "watch live sports", "sports venue", "great food places"],
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: venueName,
      address: {
        "@type": "PostalAddress",
        addressLocality: city,
      },
      servesCuisine: "Sports Bar",
    },
  }
}
