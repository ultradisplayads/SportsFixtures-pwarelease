import JsonLd from "@/components/seo/json-ld"
import AiSummaryBlock from "@/components/seo/ai-summary-block"
import PageFactBlock from "@/components/seo/page-fact-block"
import SourceTransparency from "@/components/seo/source-transparency"
import AuthorTrustBlock from "@/components/seo/author-trust-block"
import RelatedEntitiesBlock from "@/components/seo/related-entities-block"
import FaqBlock from "@/components/seo/faq-block"
import { Suspense } from "react"
import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"
import { TeamHeader } from "@/components/team-header"
import { TeamStats } from "@/components/team-stats"
import { TeamSquad } from "@/components/team-squad"
import { TeamFixtures } from "@/components/team-fixtures"
import { SkeletonLoader } from "@/components/skeleton-loader"
import { ErrorBoundary } from "@/components/error-boundary"
import { buildMetadata } from "@/lib/seo/metadata"
import { breadcrumbSchema, sportsTeamSchema, faqSchema } from "@/lib/seo/schema"
import { buildEntitySummary } from "@/lib/seo/entity-summary"
import { teamTitle } from "@/lib/seo/title-templates"
import { absoluteUrl } from "@/lib/seo/url"
import { hasPlaceholderContent, isPageIndexable } from "@/lib/seo/page-quality"
import { getTeamDetails, getPlayersByTeam } from "@/app/actions/sports-api"

type FaqItem = {
  question: string
  answer: string
}

type TeamSeo = {
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

type TeamApiResponse = {
  idTeam?: string | number
  strTeam?: string | null
  strTeamBadge?: string | null
  strSport?: string | null
  strLeague?: string | null
  strCountry?: string | null
  strDescriptionEN?: string | null
  strStadium?: string | null
  intFormedYear?: string | number | null
  strManager?: string | null
  league_slug?: string | null
  published_at?: string | null
  updated_at?: string | null
  author_name?: string | null
  reviewed_by?: string | null
  seo?: TeamSeo | null
}

// ── Data helpers ───────────────────────────────────────────────────────────────

async function getTeam(id: string): Promise<TeamApiResponse> {
  // Use getTeamDetails action directly — Next.js dedupes repeated calls
  const team = await getTeamDetails(id)
  return (team ?? {}) as TeamApiResponse
}

function mapTeamFacts(
  team: TeamApiResponse,
): Array<{ label: string; value: string }> {
  const raw: Array<{ label: string; value: string | null | undefined }> = [
    { label: "Sport",    value: team.strSport },
    { label: "League",   value: team.strLeague },
    { label: "Country",  value: team.strCountry },
    { label: "Stadium",  value: team.strStadium },
    { label: "Founded",  value: team.intFormedYear ? String(team.intFormedYear) : null },
    { label: "Manager",  value: team.strManager },
  ]
  return raw
    .filter((item) => item.value && String(item.value).trim().length > 0)
    .map((item) => ({ label: item.label, value: String(item.value) }))
}

function buildRelatedLinks(
  team: TeamApiResponse,
  id: string,
): Array<{ href: string; label: string }> {
  const teamName = team.strTeam ?? "Team"
  const links: Array<{ href: string; label: string } | null> = [
    team.league_slug
      ? { href: `/league/${team.league_slug}`, label: `${team.strLeague ?? "League"} page` }
      : null,
    { href: `/team/${id}`,  label: `${teamName} overview` },
    { href: "/fixtures",    label: `${teamName} fixtures` },
    { href: "/results",     label: `${teamName} results` },
    { href: "/news",        label: `${teamName} news` },
  ]
  return links.filter(Boolean) as Array<{ href: string; label: string }>
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const team = await getTeam(id)

  const teamName = team.strTeam?.trim() || "Team"
  const title =
  team.seo?.seo_title_override?.trim() || teamTitle(teamName)

  const description =
    team.seo?.seo_description_override?.trim() ||
    `View ${teamName} fixtures, results, TV listings, latest news and places to watch on SportsFixtures.`

  const summary   = team.seo?.short_summary?.trim() || ""
  const facts     = team.seo?.key_facts ?? []
  const relatedLinks = buildRelatedLinks(team, id)

  const indexable = isPageIndexable({
    hasSummary:            Boolean(summary),
    hasKeyFacts:           facts.length > 0 || mapTeamFacts(team).length > 0,
    hasFreshnessBlock:     Boolean(team.updated_at || team.published_at),
    hasRelatedLinks:       relatedLinks.length > 0,
    hasPlaceholderContent: hasPlaceholderContent([
      summary,
      description,
      team.strDescriptionEN,
      team.strTeam,
    ]),
  })

  return buildMetadata({
    title,
    description,
    canonical:  absoluteUrl(`/team/${id}`),
    image:      team.seo?.og_image_override || team.strTeamBadge || undefined,
    noIndex:    team.seo?.index_status === "noindex" || !indexable,
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const team    = await getTeam(id)

  const teamName        = team.strTeam?.trim() || "Team"
  const teamDescription = team.strDescriptionEN?.trim() || undefined
  const faqItems        = team.seo?.faq_items ?? []
  const relatedLinks    = buildRelatedLinks(team, id)
  const factItems       = mapTeamFacts(team)

  const summary =
    team.seo?.short_summary?.trim() ||
    buildEntitySummary({
      entityType:      "team",
      name:            teamName,
      sport:           team.strSport    ?? undefined,
      competitionName: team.strLeague   ?? undefined,
      facts:           (team.seo?.key_facts ?? []).filter(Boolean),
    })

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <JsonLd
        data={[
          sportsTeamSchema({
            name:        teamName,
            path:        `/team/${id}`,
            description: teamDescription,
            logo:        team.strTeamBadge ?? undefined,
            sport:       team.strSport     ?? undefined,
            league:      team.strLeague    ?? undefined,
          }),
          breadcrumbSchema([
            { name: "Home",     path: "/"       },
            { name: "Teams",    path: "/teams"  },
            { name: teamName,   path: `/team/${id}` },
          ]),
          ...(faqItems.length ? [faqSchema(faqItems)] : []),
        ]}
      />

      <HeaderMenu />

      <Suspense fallback={<SkeletonLoader count={1} />}>
        <TeamHeader teamId={id} />
      </Suspense>

      <div className="flex-1 overflow-auto">
        <Suspense fallback={<SkeletonLoader count={6} />}>
          <ErrorBoundary label="Team content">
            <TeamContent teamId={id} />
          </ErrorBoundary>
        </Suspense>

        <div className="mx-auto max-w-2xl space-y-3 px-4 py-4">
          <AiSummaryBlock summary={summary} />

          <PageFactBlock items={factItems} />

          <SourceTransparency
            publishedAt={team.published_at ?? undefined}
            updatedAt={team.updated_at   ?? undefined}
            sourceLabel={team.seo?.source_label ?? "SportsFixtures data layer"}
            methodology={
              team.seo?.methodology_note ??
              "Live sports data and editorial enrichment"
            }
          />

          <AuthorTrustBlock
            authorName={team.author_name ?? undefined}
            reviewedBy={team.reviewed_by ?? undefined}
            policyNote="This page is maintained from structured sports data and editorial review rules."
          />

          <FaqBlock items={faqItems} />

          <RelatedEntitiesBlock title="More on SportsFixtures" items={relatedLinks} />

          {teamDescription ? (
            <section className="rounded-2xl border p-4">
              <h2 className="text-lg font-semibold">About {teamName}</h2>
              <div className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                {teamDescription}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

// ── Sub-component ─────────────────────────────────────────────────────────────

async function TeamContent({ teamId }: { teamId: string }) {
  const [team, players] = await Promise.all([
    getTeamDetails(teamId),
    getPlayersByTeam(teamId),
  ])
  return (
    <>
      <TeamStats team={team} />
      <TeamSquad players={players} />
      <TeamFixtures teamId={teamId} />
    </>
  )
}
