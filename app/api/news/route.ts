import { NextResponse } from "next/server"
import { getSFNews } from "@/lib/sf-api"

export const dynamic = "force-dynamic"
export const revalidate = 0

const TRANSFER_KEYWORDS = [
  "transfer",
  "transfers",
  "signing",
  "signs",
  "bid",
  "deal",
  "medical",
  "loan",
  "contract",
  "clause",
  "target",
  "joins",
  "exit",
  "move",
  "fee",
  "agent",
]

function isTransferArticle(article: any): boolean {
  const text = [
    article?.title,
    article?.strTitle,
    article?.excerpt,
    article?.description,
    article?.category,
    article?.sport?.name,
  ].filter(Boolean).join(" ").toLowerCase()
  return TRANSFER_KEYWORDS.some((keyword) => text.includes(keyword))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category") || undefined
  const sport = searchParams.get("sport") || undefined
  const section = searchParams.get("section") || undefined
  const page = Number(searchParams.get("page") || "1")
  const limit = Math.min(Number(searchParams.get("limit") || "30"), 60)

  try {
    let articles = await getSFNews({
      category: category === "All" ? undefined : category,
      sport,
      page,
      limit: section === "transfers" ? 60 : limit,
    })

    if (section === "transfers") {
      const categoryArticles = await Promise.allSettled([
        getSFNews({ category: "Transfer News", sport, page, limit: 60 }),
        getSFNews({ category: "Transfers", sport, page, limit: 60 }),
      ])
      const merged = [
        ...articles,
        ...categoryArticles.flatMap((result) => result.status === "fulfilled" ? result.value : []),
      ]
      const seen = new Set<string>()
      articles = merged
        .filter(isTransferArticle)
        .filter((article) => {
          const key = String(article.id || article.url || article.title)
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        .slice(0, limit)
    }

    return NextResponse.json(
      {
        data: articles,
        articles,
        generatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=3600" } },
    )
  } catch (error) {
    console.error("[api/news]", error)
    return NextResponse.json(
      {
        data: [],
        articles: [],
        error: error instanceof Error ? error.message : "News unavailable",
      },
      { status: 200, headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=3600" } },
    )
  }
}
