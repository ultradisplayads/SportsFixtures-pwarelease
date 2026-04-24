"use client"

// app/settings/home-layout/page.tsx
// Section 07.B + 07.E — Home module management surface.
//
// This page gives users a clear, recoverable path to:
// - re-enable calendar and any other hidden home modules (07.B)
// - understand WHY a module is hidden (user_pref vs control_plane) (07.A)
// - drag-reorder modules (existing HomeModuleEditor behavior, now here)
//
// Rules:
// - User-level module management must not require admin access.
// - Modules hidden by the control plane show a "Disabled by operator" label
//   and the toggle is locked (the user cannot override CP-disabled modules).
// - Modules hidden by user preference show a toggle the user can restore.

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import {
  ChevronLeft, Eye, EyeOff, GripVertical, RotateCcw,
  Calendar, MapPin, Star, Newspaper, Trophy, Tv, Info, Lock,
} from "lucide-react"
import { HeaderMenu } from "@/components/header-menu"
import { BottomNav } from "@/components/bottom-nav"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { useControlPlane } from "@/hooks/use-control-plane"
import {
  resolveHomeModuleRuntimeState,
  getHiddenReasonLabel,
  type HomeModuleRuntimeState,
} from "@/lib/home-module-state"

// ── Module metadata ────────────────────────────────────────────────────────────

const MODULE_META: Record<string, { label: string; description: string; icon: React.ComponentType<{ className?: string }> }> = {
  recommended: { label: "Recommended Matches",   description: "Personalised match picks based on teams and competitions you follow", icon: Star },
  fixtures:    { label: "Fixtures",               description: "Upcoming match schedule with filters by sport, country, and league",  icon: Trophy },
  venues:      { label: "Find Bars / Watch Here", description: "Nearby venues and sports bars showing your matches tonight",          icon: MapPin },
  calendar:    { label: "My Calendar",            description: "Your personal match calendar from followed teams and competitions",   icon: Calendar },
  news:        { label: "News Feed",              description: "Breaking sports news and transfer updates",                          icon: Newspaper },
  leaderboard: { label: "Leaderboard",            description: "Points table and social rankings",                                  icon: Trophy },
  live:        { label: "Live Scores",            description: "Real-time score updates for live matches",                          icon: Tv },
}

const USER_MODULE_PREFS_KEY = "sf_home_modules"

type UserPref = { id: string; enabled: boolean }

function loadUserPrefs(): Record<string, boolean> {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(USER_MODULE_PREFS_KEY) : null
    if (!raw) return {}
    const arr: UserPref[] = JSON.parse(raw)
    return Object.fromEntries(arr.map((p) => [p.id, p.enabled]))
  } catch {
    return {}
  }
}

function saveUserPrefs(prefs: Record<string, boolean>, currentOrder: string[]) {
  try {
    const arr: UserPref[] = currentOrder.map((id) => ({ id, enabled: prefs[id] ?? true }))
    localStorage.setItem(USER_MODULE_PREFS_KEY, JSON.stringify(arr))
  } catch { /* ignore */ }
}

// ── Module row ────────────────────────────────────────────────────────────────

function ModuleRow({
  state,
  onToggle,
  dragIdx,
  index,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  state: HomeModuleRuntimeState
  onToggle: (key: string) => void
  dragIdx: number | null
  index: number
  onDragStart: (i: number) => void
  onDragOver: (e: React.DragEvent, i: number) => void
  onDrop: () => void
}) {
  const meta = MODULE_META[state.key]
  const Icon = meta?.icon ?? Star
  const isLockedByCP = !state.enabledByControlPlane
  const isDragging = dragIdx === index

  return (
    <div
      draggable={!isLockedByCP}
      onDragStart={() => !isLockedByCP && onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={onDrop}
      className={`flex items-start gap-3 rounded-xl border border-border bg-card px-3 py-3 transition-opacity ${
        isDragging ? "opacity-40" : "opacity-100"
      } ${isLockedByCP ? "opacity-60" : ""}`}
    >
      {/* Drag handle — locked when CP-disabled */}
      <div className={`mt-0.5 shrink-0 ${isLockedByCP ? "text-muted-foreground/30" : "cursor-grab text-muted-foreground"}`}>
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Icon + label + description */}
      <div className="flex flex-1 items-start gap-2.5 min-w-0">
        <div className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${state.visible ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">{meta?.label ?? state.key}</p>
          {meta?.description && (
            <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{meta.description}</p>
          )}
          {!state.visible && state.hiddenReason && (
            <div className="mt-1 flex items-center gap-1">
              {isLockedByCP ? (
                <Lock className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Info className="h-3 w-3 text-muted-foreground" />
              )}
              <span className="text-[10px] text-muted-foreground">
                {getHiddenReasonLabel(state.hiddenReason)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Toggle — locked when CP-disabled */}
      {isLockedByCP ? (
        <div className="mt-0.5 shrink-0 rounded-full p-1 text-muted-foreground/40" aria-label="Cannot enable — disabled by operator">
          <Lock className="h-4 w-4" />
        </div>
      ) : (
        <button
          onClick={() => { triggerHaptic("selection"); onToggle(state.key) }}
          className={`mt-0.5 shrink-0 rounded-full p-1 transition-colors ${
            state.visible ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-accent"
          }`}
          aria-label={state.visible ? `Hide ${meta?.label}` : `Show ${meta?.label}`}
        >
          {state.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomeLayoutPage() {
  const router = useRouter()
  const { enabledModules: cpModules, data: cpData, isLoading: cpLoading } = useControlPlane()

  const [userPrefs, setUserPrefs] = useState<Record<string, boolean>>({})
  const [moduleOrder, setModuleOrder] = useState<string[]>([])
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Derive all known module keys from CP + any extra user prefs
  useEffect(() => {
    const prefs = loadUserPrefs()
    setUserPrefs(prefs)

    // Start with CP order, then append any keys the user has that the CP doesn't list
    const cpKeys = cpModules.map((m) => m.key)
    const savedOrder = Object.keys(prefs)
    const merged = Array.from(new Set([...cpKeys, ...savedOrder]))
    setModuleOrder(merged.length > 0 ? merged : cpKeys)
    setHydrated(true)
  }, [cpModules])

  // Build the full control-plane module list (all, not just enabled)
  const allCpModules = (cpData?.homepageModules ?? cpModules).map((m) => ({
    key: m.key,
    enabled: m.enabled,
    position: m.position ?? 0,
  }))

  // Resolve runtime state for all known keys
  const runtimeStates: HomeModuleRuntimeState[] = hydrated
    ? resolveHomeModuleRuntimeState({ controlPlaneModules: allCpModules, userModulePrefs: userPrefs })
    : []

  // Reorder by moduleOrder
  const orderedStates = moduleOrder
    .map((key) => runtimeStates.find((s) => s.key === key))
    .filter((s): s is HomeModuleRuntimeState => !!s)

  const handleToggle = useCallback(
    (key: string) => {
      setUserPrefs((prev) => {
        const next = { ...prev, [key]: !(prev[key] ?? true) }
        saveUserPrefs(next, moduleOrder)
        return next
      })
    },
    [moduleOrder],
  )

  const handleDragStart = (i: number) => setDragIdx(i)

  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === i) return
    setModuleOrder((prev) => {
      const next = [...prev]
      const [item] = next.splice(dragIdx, 1)
      next.splice(i, 0, item)
      saveUserPrefs(userPrefs, next)
      return next
    })
    setDragIdx(i)
  }

  const handleDrop = () => {
    triggerHaptic("light")
    setDragIdx(null)
  }

  const handleReset = () => {
    triggerHaptic("medium")
    const defaultPrefs: Record<string, boolean> = {}
    const defaultOrder = cpModules.map((m) => m.key)
    setUserPrefs(defaultPrefs)
    setModuleOrder(defaultOrder)
    saveUserPrefs(defaultPrefs, defaultOrder)
  }

  const visibleCount = orderedStates.filter((s) => s.visible).length
  const hiddenCount  = orderedStates.filter((s) => !s.visible).length

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      <HeaderMenu />

      <main className="flex-1 p-4 space-y-5">
        {/* Back + title */}
        <div>
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Home Layout</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Reorder and show/hide sections on your home screen.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Status summary */}
        {hydrated && (
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">{visibleCount}</span> visible
            </span>
            {hiddenCount > 0 && (
              <span>
                <span className="font-semibold text-foreground">{hiddenCount}</span> hidden
              </span>
            )}
          </div>
        )}

        {/* Loading */}
        {(cpLoading || !hydrated) && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {/* Module list */}
        {hydrated && !cpLoading && (
          <div className="space-y-2">
            {orderedStates.map((state, i) => (
              <ModuleRow
                key={state.key}
                state={state}
                index={i}
                dragIdx={dragIdx}
                onToggle={handleToggle}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))}
          </div>
        )}

        {/* Calendar recovery callout */}
        {hydrated && !cpLoading && (() => {
          const calState = orderedStates.find((s) => s.key === "calendar")
          if (!calState || calState.visible) return null
          return (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <p className="text-sm font-semibold text-primary">Calendar is currently hidden</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {calState.hiddenReason === "control_plane"
                  ? "My Calendar has been disabled by your operator. Contact your admin to re-enable it."
                  : "Toggle My Calendar above to restore it to your home screen. You can still access your calendar directly via the Personalization settings."}
              </p>
            </div>
          )
        })()}

        {/* Watch Here callout */}
        {hydrated && !cpLoading && (() => {
          const venueState = orderedStates.find((s) => s.key === "venues")
          if (!venueState || venueState.visible) return null
          return (
            <div className="rounded-xl border border-border bg-card p-4 space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="text-sm font-semibold">Find Bars is currently hidden</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Toggle &ldquo;Find Bars / Watch Here&rdquo; above to restore nearby venues to your home screen.
              </p>
            </div>
          )
        })()}

        <p className="pb-2 text-center text-xs text-muted-foreground">
          Drag rows to reorder. Tap the eye icon to show/hide a section.
          <br />
          Modules locked by your operator cannot be changed here.
        </p>
      </main>

      <BottomNav />
    </div>
  )
}
