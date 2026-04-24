"use client"

// components/personalized-home.tsx
// Legacy home module hook + editor UI.
//
// useHomeModules is kept for HomeModuleEditor (used in filter-button.tsx).
// The HomeModuleRenderer and settings/home-layout page now use useHomeModuleManager
// which shares the same "sf_home_modules" storage key.
//
// Storage schema normalisation: we write {id, enabled}[] (no label) so the
// data is compatible with useHomeModuleManager. On load we accept both the
// legacy {id, label, enabled}[] format and the current {id, enabled}[] format,
// reconstructing labels from DEFAULT_MODULES on demand.

import { useState, useEffect, useCallback } from "react"
import { GripVertical, Eye, EyeOff, RotateCcw } from "lucide-react"
import { triggerHaptic } from "@/lib/haptic-feedback"

export type HomeModule =
  | "recommended"
  | "live"
  | "fixtures"
  | "news"
  | "calendar"
  | "venues"
  | "leaderboard"

interface Module {
  id: HomeModule
  label: string
  enabled: boolean
}

const DEFAULT_MODULES: Module[] = [
  { id: "recommended", label: "Recommended Matches", enabled: true },
  { id: "live",        label: "Live Scores",         enabled: true },
  { id: "fixtures",    label: "Fixtures",            enabled: true },
  { id: "news",        label: "News Feed",           enabled: true },
  { id: "calendar",    label: "My Calendar",         enabled: true },
  { id: "venues",      label: "Nearby Venues",       enabled: true },
  { id: "leaderboard", label: "Leaderboard",         enabled: false },
]

const DEFAULT_LABELS: Record<string, string> = Object.fromEntries(
  DEFAULT_MODULES.map((m) => [m.id, m.label])
)

const STORAGE_KEY = "sf_home_modules"

/** Normalise stored data — accept both {id,label,enabled}[] and {id,enabled}[]. */
function parseStoredModules(raw: string): Module[] {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return DEFAULT_MODULES
    const normalized: Module[] = parsed
      .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null && "id" in p)
      .map((p) => {
        const id = String(p.id) as HomeModule
        return {
          id,
          label: String(p.label ?? DEFAULT_LABELS[id] ?? id),
          enabled: Boolean(p.enabled ?? true),
        }
      })
      .filter((m) => DEFAULT_LABELS[m.id] !== undefined)
    return normalized.length > 0 ? normalized : DEFAULT_MODULES
  } catch {
    return DEFAULT_MODULES
  }
}

/** Write only {id, enabled} — no label — so useHomeModuleManager can read it. */
function serializeModules(modules: Module[]): string {
  return JSON.stringify(modules.map(({ id, enabled }) => ({ id, enabled })))
}

export function useHomeModules() {
  const [modules, setModules] = useState<Module[]>(DEFAULT_MODULES)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setModules(parseStoredModules(saved))
    } catch { /* ignore */ }
  }, [])

  const save = (next: Module[]) => {
    setModules(next)
    try { localStorage.setItem(STORAGE_KEY, serializeModules(next)) } catch { /* ignore */ }
  }

  const toggle = (id: HomeModule) => {
    triggerHaptic("selection")
    save(modules.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)))
  }

  const reorder = (from: number, to: number) => {
    const next = [...modules]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    save(next)
  }

  const reset = () => {
    triggerHaptic("medium")
    save(DEFAULT_MODULES)
  }

  return { modules, toggle, reorder, reset }
}

export function HomeModuleEditor() {
  const { modules, toggle, reorder, reset } = useHomeModules()
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const handleDragStart = (i: number) => setDragIdx(i)
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    if (dragIdx !== null && dragIdx !== i) {
      reorder(dragIdx, i)
      setDragIdx(i)
    }
  }
  const handleDrop = () => { triggerHaptic("light"); setDragIdx(null) }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Home layout</p>
        <button onClick={reset} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <RotateCcw className="h-3 w-3" />Reset
        </button>
      </div>
      {modules.map((mod, i) => (
        <div
          key={mod.id}
          draggable
          onDragStart={() => handleDragStart(i)}
          onDragOver={(e) => handleDragOver(e, i)}
          onDrop={handleDrop}
          className={`flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 transition-opacity ${
            dragIdx === i ? "opacity-50" : "opacity-100"
          }`}
        >
          <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
          <span className="flex-1 text-sm font-medium">{mod.label}</span>
          <button
            onClick={() => toggle(mod.id)}
            className={`rounded-full p-1 transition-colors ${
              mod.enabled ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {mod.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        </div>
      ))}
    </div>
  )
}
