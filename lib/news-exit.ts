export type NewsExitLinkInput = {
  id?: string | number | null
  title?: string | null
  url?: string | null
  source?: string | null
}

export function isExternalNewsUrl(url?: string | null): url is string {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

export function buildNewsExitHref(input: NewsExitLinkInput): string {
  const id = input.id ? String(input.id) : ""
  if (!isExternalNewsUrl(input.url)) return id ? `/news/${encodeURIComponent(id)}` : "/news"

  const params = new URLSearchParams()
  params.set("url", input.url)
  if (input.title) params.set("title", input.title)
  if (input.source) params.set("source", input.source)
  if (id) params.set("id", id)
  return `/news/exit?${params.toString()}`
}
