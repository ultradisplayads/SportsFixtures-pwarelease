import { NextResponse } from "next/server"
import { getSFNews } from "@/lib/sf-api"
import { makeSuccessEnvelope, makeEmptyEnvelope } from "@/lib/contracts"
import { normalizeArticleImage } from "@/lib/asset-normalization"
import type { NormalizedEnvelope } from "@/types/contracts"
import type { HomepageNewsEnvelope } from "@/types/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(): Promise<NextResponse> {
  const fetchedAt = new Date().toISOString()

  try {
    const articles = await getSFNews({ limit: 6 })

    const items: HomepageNewsEnvelope["items"] = articles.map((a) => {
      // Normalize image through the asset layer — no provider field guessing in the component
      const imgSet = normalizeArticleImage(
        a as unknown as Record<string, unknown>,
        a.title ?? null,
      )
      return {
        id: String(a.id),
        title: a.title ?? "",
        slug: (a as any).slug || String(a.id),
        imageUrl: imgSet.primary ?? null,
        publishedAt: a.publishedAt || null,
        category: a.category || (a.sport?.name ?? null),
        isBreaking: (a as any).isBreaking ?? false,
      }
    })

    const envelope: NormalizedEnvelope<HomepageNewsEnvelope> = makeSuccessEnvelope({
      data: {
        items,
        source: "news",
        generatedAt: fetchedAt,
      },
      source: "strapi",
      fetchedAt,
      maxAgeSeconds: 120, // homepage news stales after 2 minutes
    })

    return NextResponse.json(envelope, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (err) {
    console.error("[api/news/homepage]", err)

    const envelope: NormalizedEnvelope<HomepageNewsEnvelope> = makeEmptyEnvelope({
      source: "strapi",
      unavailableReason: err instanceof Error ? err.message : "Unknown error",
    })

    return NextResponse.json(envelope, { status: 200 })
  }
}
