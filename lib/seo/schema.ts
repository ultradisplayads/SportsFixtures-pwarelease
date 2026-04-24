import { absoluteUrl } from "@/lib/seo/url"
import { FALLBACK_SEO_SETTINGS } from "@/lib/seo/config"

const s = FALLBACK_SEO_SETTINGS

export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: s.siteName,
    alternateName: s.alternateSiteName,
    url: s.canonicalSiteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${s.canonicalSiteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: s.organizationName,
    url: s.canonicalSiteUrl,
    logo: {
      "@type": "ImageObject",
      url: s.organizationLogo,
    },
    sameAs: s.organizationSameAs ?? [],
  }
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function sportsTeamSchema(args: {
  name: string
  path: string
  description?: string
  logo?: string
  sport?: string
  league?: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: args.name,
    url: absoluteUrl(args.path),
    ...(args.description ? { description: args.description } : {}),
    ...(args.logo ? { logo: args.logo } : {}),
    ...(args.sport ? { sport: args.sport } : {}),
    ...(args.league
      ? { memberOf: { "@type": "SportsOrganization", name: args.league } }
      : {}),
  }
}

export function sportsEventSchema(args: {
  name: string
  path: string
  description?: string
  startDate: string
  endDate?: string
  competitionName?: string
  homeTeam?: string
  awayTeam?: string
  venueName?: string
  venueAddress?: string
  image?: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: args.name,
    url: absoluteUrl(args.path),
    startDate: args.startDate,
    ...(args.endDate ? { endDate: args.endDate } : {}),
    ...(args.description ? { description: args.description } : {}),
    ...(args.image ? { image: [args.image] } : {}),
    ...(args.competitionName
      ? { sportsCompetition: { "@type": "SportsOrganization", name: args.competitionName } }
      : {}),
    competitor: [args.homeTeam, args.awayTeam]
      .filter(Boolean)
      .map((team) => ({ "@type": "SportsTeam", name: team })),
    ...(args.venueName
      ? {
          location: {
            "@type": "Place",
            name: args.venueName,
            ...(args.venueAddress ? { address: args.venueAddress } : {}),
          },
        }
      : {}),
  }
}

export function venueSchema(args: {
  name: string
  path: string
  venueType?: "SportsBar" | "BarOrPub" | "LocalBusiness"
  description?: string
  image?: string
  address?: string
  city?: string
  country?: string
  latitude?: number
  longitude?: number
  phone?: string
  url?: string
}) {
  const schemaType = args.venueType ?? "SportsBar"
  return {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: args.name,
    url: args.url ?? absoluteUrl(args.path),
    ...(args.description ? { description: args.description } : {}),
    ...(args.image ? { image: [args.image] } : {}),
    ...(args.address || args.city || args.country
      ? {
          address: {
            "@type": "PostalAddress",
            ...(args.address ? { streetAddress: args.address } : {}),
            ...(args.city ? { addressLocality: args.city } : {}),
            ...(args.country ? { addressCountry: args.country } : {}),
          },
        }
      : {}),
    ...(args.phone ? { telephone: args.phone } : {}),
    ...(args.latitude != null && args.longitude != null
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: args.latitude,
            longitude: args.longitude,
          },
        }
      : {}),
  }
}

export function articleSchema(args: {
  headline: string
  path: string
  description?: string
  image?: string
  datePublished: string
  dateModified?: string
  authorName?: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: args.headline,
    ...(args.description ? { description: args.description } : {}),
    ...(args.image ? { image: [args.image] } : {}),
    datePublished: args.datePublished,
    dateModified: args.dateModified ?? args.datePublished,
    mainEntityOfPage: absoluteUrl(args.path),
    author: args.authorName
      ? { "@type": "Person", name: args.authorName }
      : { "@type": "Organization", name: s.organizationName },
    publisher: {
      "@type": "Organization",
      name: s.organizationName,
      logo: { "@type": "ImageObject", url: s.organizationLogo },
    },
  }
}

export function faqSchema(items: Array<{ question: string; answer: string }>) {
  if (!items.length) return null
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  }
}
