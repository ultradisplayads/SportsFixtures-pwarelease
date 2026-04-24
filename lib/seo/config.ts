export type SeoSettings = {
  siteName: string
  alternateSiteName?: string
  canonicalSiteUrl: string
  defaultMetaTitleTemplate: string
  defaultMetaDescription: string
  defaultOgImage: string
  defaultTwitterHandle?: string
  organizationName: string
  organizationLogo: string
  organizationSameAs?: string[]
  indexNowEnabled: boolean
  llmsTxtEnabled: boolean
  discoverLargeImagesEnabled: boolean
  defaultSourceLabel?: string
  defaultMethodologyNote?: string
  brandDescriptionShort?: string
  brandDescriptionLong?: string
}

export const FALLBACK_SEO_SETTINGS: SeoSettings = {
  siteName: "SportsFixtures",
  alternateSiteName: "SF",
  canonicalSiteUrl: "https://sportsfixtures.net",
  defaultMetaTitleTemplate: "%s | SportsFixtures",
  defaultMetaDescription:
    "Live sports fixtures, results, TV schedules, venues, breaking news, and places to watch near you.",
  defaultOgImage: "https://sportsfixtures.net/og-image.png",
  defaultTwitterHandle: "@sportsfixtures",
  organizationName: "SportsFixtures",
  organizationLogo: "https://sportsfixtures.net/logo.png",
  organizationSameAs: [
    "https://twitter.com/sportsfixtures",
    "https://www.facebook.com/sportsfixtures",
  ],
  indexNowEnabled: true,
  llmsTxtEnabled: true,
  discoverLargeImagesEnabled: true,
  defaultSourceLabel: "SportsFixtures data layer",
  defaultMethodologyNote: "Live sports data and editorial enrichment",
  brandDescriptionShort: "Live fixtures, results, TV & venues",
  brandDescriptionLong:
    "SportsFixtures provides time-zone accurate live sports fixtures, results, TV schedules, venue finders, and breaking sports news for fans worldwide.",
}
