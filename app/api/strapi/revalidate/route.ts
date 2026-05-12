import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { pushIndexNow } from "@/lib/seo/indexnow"

type StrapiWebhookBody = {
  event?: string
  model?: string
  entry?: Record<string, unknown>
  paths?: string[]
  urls?: string[]
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://sportsfixtures.net"

function asString(value: unknown): string | null {
  return typeof value === "string" || typeof value === "number" ? String(value) : null
}

function entityPath(model: string | undefined, entry: Record<string, unknown> | undefined): string | null {
  const slug = asString(entry?.slug) || asString(entry?.documentId) || asString(entry?.id)
  if (!model || !slug) return null
  const normalized = model.toLowerCase()

  if (["article", "news", "news-article"].includes(normalized)) return `/news/${slug}`
  if (["match", "event", "fixture"].includes(normalized)) return `/match/${slug}`
  if (["team"].includes(normalized)) return `/team/${slug}`
  if (["league", "competition"].includes(normalized)) return `/league/${slug}`
  if (["venue", "watch-venue"].includes(normalized)) return `/venues/${slug}`
  return null
}

function normalizePath(path: string): string {
  if (path.startsWith("https://") || path.startsWith("http://")) {
    try {
      return new URL(path).pathname || "/"
    } catch {
      return "/"
    }
  }
  return path.startsWith("/") ? path : `/${path}`
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRAPI_WEBHOOK_SECRET || process.env.SEO_REVALIDATE_SECRET
  if (secret) {
    const provided = req.headers.get("x-strapi-secret") || req.headers.get("x-seo-secret")
    if (provided !== secret) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }
  }

  const body = (await req.json().catch(() => ({}))) as StrapiWebhookBody
  const paths = new Set<string>(["/", "/news", "/fixtures", "/results", "/tv", "/venues", "/sitemap.xml", "/llms.txt", "/ai.txt"])
  const inferred = entityPath(body.model, body.entry)
  if (inferred) paths.add(inferred)
  for (const path of body.paths || []) paths.add(normalizePath(path))

  const tags = [
    "strapi",
    "seo",
    "sitemap",
    body.model ? `strapi:${body.model}` : null,
  ].filter(Boolean) as string[]

  for (const tag of tags) revalidateTag(tag, "max")
  for (const path of paths) revalidatePath(path)

  const urls = [
    ...Array.from(paths).map((path) => `${SITE_URL.replace(/\/$/, "")}${path}`),
    ...(body.urls || []),
  ].filter((url) => url.startsWith("https://sportsfixtures.net"))

  const indexNow = await pushIndexNow(Array.from(new Set(urls)))

  return NextResponse.json({
    ok: true,
    event: body.event || null,
    model: body.model || null,
    revalidatedPaths: Array.from(paths),
    revalidatedTags: tags,
    indexNow,
  })
}
