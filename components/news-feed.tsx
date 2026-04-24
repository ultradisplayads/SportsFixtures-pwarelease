"use client"

import { useState, useEffect, useCallback } from "react"
import { Clock, ExternalLink, RefreshCw, Sparkles, Star } from "lucide-react"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { ExternalLinkGuard } from "@/components/platform/external-link-guard"
import { getSFNews, type SFNewsArticle } from "@/lib/sf-api"
import { getFavourites, type Favourite } from "@/lib/favourites-api"
import { scoreArticle as scoreArticleEngine } from "@/lib/personalization"

// ── Constants ──────────────────────────────────────────────────────────────────

const SPORT_CATEGORIES = ["All", "Football", "Basketball", "Rugby", "Cricket", "Tennis", "Transfer News", "Match Previews"]

// ── Helpers ────────────────────────────────────────────────────────────────────

function getTimeAgo(dateString: string) {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return "Recently"
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

/**
 * scoreArticle — delegates to the shared personalization engine.
 *
 * Builds the follow context from raw Favourite[] so calling code stays simple.
 * Covers: teams, players, competitions (league + competition type), sports.
 */
function scoreArticle(article: SFNewsArticle, favs: Favourite[]): number {
  const teams = favs
    .filter((f) => f.entity_type === "team")
    .map((f) => f.entity_name || f.entity_id)
    .filter(Boolean)

  const players = favs
    .filter((f) => f.entity_type === "player")
    .map((f) => f.entity_name || f.entity_id)
    .filter(Boolean)

  const competitions = favs
    .filter((f) => f.entity_type === "league" || f.entity_type === "competition")
    .map((f) => f.entity_name || f.entity_id)
    .filter(Boolean)

  // Derive sport names from team meta
  const sports = favs
    .filter((f) => f.entity_type === "team")
    .map((f) => (f.entity_meta as Record<string, string> | undefined)?.sport || "")
    .filter(Boolean)

  return scoreArticleEngine(
    {
      title:       article.title,
      description: article.excerpt,
      excerpt:     article.excerpt,
      category:    article.category,
      publishedAt: article.publishedAt,
      sport:       article.sport,
    },
    { teams, players, competitions, sports }
  )
}

// ── Article card ───────────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: SFNewsArticle }) {
  return (
    <ExternalLinkGuard
      href={article.url || `https://sportsfixtures.net/news/${article.id}`}
      onClick={() => triggerHaptic("light")}
      className="block rounded-xl border border-border bg-card p-4 hover:bg-accent transition-colors"
    >
      <div className="mb-2 flex items-start gap-3">
        {article.image && (
          <img
            src={article.image}
            alt=""
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {article.sport?.name || article.category || "Sport"}
            </span>
          </div>
          <h3 className="font-bold leading-tight line-clamp-2">{article.title}</h3>
        </div>
      </div>
      {article.excerpt && (
        <p className="mb-2 text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
      )}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span>{getTimeAgo(article.publishedAt)}</span>
          {article.source && (
            <>
              <span>•</span>
              <span className="truncate max-w-[120px]">{article.source}</span>
            </>
          )}
        </div>
        <ExternalLink className="h-3 w-3 shrink-0" />
      </div>
    </ExternalLinkGuard>
  )
}

// ── "For You" empty state ──────────────────────────────────────────────────────

function ForYouEmpty() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="rounded-full bg-primary/10 p-4">
        <Star className="h-7 w-7 text-primary" />
      </div>
      <p className="text-base font-semibold">No personalised news yet</p>
      <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">
        Follow teams, players, and competitions to get a news feed tailored to what you care about.
      </p>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

type Tab = "for-you" | "all"

export function NewsFeed() {
  const [tab,              setTab]             = useState<Tab>("all")
  const [articles,         setArticles]        = useState<SFNewsArticle[]>([])
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [loading,          setLoading]         = useState(true)
  const [error,            setError]           = useState<string | null>(null)
  const [favs,             setFavs]            = useState<Favourite[]>([])
  const [forYouArticles,   setForYouArticles]  = useState<SFNewsArticle[]>([])
  const [forYouLoading,    setForYouLoading]   = useState(false)
  const hasFavs = favs.length > 0

  // Load favs once on mount
  useEffect(() => {
    getFavourites().then(setFavs).catch(() => {})
  }, [])

  const loadNews = useCallback(async (category: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getSFNews({
        category: category === "All" ? undefined : category,
        limit: 30,
      })
      setArticles(data)
    } catch {
      setError("Could not load news. Tap retry.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNews(selectedCategory)
  }, [selectedCategory, loadNews])

  // Build "For You" when switching to that tab or when articles/favs change
  useEffect(() => {
    if (tab !== "for-you" || !hasFavs) return
    setForYouLoading(true)
    // Use already-loaded articles (all categories) as the candidate pool
    getSFNews({ limit: 60 })
      .then((all) => {
        const scored = all
          .map((a) => ({ article: a, score: scoreArticle(a, favs) }))
          .filter(({ score }) => score > 0)
          .sort((a, b) => b.score - a.score)
          .map(({ article }) => article)
        setForYouArticles(scored)
      })
      .catch(() => {})
      .finally(() => setForYouLoading(false))
  }, [tab, favs, hasFavs])

  const filteredArticles =
    selectedCategory === "All"
      ? articles
      : articles.filter((a) => {
          const cat   = a.category?.toLowerCase() || ""
          const sport = a.sport?.name?.toLowerCase() || ""
          return cat.includes(selectedCategory.toLowerCase()) || sport.includes(selectedCategory.toLowerCase())
        })

  return (
    <div className="p-4">
      {/* Tab bar */}
      <div className="mb-4 flex gap-1 rounded-xl border border-border bg-muted p-1">
        <button
          onClick={() => { triggerHaptic("selection"); setTab("for-you") }}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors ${
            tab === "for-you"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          For You
        </button>
        <button
          onClick={() => { triggerHaptic("selection"); setTab("all") }}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors ${
            tab === "all"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All News
        </button>
      </div>

      {/* ── FOR YOU tab ───────────────────────────── */}
      {tab === "for-you" && (
        <>
          {!hasFavs && <ForYouEmpty />}

          {hasFavs && forYouLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 animate-pulse rounded-lg bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasFavs && !forYouLoading && forYouArticles.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No matching articles found for your follows right now. Check back soon.
            </div>
          )}

          {hasFavs && !forYouLoading && forYouArticles.length > 0 && (
            <div className="space-y-3">
              {forYouArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── ALL NEWS tab ──────────────────────────── */}
      {tab === "all" && (
        <>
          {/* Category filter */}
          <div className="mb-4 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SPORT_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => { triggerHaptic("selection"); setSelectedCategory(category) }}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex gap-3">
                    <div className="h-16 w-16 animate-pulse rounded-lg bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-muted-foreground">{error}</p>
              <button
                onClick={() => loadNews(selectedCategory)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          )}

          {/* Articles */}
          {!loading && !error && (
            <div className="space-y-3">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
              {filteredArticles.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No articles found for this category
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
