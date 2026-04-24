import type { PageType } from "@/lib/measurement/types"

export function detectPageType(path: string): PageType {
  if (path === "/") return "home"
  if (path.startsWith("/team/")) return "team"
  if (path.startsWith("/league/")) return "league"
  if (path.startsWith("/match/")) return "match"
  if (path.startsWith("/venues/")) return "venue"
  if (path.startsWith("/news/")) return "article"
  if (path.startsWith("/tv")) return "tv"
  if (path.startsWith("/fixtures")) return "fixtures"
  if (path.startsWith("/results")) return "results"
  if (path.startsWith("/search")) return "search"
  return "other"
}
