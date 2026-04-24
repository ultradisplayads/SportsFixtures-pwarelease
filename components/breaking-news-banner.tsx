"use client"

import { useState, useEffect } from "react"
import { Zap, X, ChevronRight } from "lucide-react"
import Link from "next/link"
import { triggerHaptic } from "@/lib/haptic-feedback"

interface BreakingItem {
  id: string
  title: string
  url?: string
}

// Cycles through breaking headlines as a scrolling ticker
export function BreakingNewsBanner() {
  const [items, setItems] = useState<BreakingItem[]>([])
  const [idx, setIdx] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/news/breaking", { cache: "no-store" })
        if (res.ok) {
          const json = await res.json()
          const list: BreakingItem[] = (json?.data ?? json?.articles ?? []).slice(0, 6).map((a: any) => ({
            id: String(a.id ?? Math.random()),
            title: a.title ?? a.strTitle ?? "",
            url: a.url ?? a.strUrl,
          }))
          if (list.length) setItems(list)
        }
      } catch { /* silent */ }
    }
    load()
  }, [])

  useEffect(() => {
    if (items.length < 2) return
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 5000)
    return () => clearInterval(t)
  }, [items.length])

  if (!items.length || dismissed) return null

  const current = items[idx]

  return (
    <div className="flex items-center gap-2 border-b border-red-500/20 bg-red-500/10 px-3 py-2">
      <div className="flex items-center gap-1.5 shrink-0">
        <Zap className="h-3.5 w-3.5 text-red-500" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-red-500">Breaking</span>
      </div>
      <Link
        href={current.url ?? "/news"}
        target={current.url ? "_blank" : undefined}
        rel={current.url ? "noopener noreferrer" : undefined}
        className="min-w-0 flex-1"
        onClick={() => triggerHaptic("light")}
      >
        <p className="truncate text-xs font-medium text-foreground">{current.title}</p>
      </Link>
      <div className="flex items-center gap-1 shrink-0">
        {items.length > 1 && (
          <span className="text-[10px] text-muted-foreground">{idx + 1}/{items.length}</span>
        )}
        <Link href="/news" className="rounded p-0.5 hover:bg-red-500/10">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
        <button
          onClick={() => { triggerHaptic("light"); setDismissed(true) }}
          className="rounded p-0.5 hover:bg-red-500/10"
          aria-label="Dismiss breaking news"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}
