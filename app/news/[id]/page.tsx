import Link from "next/link"
import type { Metadata } from "next"
import { NewsExitGate } from "@/components/news-exit-gate"
import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"
import { LiveTicker } from "@/components/live-ticker"
import { LogoSquare } from "@/components/logo-badge"
import JsonLd from "@/components/seo/json-ld"
import AiSummaryBlock from "@/components/seo/ai-summary-block"
import PageFactBlock from "@/components/seo/page-fact-block"
import SourceTransparency from "@/components/seo/source-transparency"
import AuthorTrustBlock from "@/components/seo/author-trust-block"
import RelatedEntitiesBlock from "@/components/seo/related-entities-block"
import { getSFNews } from "@/lib/sf-api"
import { getNewsExitConfig } from "@/lib/news-exit-config"
import { isExternalNewsUrl } from "@/lib/news-exit"
import { buildMetadata } from "@/lib/seo/metadata"
import { articleSchema, breadcrumbSchema } from "@/lib/seo/schema"
import { absoluteUrl } from "@/lib/seo/url"

type NewsArticlePageProps = {
  params: Promise<{ id: string }>
}

function cleanText(value?: string | null): string {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

async function getArticle(id: string) {
  const articles = await getSFNews({ limit: 60 })
  return articles.find((item) => String(item.id) === String(id) || String(item.documentId || "") === String(id)) ?? null
}

export async function generateMetadata({ params }: NewsArticlePageProps): Promise<Metadata> {
  const { id } = await params
  const article = await getArticle(id)
  if (!article) return {}

  const title = cleanText(article.title || article.strTitle || "Sports news")
  const description =
    cleanText(article.excerpt) ||
    cleanText(article.content).slice(0, 155) ||
    "Read the latest sports news, fixtures, TV updates and fan context on SportsFixtures."

  return buildMetadata({
    title,
    description,
    canonical: absoluteUrl(`/news/${id}`),
    image: article.image || article.strImage || undefined,
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.createdAt || article.publishedAt,
    authorName: article.source || "SportsFixtures",
    noIndex: Boolean(article.url && isExternalNewsUrl(article.url)),
  })
}

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const { id } = await params
  const article = await getArticle(id)

  if (!article) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <LiveTicker />
        <HeaderMenu />
        <main className="flex flex-1 items-center justify-center px-4 pb-24 pt-6">
          <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
            <div className="mb-4 flex justify-center">
              <LogoSquare size={92} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wide text-primary">Sports Fixtures News</p>
            <h1 className="mt-2 text-2xl font-bold">Story not available</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This story may have moved, expired, or not synced from Strapi yet.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link href="/news" className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
                Back to news
              </Link>
              <Link href="/" className="flex-1 rounded-lg border border-border px-4 py-3 text-sm font-bold">
                Home
              </Link>
            </div>
          </section>
        </main>
        <BottomNav />
      </div>
    )
  }

  if (isExternalNewsUrl(article.url)) {
    const config = await getNewsExitConfig()
    return (
      <NewsExitGate
        targetUrl={article.url}
        title={article.title || "Read the full story"}
        source={article.source || ""}
        delaySeconds={config.delaySeconds}
        autoRedirect={config.autoRedirect}
        message={config.message}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <JsonLd
        data={[
          articleSchema({
            headline: cleanText(article.title || article.strTitle || "Sports news"),
            path: `/news/${id}`,
            description: cleanText(article.excerpt || article.content).slice(0, 240),
            image: article.image || article.strImage || undefined,
            datePublished: article.publishedAt,
            dateModified: article.createdAt || article.publishedAt,
            authorName: article.source || "SportsFixtures",
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "News", path: "/news" },
            { name: cleanText(article.title || article.strTitle || "Story"), path: `/news/${id}` },
          ]),
        ]}
      />
      <LiveTicker />
      <HeaderMenu />
      <main className="flex-1 px-4 pb-24 pt-4">
        <article className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-primary">{article.source || article.category || "Sports Fixtures"}</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight">{article.title}</h1>
          {article.image && <img src={article.image} alt="" className="mt-4 aspect-video w-full rounded-lg object-cover" />}
          {article.excerpt && <p className="mt-4 text-base leading-relaxed text-muted-foreground">{article.excerpt}</p>}
        </article>
        <div className="mx-auto mt-4 max-w-2xl space-y-3">
          <AiSummaryBlock summary={cleanText(article.excerpt || article.content || article.title)} />
          <PageFactBlock
            items={[
              article.category ? { label: "Category", value: article.category } : null,
              article.source ? { label: "Source", value: article.source } : null,
              article.publishedAt ? { label: "Published", value: article.publishedAt } : null,
            ].filter(Boolean) as Array<{ label: string; value: string }>}
          />
          <SourceTransparency
            publishedAt={article.publishedAt}
            updatedAt={article.createdAt || article.publishedAt}
            sourceLabel={article.source || "SportsFixtures data layer"}
            methodology="News content is pulled from configured Strapi/news sources and normalized for SportsFixtures."
          />
          <AuthorTrustBlock
            authorName={article.source || "SportsFixtures"}
            policyNote="This news page is maintained from structured content and editorial source rules."
          />
          <RelatedEntitiesBlock
            title="More on SportsFixtures"
            items={[
              { href: "/news", label: "Latest sports news" },
              { href: "/fixtures", label: "Upcoming fixtures" },
              { href: "/tv", label: "Sports on TV" },
              { href: "/venues", label: "Places to watch" },
            ]}
          />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
