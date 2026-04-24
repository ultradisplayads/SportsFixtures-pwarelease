import type { Metadata } from "next"
import { FALLBACK_SEO_SETTINGS } from "@/lib/seo/config"

type BuildMetadataArgs = {
  title: string
  description: string
  canonical: string
  image?: string
  noIndex?: boolean
  keywords?: string[]
  publishedTime?: string
  modifiedTime?: string
  type?: "website" | "article"
  authorName?: string
}

export function buildMetadata({
  title,
  description,
  canonical,
  image,
  noIndex = false,
  keywords = [],
  publishedTime,
  modifiedTime,
  type = "website",
  authorName,
}: BuildMetadataArgs): Metadata {
  const s = FALLBACK_SEO_SETTINGS
  const fullTitle = `${title} | ${s.siteName}`
  const ogImage = image ?? s.defaultOgImage

  return {
    metadataBase: new URL(s.canonicalSiteUrl),
    title: fullTitle,
    description,
    ...(keywords.length ? { keywords } : {}),
    alternates: { canonical },
    authors: authorName ? [{ name: authorName }] : [{ name: s.organizationName }],
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
            "max-image-preview": "none",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type,
      url: canonical,
      siteName: s.siteName,
      title: fullTitle,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
      ...(type === "article" && modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      creator: s.defaultTwitterHandle,
      images: [ogImage],
    },
  }
}

/** Convenience: build a noindex metadata object for private/utility pages */
export function buildNoIndexMetadata(title: string, canonical: string): Metadata {
  return buildMetadata({
    title,
    description: "",
    canonical,
    noIndex: true,
  })
}
