import type { Metadata } from "next"
import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"
import { MatchHeader } from "@/components/match-detail/match-header"
import { MatchTabs } from "@/components/match-detail/match-tabs"
import JsonLd from "@/components/seo/json-ld"
import AiSummaryBlock from "@/components/seo/ai-summary-block"
import PageFactBlock from "@/components/seo/page-fact-block"
import SourceTransparency from "@/components/seo/source-transparency"
import AuthorTrustBlock from "@/components/seo/author-trust-block"
import FaqBlock from "@/components/seo/faq-block"
import RelatedEntitiesBlock from "@/components/seo/related-entities-block"
import { buildMetadata } from "@/lib/seo/metadata"
import { breadcrumbSchema, sportsEventSchema, faqSchema } from "@/lib/seo/schema"
import { buildEntitySummary } from "@/lib/seo/entity-summary"
import { matchTitle } from "@/lib/seo/title-templates"
import { absoluteUrl } from "@/lib/seo/url"
import { hasPlaceholderContent, isPageIndexable } from "@/lib/seo/page-quality"

type FaqItem = { question: string; answer: string }

type MatchSeo = {
  seo_title_override?: string | null
  seo_description_override?: string | null
  og_image_override?: string | null
  index_status?: "index" | "noindex" | null
  short_summary?: string | null
  key_facts?: string[] | null
  source_label?: string | null
  methodology_note?: string | null
  faq_items?: FaqItem[] | null
}

type MatchApiResponse = {
  idEvent?: string | number
  homeTeamName?: string | null
  awayTeamName?: string | null
  competitionName?: string | null
  competition_id?: string | number | null
  competition_slug?: string | null
  sport?: string | null
  venueName?: string | null
  venueAddress?: string | null
  venue_id?: string | number | null
  kickoffAt?: string | null
  endsAt?: string | null
  tvChannels?: string[] | null
  image?: string | null
  summary?: string | null
  home_team_id?: string | number | null
  away_team_id?: string | number | null
  published_at?: string | null
  updated_at?: string | null
  author_name?: string | null
  reviewed_by?: string | null
  seo?: MatchSeo | null
}

async function getMatch(id: string): Promise<MatchApiResponse | null> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sportsfixtures.net"
  try {
    const res = await fetch(`${siteUrl}/api/match/${id}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function mapMatchFacts(
  match: MatchApiResponse,
): Array<{ label: string; value: string }> {
  const tvText =
    match.tvChannels && match.tvChannels.length > 0
      ? match.tvChannels.join(", ")
      : null

  const raw: Array<{ label: string; value: string | null | undefined }> = [
    { label: "Competition", value: match.competitionName },
    { label: "Kickoff", value: match.kickoffAt },
    { label: "Venue", value: match.venueName },
    { label: "TV", value: tvText },
  ]

  return raw
    .filter((item) => item.value && String(item.value).trim().length > 0)
    .map((item) => ({ label: item.label, value: String(item.value) }))
}

function buildRelatedLinks(
  match: MatchApiResponse,
  id: string,
): Array<{ href: string; label: string }> {
  const home = match.homeTeamName ?? "Home Team"
  const away = match.awayTeamName ?? "Away Team"
  const fixtureName = `${home} vs ${away}`

  return (
    [
      { href: `/match/${id}`, label: `${fixtureName} overview` },
      match.home_team_id
        ? { href: `/team/${match.home_team_id}`, label: `${home} page` }
        : null,
      match.away_team_id
        ? { href: `/team/${match.away_team_id}`, label: `${away} page` }
        : null,
      match.competition_id
        ? {
            href: `/league/${match.competition_id}`,
            label: `${match.competitionName ?? "Competition"} page`,
          }
        : null,
      match.venue_id
        ? { href: `/venues/${match.venue_id}`, label: `${match.venueName ?? "Venue"} page` }
        : null,
      { href: "/tv", label: `${fixtureName} TV coverage` },
    ] as Array<{ href: string; label: string } | null>
  ).filter(Boolean) as Array<{ href: string; label: string }>
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const match = await getMatch(id)
  if (!match) return {}

  const home = match.homeTeamName?.trim() || "Home Team"
  const away = match.awayTeamName?.trim() || "Away Team"

  const title =
    match.seo?.seo_title_override?.trim() || matchTitle(home, away)

  const description =
    match.seo?.seo_description_override?.trim() ||
    `Follow ${home} vs ${away} with live score, kickoff time, TV coverage, venue details and match updates on SportsFixtures.`

  const summary = match.seo?.short_summary?.trim() || match.summary?.trim() || ""
  const facts = match.seo?.key_facts ?? []
  const relatedLinks = buildRelatedLinks(match, id)

  const indexable = isPageIndexable({
    hasSummary: Boolean(summary),
    hasKeyFacts: facts.length > 0 || mapMatchFacts(match).length > 0,
    hasFreshnessBlock: Boolean(
      match.updated_at || match.published_at || match.kickoffAt,
    ),
    hasRelatedLinks: relatedLinks.length > 0,
    hasPlaceholderContent: hasPlaceholderContent([
      summary,
      description,
      match.summary,
      match.homeTeamName,
      match.awayTeamName,
    ]),
  })

  return buildMetadata({
    title,
    description,
    canonical: absoluteUrl(`/match/${id}`),
    image: match.seo?.og_image_override || match.image || undefined,
    noIndex: match.seo?.index_status === "noindex" || !indexable,
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const match = await getMatch(id)

  const home = match?.homeTeamName?.trim() || "Home Team"
  const away = match?.awayTeamName?.trim() || "Away Team"
  const fixtureName = `${home} vs ${away}`

  const faqItems = match?.seo?.faq_items ?? []
  const relatedLinks = match ? buildRelatedLinks(match, id) : []
  const factItems = match ? mapMatchFacts(match) : []

  const summary =
    match?.seo?.short_summary?.trim() ||
    match?.summary?.trim() ||
    buildEntitySummary({
      entityType: "match",
      name: fixtureName,
      sport: match?.sport ?? undefined,
      competitionName: match?.competitionName ?? undefined,
      kickoffAt: match?.kickoffAt ?? undefined,
      tvChannels: match?.tvChannels ?? [],
      facts: (match?.seo?.key_facts ?? []).filter(Boolean),
    })

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      {match && (
        <JsonLd
          data={[
            sportsEventSchema({
              name: fixtureName,
              path: `/match/${id}`,
              description: summary,
              startDate: match.kickoffAt ?? new Date().toISOString(),
              endDate: match.endsAt ?? undefined,
              competitionName: match.competitionName ?? undefined,
              homeTeam: home,
              awayTeam: away,
              venueName: match.venueName ?? undefined,
              venueAddress: match.venueAddress ?? undefined,
              image: match.image ?? undefined,
            }),
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Fixtures", path: "/fixtures" },
              { name: fixtureName, path: `/match/${id}` },
            ]),
            ...(faqItems.length ? [faqSchema(faqItems)] : []),
          ]}
        />
      )}

      <HeaderMenu />
      <MatchHeader matchId={id} />
      <MatchTabs matchId={id} />

      {/* SEO content blocks — server-rendered for crawler extractability */}
      {match && (
        <div className="mx-auto w-full max-w-2xl space-y-4 px-4 pb-6">
          <AiSummaryBlock summary={summary} />
          <PageFactBlock items={factItems} />
          <SourceTransparency
            publishedAt={match.published_at ?? undefined}
            updatedAt={match.updated_at ?? undefined}
            sourceLabel={match.seo?.source_label ?? "SportsFixtures data layer"}
            methodology={
              match.seo?.methodology_note ??
              "Live sports data and editorial enrichment"
            }
          />
          <AuthorTrustBlock
            authorName={match.author_name ?? undefined}
            reviewedBy={match.reviewed_by ?? undefined}
            policyNote="This page is maintained from structured sports data and editorial review rules."
          />
          <FaqBlock items={faqItems} />
          <RelatedEntitiesBlock items={relatedLinks} />
        </div>
      )}

      <BottomNav />
    </div>
  )
}
