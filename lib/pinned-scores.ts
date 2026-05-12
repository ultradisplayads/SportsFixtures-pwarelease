"use client"

export type PinnedScore = {
  id: string
  home: string
  away: string
  homeLogo?: string
  awayLogo?: string
  score: string
  status: string
  isLive: boolean
  startsAt?: string
  updatedAt: string
}

const STORAGE_KEY = "sf_pinned_scores_v1"
const EVENT_NAME = "sf:pinned-scores:update"

function safeRead(): PinnedScore[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id) : []
  } catch {
    return []
  }
}

function safeWrite(items: PinnedScore[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 20)))
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: items }))
}

export function getPinnedScores(): PinnedScore[] {
  return safeRead()
}

export function isScorePinned(id: string): boolean {
  return safeRead().some((item) => item.id === id)
}

export function pinScore(score: Omit<PinnedScore, "updatedAt">): PinnedScore[] {
  const nextItem: PinnedScore = { ...score, updatedAt: new Date().toISOString() }
  const next = [nextItem, ...safeRead().filter((item) => item.id !== score.id)]
  safeWrite(next)
  return next
}

export function unpinScore(id: string): PinnedScore[] {
  const next = safeRead().filter((item) => item.id !== id)
  safeWrite(next)
  return next
}

export function togglePinnedScore(score: Omit<PinnedScore, "updatedAt">): { pinned: boolean; items: PinnedScore[] } {
  if (isScorePinned(score.id)) return { pinned: false, items: unpinScore(score.id) }
  return { pinned: true, items: pinScore(score) }
}

export function updatePinnedScoresFromMatches(matches: Array<Partial<PinnedScore> & { id: string }>) {
  const current = safeRead()
  if (!current.length) return
  const byId = new Map(matches.map((match) => [match.id, match]))
  let changed = false
  const next = current.map((item) => {
    const incoming = byId.get(item.id)
    if (!incoming) return item
    changed = true
    return {
      ...item,
      ...incoming,
      updatedAt: new Date().toISOString(),
    }
  })
  if (changed) safeWrite(next)
}

export function onPinnedScoresChange(listener: (items: PinnedScore[]) => void) {
  if (typeof window === "undefined") return () => {}
  const handler = () => listener(safeRead())
  window.addEventListener(EVENT_NAME, handler)
  window.addEventListener("storage", handler)
  return () => {
    window.removeEventListener(EVENT_NAME, handler)
    window.removeEventListener("storage", handler)
  }
}
