"use client"

import { useEffect, useState, useCallback } from "react"
import { Music, X } from "lucide-react"
import { loadAppSettings, saveAppSettings } from "@/lib/app-settings"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { GOAL_CELEBRATION_EVENT, type GoalCelebrationDetail } from "@/lib/goal-celebration"

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

function playGoalAudio(mood: GoalCelebrationDetail["mood"]) {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return

    const ctx = new AudioContext()
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(mood === "against" ? 0.08 : 0.16, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9)

    const notes = mood === "against" ? [220, 196] : [392, 494, 659]
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      osc.type = mood === "against" ? "sawtooth" : "triangle"
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.12)
      osc.connect(gain)
      osc.start(ctx.currentTime + index * 0.12)
      osc.stop(ctx.currentTime + index * 0.12 + 0.22)
    })

    window.setTimeout(() => ctx.close().catch(() => {}), 1200)
  } catch {
    // Autoplay or device restrictions can block audio; visuals still run.
  }
}

export function DiscoModeOverlay({ active }: { active: boolean }) {
  const [frame, setFrame] = useState(0)
  const [goal, setGoal] = useState<GoalCelebrationDetail | null>(null)
  const [background, setBackground] = useState<"dark" | "light">("dark")

  useEffect(() => {
    const sync = () => setBackground(loadAppSettings().fanModeBackground)
    sync()
    window.addEventListener("storage", sync)
    window.addEventListener("sf:app-settings-change", sync)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener("sf:app-settings-change", sync)
    }
  }, [])

  useEffect(() => {
    if (!active) return
    const interval = setInterval(() => setFrame((f) => (f + 1) % DISCO_COLORS.length), 300)
    return () => clearInterval(interval)
  }, [active])

  useEffect(() => {
    if (!active) return

    const handleGoal = (event: Event) => {
      const detail = (event as CustomEvent<GoalCelebrationDetail>).detail
      if (!detail) return
      setGoal(detail)
      playGoalAudio(detail.mood)
      triggerHaptic(detail.mood === "against" ? "medium" : "heavy")
      const timeout = window.setTimeout(() => setGoal(null), 4200)
      return () => window.clearTimeout(timeout)
    }

    window.addEventListener(GOAL_CELEBRATION_EVENT, handleGoal)
    return () => window.removeEventListener(GOAL_CELEBRATION_EVENT, handleGoal)
  }, [active])

  if (!active) return null

  return (
    <>
      <div
        className={`pointer-events-none fixed inset-0 z-40 transition-all duration-300 ${DISCO_COLORS[frame]}`}
        style={{
          mixBlendMode: background === "light" ? "screen" : "color",
          opacity: background === "light" ? 0.22 : 0.35,
          backgroundColor: background === "light" ? "rgba(255,255,255,0.18)" : undefined,
        }}
        aria-hidden="true"
      />
      {goal && (
        <div className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden" aria-hidden="true">
          <div
            className="absolute inset-0 animate-pulse"
            style={{
              background:
                goal.mood === "against"
                  ? background === "light"
                    ? `radial-gradient(circle at 50% 35%, rgba(239,68,68,0.28), transparent 32%), linear-gradient(135deg, ${goal.primaryColor}22, rgba(255,255,255,0.42))`
                    : `radial-gradient(circle at 50% 35%, rgba(239,68,68,0.45), transparent 32%), linear-gradient(135deg, ${goal.primaryColor}44, #11182766)`
                  : background === "light"
                  ? `radial-gradient(circle at 50% 35%, ${goal.primaryColor}44, transparent 34%), linear-gradient(135deg, ${goal.primaryColor}22, rgba(255,255,255,0.48))`
                  : `radial-gradient(circle at 50% 35%, ${goal.primaryColor}88, transparent 34%), linear-gradient(135deg, ${goal.primaryColor}66, ${goal.secondaryColor}55)`,
              mixBlendMode: background === "light" ? "normal" : "screen",
            }}
          />
          <div className={`absolute inset-x-4 top-[18%] rounded-xl border px-5 py-5 text-center shadow-2xl backdrop-blur-sm ${
            background === "light"
              ? "border-black/10 bg-white/82 text-foreground"
              : "border-white/30 bg-black/55 text-white"
          }`}>
            <p className={`text-xs font-black uppercase tracking-widest ${background === "light" ? "text-foreground/65" : "text-white/75"}`}>
              {goal.mood === "against" ? "Goal Against" : goal.mood === "for" ? "Goal For" : "Goal"}
            </p>
            <p className={`mt-1 text-3xl font-black uppercase leading-none drop-shadow ${background === "light" ? "text-foreground" : "text-white"}`}>
              {goal.teamName}
            </p>
            <p className={`mt-2 font-mono text-xl font-black ${background === "light" ? "text-foreground" : "text-white"}`}>{goal.score}</p>
          </div>
          {Array.from({ length: 18 }).map((_, index) => (
            <span
              key={index}
              className="absolute h-3 w-3 animate-bounce rounded-full"
              style={{
                left: `${(index * 37) % 100}%`,
                top: `${12 + ((index * 19) % 76)}%`,
                backgroundColor: index % 2 === 0 ? goal.primaryColor : goal.secondaryColor,
                animationDelay: `${index * 65}ms`,
                animationDuration: `${850 + (index % 5) * 120}ms`,
              }}
            />
          ))}
        </div>
      )}
    </>
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
