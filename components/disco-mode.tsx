"use client"

import { useEffect, useState, useCallback } from "react"
import { Music, X } from "lucide-react"
import { loadAppSettings, saveAppSettings } from "@/lib/app-settings"
import { triggerHaptic } from "@/lib/haptic-feedback"

const DISCO_COLORS = [
  "hue-rotate-0", "hue-rotate-15", "hue-rotate-30", "hue-rotate-60",
  "hue-rotate-90", "hue-rotate-180", "hue-rotate-270",
]

export function useDiscoMode() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    setActive(loadAppSettings().fanMode)
    function onStorage(e: StorageEvent) {
      if (e.key === "sf_app_settings") setActive(loadAppSettings().fanMode)
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const toggle = useCallback(() => {
    triggerHaptic("medium")
    setActive((prev) => {
      const next = !prev
      saveAppSettings({ fanMode: next })
      return next
    })
  }, [])

  return { active, toggle }
}

export function DiscoModeOverlay({ active }: { active: boolean }) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!active) return
    const interval = setInterval(() => setFrame((f) => (f + 1) % DISCO_COLORS.length), 300)
    return () => clearInterval(interval)
  }, [active])

  if (!active) return null

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-40 transition-all duration-300 ${DISCO_COLORS[frame]}`}
      style={{ mixBlendMode: "color", opacity: 0.35 }}
      aria-hidden="true"
    />
  )
}

export function DiscoModeToggle({ compact = false }: { compact?: boolean }) {
  const { active, toggle } = useDiscoMode()

  if (compact) {
    // Switch-style toggle for use inline in settings rows
    return (
      <button
        onClick={toggle}
        aria-pressed={active}
        className={`relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          active ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            active ? "translate-x-5" : "translate-x-0"
          }`}
        />
        <span className="sr-only">{active ? "Fan Mode on" : "Fan Mode off"}</span>
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-accent"
      }`}
    >
      {active ? <X className="h-4 w-4" /> : <Music className="h-4 w-4" />}
      {active ? "Fan Mode Off" : "Fan Mode"}
    </button>
  )
}
