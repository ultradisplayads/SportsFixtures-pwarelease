import { Suspense } from "react"
import type { Metadata } from "next"

import JsonLd from "@/components/seo/json-ld"
import AiSummaryBlock from "@/components/seo/ai-summary-block"
import PageFactBlock from "@/components/seo/page-fact-block"
import SourceTransparency from "@/components/seo/source-transparency"
import AuthorTrustBlock from "@/components/seo/author-trust-block"
import RelatedEntitiesBlock from "@/components/seo/related-entities-block"
import FaqBlock from "@/components/seo/faq-block"
import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"
import { LeagueHeader } from "@/components/league-header"
import { LeagueTable } from "@/components/league-table"
import { LeagueFixtures } from "@/components/league-fixtures"
import { SkeletonLoader } from "@/components/skeleton-loader"

import { buildMetadata } from "@/lib/seo/metadata"
import { breadcrumbSchema, faqSchema, organizationSchema } from "@/lib/seo/schema"
import { buildEntitySummary } from "@/lib/seo/entity-summary"
import { leagueTitle } from "@/lib/seo/title-templates"
import { absoluteUrl } from "@/lib/seo/url"
import { hasPlaceholderContent, isPageIndexable } from "@/lib/seo/page-quality"
import { getLeagueTable, getNextEvents, getPastEvents } from "@/app/actions/sports-api"
import { getSFLeagueById } from "@/lib/sf-api"

// ── Types ─────────────────────────────────────────────────────────────────────

type LeagueSeo = {
  seo_title_override?: string | null
  seo_description_override?: string | null
  og_image_override?: string | null
  index_status?: "index" | "noindex" | null
  short_summary?: string | null
  key_facts?: string[] | null
  source_label?: string | null
  methodology_note?: string | null
  faq_items?: Array<{ question: string; answer: string }> | null
}

type LeagueApiResponse = {
  idLeague?: string | number
  strLeague?: string | null
  strSport?: string | null
  strCountry?: string | null
  strDescriptionEN?: string | null
  strBadge?: string | null
  strLogo?: string | null
  published_at?: string | null
  updated_at?: string | null
  author_name?: string | null
  reviewed_by?: string | null
  seo?: LeagueSeo | null
}

// ── Data helpers ──────────────────────────────────────────────────────────────

async function getLeague(id: string): Promise<LeagueApiResponse> {
  // Fetch directly from the action so this works server-side without an HTTP round-trip
  const raw = await getSFLeagueById(id)
  if (!raw) throw new Error(`League ${id} not found`)
  return raw as unknown as LeagueApiResponse
}

function mapLeagueFacts(
  league: LeagueApiResponse,
): Array<{ label: string; value: string }> {
  const candidates: Array<{ label: string; value: string | null | undefined }> = [
    { label: "Sport",       value: league.strSport },
    { label: "Country",     value: league.strCountry },
    { label: "Competition", value: league.strLeague },
  ]
  return candidates
    .filter((f) => f.value && String(f.value).trim().length > 0)
    .map((f) => ({ label: f.label, value: String(f.value) }))
}

function buildRelatedLinks(league: LeagueApiResponse, id: string) {
  const name = league.strLeague ?? "League"
  return [
    { href: `/league/${id}`,  label: `${name} overview` },
    { href: "/fixtures",      label: `${name} fixtures` },
    { href: "/results",       label: `${name} results` },
    { href: "/news",          label: `${name} news` },
    { href: "/tv",            label: `${name} on TV` },
  ]
}

// ── generateMetadata ──────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const league = await getLeague(id).catch(() => null)
  if (!league) return {}

  const name = league.strLeague?.trim() || "League"
  const title = league.seo?.seo_title_override?.trim() || leagueTitle(name)

  const description =
    league.seo?.seo_description_override?.trim() ||
    `View ${name} fixtures, results, standings, TV coverage and latest updates on SportsFixtures.`

  const summary = league.seo?.short_summary?.trim() || ""
  const facts = league.seo?.key_facts ?? []
  const relatedLinks = buildRelatedLinks(league, id)

  const indexable = isPageIndexable({
    hasSummary: Boolean(summary),
    hasKeyFacts: facts.length > 0 || mapLeagueFacts(league).length > 0,
    hasFreshnessBlock: Boolean(league.updated_at || league.published_at),
    hasRelatedLinks: relatedLinks.length > 0,
    hasPlaceholderContent: hasPlaceholderContent([
      summary,
      description,
      league.strDescriptionEN,
      league.strLeague,
    ]),
  })

  return buildMetadata({
    title,
    description,
    canonical: absoluteUrl(`/league/${id}`),
    image:
      league.seo?.og_image_override ||
      league.strBadge ||
      league.strLogo ||
      undefined,
    noIndex: league.seo?.index_status === "noindex" || !indexable,
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const league = await getLeague(id).catch(() => null)

  const name = league?.strLeague?.trim() || "League"
  const description = league?.strDescriptionEN?.trim() || undefined
  const faqItems = league?.seo?.faq_items ?? []
  const relatedLinks = buildRelatedLinks(league ?? {}, id)
  const factItems = mapLeagueFacts(league ?? {})
  const leagueImage = league?.strBadge || league?.strLogo || undefined

  const summary =
    league?.seo?.short_summary?.trim() ||
    buildEntitySummary({
      entityType: "league",
      name,
      sport: league?.strSport ?? undefined,
      city: league?.strCountry ?? undefined,
      facts: (league?.seo?.key_facts ?? []).filter(Boolean),
    })

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <JsonLd
        data={[
          organizationSchema(),
          breadcrumbSchema([
            { name: "Home",     path: "/" },
            { name: "Fixtures", path: "/fixtures" },
            { name: name,       path: `/league/${id}` },
          ]),
          ...(faqItems.length ? [faqSchema(faqItems)] : []),
        ]}
      />

      <HeaderMenu />

      <LeagueHeader leagueId={id} />

      <main className="flex-1 overflow-auto px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">

        <AiSummaryBlock summary={summary} />

        <PageFactBlock items={factItems} />

        <SourceTransparency
          publishedAt={league?.published_at ?? undefined}
          updatedAt={league?.updated_at ?? undefined}
          sourceLabel={league?.seo?.source_label ?? "SportsFixtures data layer"}
          methodology={
            league?.seo?.methodology_note ??
            "Live sports data and editorial enrichment"
          }
        />

        <AuthorTrustBlock
          authorName={league?.author_name ?? undefined}
          reviewedBy={league?.reviewed_by ?? undefined}
          policyNote="This page is maintained from structured sports data and editorial review rules."
        />

        <Suspense fallback={<SkeletonLoader count={5} />}>
          <LeagueContent leagueId={id} />
        </Suspense>

        {description ? (
          <section className="rounded-2xl border border-border p-4">
            <h2 className="text-lg font-semibold">About {name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {description}
            </p>
          </section>
        ) : null}

        <FaqBlock items={faqItems} />

        <RelatedEntitiesBlock title="More on SportsFixtures" items={relatedLinks} />

        {leagueImage ? (
          <div className="flex items-center gap-3 pt-2">
            <img
              src={leagueImage}
              alt={`${name} logo`}
              className="h-10 w-10 object-contain"
            />
          </div>
        ) : null}
      </main>

      <BottomNav />
    </div>
  )
}

// ── Async content (table + fixtures) ─────────────────────────────────────────

async function LeagueContent({ leagueId }: { leagueId: string }) {
  const [table, nextEvents, pastEvents] = await Promise.all([
    getLeagueTable(leagueId),
    getNextEvents(leagueId),
    getPastEvents(leagueId),
  ])

  return (
    <>
      <LeagueTable table={table} leagueId={leagueId} />
      <LeagueFixtures nextEvents={nextEvents} pastEvents={pastEvents} />
    </>
  )
}
