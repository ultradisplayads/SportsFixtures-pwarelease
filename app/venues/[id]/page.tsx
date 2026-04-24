// app/venues/[id]/page.tsx
// Venue detail page — full field mapping from VenueCard including
// opening hours, social links, dual ratings, price band, cuisine tags,
// happy hour, and Google Maps embed when coords are available.

import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import {
  ArrowLeft, Clock, ExternalLink, Facebook, Globe,
  Instagram, MapPin, Music, Phone, Star, Tv, Utensils,
  Users, Wallet, Wifi,
} from "lucide-react"
import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"
import { AffiliateModule } from "@/components/affiliate-module"
import { FollowButton } from "@/components/follow-button"
import { VenueOffersStrip } from "@/components/venues/venue-offers-strip"
import { VenueActionButtons } from "@/components/venues/venue-action-buttons"
import JsonLd from "@/components/seo/json-ld"
import AiSummaryBlock from "@/components/seo/ai-summary-block"
import PageFactBlock from "@/components/seo/page-fact-block"
import SourceTransparency from "@/components/seo/source-transparency"
import AuthorTrustBlock from "@/components/seo/author-trust-block"
import RelatedEntitiesBlock from "@/components/seo/related-entities-block"
import FaqBlock from "@/components/seo/faq-block"
import { buildMetadata } from "@/lib/seo/metadata"
import { venueSchema, breadcrumbSchema, faqSchema } from "@/lib/seo/schema"
import { venueTitle } from "@/lib/seo/title-templates"
import { buildEntitySummary } from "@/lib/seo/entity-summary"
import { absoluteUrl } from "@/lib/seo/url"
import { hasPlaceholderContent, isPageIndexable } from "@/lib/seo/page-quality"
import { normaliseVenue } from "@/lib/venue-discovery"
import { getVenueBySlug } from "@/lib/venues-pattaya"
import { venueName as getVenueName, venueDescription as getVenueDescription, buildRelatedLinks, mapVenueFacts } from "@/lib/venue-helpers"
import type { VenueCard } from "@/types/venues"

interface Props {
  params: Promise<{ id: string }>
}

const STATIC_ROUTES: Record<string, string> = {
  "owner-signup": "/venues/owner-signup",
  pricing: "/venues/pricing",
}

const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net")
  .replace(/\/api-docs\/?$/, "")
  .replace(/\/$/, "")
const SF_API_TOKEN = process.env.SF_API_TOKEN || ""
const headers: HeadersInit = {
  "Content-Type": "application/json",
  ...(SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {}),
}

async function fetchVenueBySlug(slug: string): Promise<Record<string, any> | null> {
  try {
    const res = await fetch(
      `${SF_API_URL}/api/venues?filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[pageSize]=1`,
      { cache: "no-store", headers },
    )
    if (!res.ok) return null
    const json = await res.json()
    const items: any[] = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : []
    return items[0] ?? null
  } catch { return null }
}

async function fetchVenueById(id: string): Promise<Record<string, any> | null> {
  try {
    const res = await fetch(`${SF_API_URL}/api/venues/${id}`, { cache: "no-store", headers })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data ?? json ?? null
  } catch { return null }
}

async function resolveVenue(idOrSlug: string): Promise<Record<string, any> | null> {
  if (/^\d+$/.test(idOrSlug)) return fetchVenueById(idOrSlug)
  return fetchVenueBySlug(idOrSlug)
}

// ── Venue type badge label ─────────────────────────────────────────────────────

const VENUE_TYPE_LABEL: Record<string, string> = {
  sports_bar:       "Sports Bar",
  bar:              "Bar",
  pub:              "Pub",
  restaurant:       "Restaurant",
  cafe:             "Cafe",
  club:             "Club",
  rooftop_bar:      "Rooftop Bar",
  bistro:           "Bistro",
  fine_dining:      "Fine Dining",
  hotel_restaurant: "Hotel Restaurant",
}

// ── Rating pill ────────────────────────────────────────────────────────────────

function RatingPill({ rating, count, label }: { rating: number; count?: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-yellow-500/10 px-3 py-2 text-center">
      <div className="flex items-center gap-1 text-sm font-bold text-yellow-600 dark:text-yellow-400">
        <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        {rating.toFixed(1)}
      </div>
      <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">{label}</p>
      {count != null && <p className="text-[10px] text-muted-foreground">{count.toLocaleString()} reviews</p>}
    </div>
  )
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: idOrSlug } = await params
  if (STATIC_ROUTES[idOrSlug]) return {}

  const raw = SF_API_TOKEN ? await resolveVenue(idOrSlug) : null
  const venue: VenueCard | null = raw ? normaliseVenue(raw) : (getVenueBySlug(idOrSlug) ?? null)
  if (!venue) return {}

  const name        = getVenueName(venue)
  const description = getVenueDescription(venue) ?? name
  const title       = venueTitle(name, venue.city ?? undefined)
  const related     = buildRelatedLinks(venue, idOrSlug)

  const summary = buildEntitySummary({
    entityType: "venue",
    name,
    city: venue.city ?? undefined,
    country: venue.country ?? undefined,
    facts: [
      venue.openingHours ? `Open: ${venue.openingHours}.` : "",
      venue.screenCount ? `${venue.screenCount} screens.` : "",
    ].filter(Boolean),
  })

  const indexable = isPageIndexable({
    hasSummary: Boolean(summary),
    hasKeyFacts: Boolean(venue.address || venue.city || venue.openingHours),
    hasFreshnessBlock: true,
    hasRelatedLinks: related.length > 0,
    hasPlaceholderContent: hasPlaceholderContent([name, description]),
  })

  return buildMetadata({
    title,
    description,
    canonical: absoluteUrl(`/venues/${idOrSlug}`),
    image: venue.coverImage ?? venue.image ?? undefined,
    noIndex: !indexable,
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function VenueDetailPage({ params }: Props) {
  const { id: idOrSlug } = await params

  if (STATIC_ROUTES[idOrSlug]) redirect(STATIC_ROUTES[idOrSlug])

  // Only call SF API when a token is configured — without one the staging server
  // returns unrelated venues (stadiums etc.) which would override our local data.
  const raw = SF_API_TOKEN ? await resolveVenue(idOrSlug) : null
  const venue: VenueCard = raw
    ? normaliseVenue(raw)
    : (getVenueBySlug(idOrSlug) ?? notFound())

  // Canonical derived variables
  const venueName        = getVenueName(venue)
  const venueDescription = getVenueDescription(venue)
  const faqItems        = venue.seo?.faq_items ?? []
  const relatedLinks    = buildRelatedLinks(venue, idOrSlug)
  const factItems       = mapVenueFacts(venue)

  // Supporting derived values
  const venuePath = `/venues/${idOrSlug}`
  const address   = [venue.address, venue.area, venue.city].filter(Boolean).join(", ")
  const cuisineTags = (venue.cuisine ?? [])
    .concat((venue.facilities ?? []).filter((f) => f.startsWith("cuisine:")).map((f) => f.replace("cuisine:", "").trim()))
    .filter((v, i, a) => a.indexOf(v) === i)
  const featureTags = (venue.facilities ?? []).filter((f) => !f.startsWith("cuisine:"))
  const hasRatings  = venue.tripadvisorRating || venue.googleRating || venue.rating
  const mapEmbedUrl = venue.latitude && venue.longitude
    ? `https://maps.google.com/maps?q=${venue.latitude},${venue.longitude}&z=16&output=embed`
    : null

  const summary = buildEntitySummary({
    entityType: "venue",
    name: venueName,
    city: venue.city ?? undefined,
    country: venue.country ?? undefined,
    facts: [
      venue.openingHours ? `Open: ${venue.openingHours}.` : "",
      venue.screenCount ? `${venue.screenCount} screens.` : "",
      venue.sports?.length ? `Shows: ${venue.sports.join(", ")}.` : "",
    ].filter(Boolean),
  })

  const schemaType =
    venue.venueType === "restaurant" || venue.venueType === "fine_dining"
      ? "LocalBusiness"
      : "SportsBar"

  const FEATURE_ICONS: Record<string, React.ReactNode> = {
    outdoor_seating: <MapPin   className="h-3 w-3" />,
    live_music:      <Music    className="h-3 w-3" />,
    family_friendly: <Users    className="h-3 w-3" />,
    food:            <Utensils className="h-3 w-3" />,
    projector:       <Tv      className="h-3 w-3" />,
    commentary:      <Wifi    className="h-3 w-3" />,
    reservable:      <Phone   className="h-3 w-3" />,
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <JsonLd
        data={[
          venueSchema({
            name: venueName,
            path: `/venues/${idOrSlug}`,
            description: venueDescription,
            image: venue.image ?? undefined,
            address: venue.address ?? undefined,
            latitude: venue.latitude ?? undefined,
            longitude: venue.longitude ?? undefined,
            phone: venue.phone ?? undefined,
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Venues", path: "/venues" },
            { name: venueName, path: `/venues/${idOrSlug}` },
          ]),
          ...(faqItems.length ? [faqSchema(faqItems)] : []),
        ]}
      />
      <HeaderMenu />
      <main className="flex-1 space-y-3 p-4 max-w-2xl mx-auto w-full">

        {/* Back */}
        <Link
          href="/venues"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Places to Watch
        </Link>

        {/* Hero card */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">

          {/* Name + type badge + follow */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {venue.venueType && (
                <span className="mb-1.5 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  {VENUE_TYPE_LABEL[venue.venueType] ?? venue.venueType}
                </span>
              )}
              <h1 className="text-2xl font-bold leading-tight text-balance">{venueName}</h1>
              {address && (
                <div className="mt-1.5 flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{address}</span>
                </div>
              )}
            </div>
            <FollowButton
              entityType="venue"
              entityId={venue.id}
              entityName={venue.name}
              entityMeta={{ city: venue.city ?? "", country: venue.country ?? "" }}
              size="sm"
            />
          </div>

          {/* Ratings row */}
          {hasRatings && (
            <div className="flex gap-2 flex-wrap">
              {venue.tripadvisorRating != null && (
                <RatingPill rating={venue.tripadvisorRating} count={venue.tripadvisorReviewCount} label="Tripadvisor" />
              )}
              {venue.googleRating != null && (
                <RatingPill rating={venue.googleRating} count={venue.googleReviewCount} label="Google" />
              )}
              {!venue.tripadvisorRating && !venue.googleRating && venue.rating != null && (
                <RatingPill rating={venue.rating} label="Rating" />
              )}
            </div>
          )}

          {/* Key info chips */}
          <div className="flex flex-wrap gap-2">
            {venue.priceBand && (
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
                <Wallet className="h-3 w-3 text-muted-foreground" />
                {venue.priceBand}
              </div>
            )}
            {venue.screenCount != null && venue.screenCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
                <Tv className="h-3 w-3 text-muted-foreground" />
                {venue.screenCount} screens
              </div>
            )}
            {venue.openingHours && (
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium">
                <Clock className="h-3 w-3 text-muted-foreground" />
                {venue.openingHours}
              </div>
            )}
            {venue.happyHour && (
              <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                <Star className="h-3 w-3" />
                Happy Hour: {venue.happyHour}
              </div>
            )}
          </div>

          {/* Sports shown */}
          {Array.isArray(venue.sports) && venue.sports.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sports shown</p>
              <div className="flex flex-wrap gap-1.5">
                {venue.sports.map((sport) => (
                  <span key={sport} className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground capitalize">
                    {sport}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="rounded-2xl border border-border bg-card p-4">
          <VenueActionButtons venue={venue} prominentDirections />
        </div>

        {/* Offers */}
        {(venue.offers?.length ?? 0) > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Offers</h2>
            <VenueOffersStrip offers={venue.offers!} />
          </div>
        )}

        {/* Food & Drink / Facilities */}
        {(cuisineTags.length > 0 || featureTags.length > 0) && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            {cuisineTags.length > 0 && (
              <div>
                <h2 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold">
                  <Utensils className="h-4 w-4 text-primary" aria-hidden="true" />
                  Food &amp; Drink
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {cuisineTags.map((t) => (
                    <span key={t} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary capitalize">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {featureTags.length > 0 && (
              <div>
                <h2 className="mb-2.5 text-sm font-semibold">Facilities</h2>
                <div className="flex flex-wrap gap-1.5">
                  {featureTags.map((f) => (
                    <span key={f} className="flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs capitalize">
                      {FEATURE_ICONS[f] ?? null}
                      {f.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Links row — website, socials, tripadvisor */}
        {(venue.website || venue.facebookUrl || venue.instagramUrl || venue.tripadvisorUrl) && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <h2 className="mb-2 text-sm font-semibold">Links</h2>
            {venue.website && (
              <a
                href={venue.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-2.5 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Globe className="h-4 w-4 text-primary" />
                  Official Website
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            )}
            {venue.tripadvisorUrl && (
              <a
                href={venue.tripadvisorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-2.5 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Star className="h-4 w-4 text-green-600" />
                  Tripadvisor Reviews
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            )}
            <div className="flex gap-2">
              {venue.facebookUrl && (
                <a
                  href={venue.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
                >
                  <Facebook className="h-4 w-4 text-blue-600" />
                  Facebook
                </a>
              )}
              {venue.instagramUrl && (
                <a
                  href={venue.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
                >
                  <Instagram className="h-4 w-4 text-pink-500" />
                  Instagram
                </a>
              )}
            </div>
          </div>
        )}

        {/* Map embed — only when lat/lng available */}
        {mapEmbedUrl && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <iframe
              src={mapEmbedUrl}
              className="w-full h-52"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Map for ${venue.name}`}
              aria-label={`Google Maps location for ${venue.name}`}
            />
          </div>
        )}

        {/* SEO: summary, key facts, source transparency, related links */}
        <AiSummaryBlock summary={summary} />

        <PageFactBlock items={factItems} />

        <SourceTransparency
          sourceLabel="SportsFixtures data layer"
          methodology="Venue data collected from local research and editorial review"
        />

        <AuthorTrustBlock
          authorName={venue.seo?.author_name ?? undefined}
          reviewedBy={venue.seo?.reviewed_by ?? undefined}
          policyNote="This venue page is maintained from structured venue data and editorial review rules."
        />

        <FaqBlock items={faqItems} />

        <RelatedEntitiesBlock items={relatedLinks} />

        {/* Affiliate module */}
        <AffiliateModule context="venue" />

      </main>
      <BottomNav />
    </div>
  )
}
