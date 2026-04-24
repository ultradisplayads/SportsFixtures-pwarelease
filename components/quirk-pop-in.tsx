"use client"

/**
 * QuirkPopIn — THREE systems, all INSIDE real blank card space.
 *
 * 1. BALLS  — football / rugby / golf / tennis burst from 0→big→0 inside card blank zones
 * 2. QUIRK  — mascot pops inside card blank zones with 4 moods
 * 3. QUIRK ON NOTIFICATION — pops near bell when sf:notification fires
 *
 * Positioning: reads real DOM rects from fixture/TV cards (data-quirk-zone="score" or
 * data-quirk-zone="row-right") so Quirk/balls appear inside the blank frame space,
 * NOT over text. Falls back to safe screen positions when no cards are visible.
 */

import { useEffect, useState, useCallback, useRef } from "react"
import Image from "next/image"
import { loadAppSettings } from "@/lib/app-settings"

// ─────────────────────────────────────────────────────────────────────────────
// 3D BALL SVGs
// ─────────────────────────────────────────────────────────────────────────────

function FootballSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="fg1" cx="38%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#fg1)" />
      <polygon points="50,20 62,28 58,42 42,42 38,28" fill="#111" opacity="0.85" />
      <polygon points="72,38 84,46 80,60 66,58 64,44" fill="#111" opacity="0.85" />
      <polygon points="64,70 76,74 72,88 56,88 54,76" fill="#111" opacity="0.85" />
      <polygon points="36,70 46,76 44,88 28,88 24,74" fill="#111" opacity="0.85" />
      <polygon points="28,38 36,44 34,58 20,60 16,46" fill="#111" opacity="0.85" />
      <ellipse cx="38" cy="32" rx="10" ry="6" fill="white" opacity="0.25" />
    </svg>
  )
}

function RugbyBallSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="rg1" cx="38%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#e87c2a" />
          <stop offset="100%" stopColor="#7a3200" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="50" rx="44" ry="28" fill="url(#rg1)" />
      <line x1="50" y1="28" x2="50" y2="72" stroke="white" strokeWidth="1.5" opacity="0.7" />
      <line x1="42" y1="36" x2="58" y2="36" stroke="white" strokeWidth="1.2" opacity="0.6" />
      <line x1="40" y1="44" x2="60" y2="44" stroke="white" strokeWidth="1.2" opacity="0.6" />
      <line x1="40" y1="52" x2="60" y2="52" stroke="white" strokeWidth="1.2" opacity="0.6" />
      <line x1="40" y1="60" x2="60" y2="60" stroke="white" strokeWidth="1.2" opacity="0.6" />
      <ellipse cx="38" cy="36" rx="8" ry="4" fill="white" opacity="0.2" />
    </svg>
  )
}

function GolfBallSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="gg1" cx="38%" cy="33%" r="58%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#c0c8d0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#gg1)" />
      {[
        [35,30],[50,28],[65,30],[28,42],[43,40],[57,40],[72,42],
        [32,55],[47,53],[62,53],[67,55],[38,66],[52,68],[66,66],
        [44,78],[58,78],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3.5" fill="none" stroke="#aab4bc" strokeWidth="1" opacity="0.7" />
      ))}
      <ellipse cx="40" cy="34" rx="9" ry="5" fill="white" opacity="0.35" />
    </svg>
  )
}

function TennisBallSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="tg1" cx="38%" cy="33%" r="58%">
          <stop offset="0%" stopColor="#d4f542" />
          <stop offset="100%" stopColor="#7aad00" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#tg1)" />
      <path d="M20,38 Q50,20 80,38" fill="none" stroke="white" strokeWidth="3" opacity="0.7" />
      <path d="M20,62 Q50,80 80,62" fill="none" stroke="white" strokeWidth="3" opacity="0.7" />
      <ellipse cx="38" cy="34" rx="10" ry="5" fill="white" opacity="0.25" />
    </svg>
  )
}

const BALLS = [
  { id: "football", Component: FootballSVG,   size: 52 },
  { id: "rugby",    Component: RugbyBallSVG,  size: 52 },
  { id: "golf",     Component: GolfBallSVG,   size: 44 },
  { id: "tennis",   Component: TennisBallSVG, size: 48 },
] as const

const MOODS = [
  {
    id: "taz",
    src: "/quirk.png",
    alt: "Quirk spinning",
    size: 52,
    animation: "quirk-taz 0.16s linear infinite",
    shadow: "drop-shadow(0 0 10px rgba(92,184,39,0.95))",
    ring: true,
  },
  {
    id: "bat",
    src: "/quirk-bats.jpeg",
    alt: "Quirk swinging a bat",
    size: 56,
    animation: "quirk-swing 0.55s ease-in-out infinite alternate",
    shadow: "drop-shadow(0 4px 10px rgba(92,184,39,0.7))",
    ring: false,
  },
  {
    id: "happy",
    src: "/quirk.png",
    alt: "Quirk bouncing",
    size: 50,
    animation: "quirk-bounce 0.45s ease-in-out infinite alternate",
    shadow: "drop-shadow(0 6px 14px rgba(92,184,39,0.6))",
    ring: false,
  },
  {
    id: "chilled",
    src: "/quirk.png",
    alt: "Quirk chilling",
    size: 46,
    animation: "quirk-chilled 2.2s ease-in-out infinite",
    shadow: "drop-shadow(0 3px 8px rgba(92,184,39,0.4))",
    ring: false,
  },
] as const

type Mood    = typeof MOODS[number]
type BallDef = typeof BALLS[number]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function rand(min: number, max: number) { return Math.random() * (max - min) + min }
function pick<T>(arr: readonly T[]): T  { return arr[Math.floor(Math.random() * arr.length)] }

/**
 * Find all blank card zones in the current viewport.
 * We look for [data-quirk-zone] elements, or fall back to finding the centre
 * score column inside fixture cards (.quirk-score-col).
 * Returns {x, y} in page-fixed coords, centred on that zone.
 */
function findBlankZones(itemSize: number): Array<{ x: number; y: number }> {
  const zones: Array<{ x: number; y: number }> = []

  // Primary: explicitly tagged blank zones
  document.querySelectorAll<HTMLElement>("[data-quirk-zone]").forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.width < itemSize || r.height < 12) return
    // Must be in viewport
    if (r.bottom < 72 || r.top > window.innerHeight - 80) return
    zones.push({
      x: r.left + r.width / 2 - itemSize / 2,
      y: r.top  + r.height / 2 - itemSize / 2,
    })
  })

  if (zones.length > 0) return zones

  // Fallback: right half of any fixture card — the gap between score col and TV btn
  // Cards are .rounded-xl.border.bg-card — we look for those
  document.querySelectorAll<HTMLElement>(".bg-card.rounded-xl.border").forEach((card) => {
    const r = card.getBoundingClientRect()
    if (r.height < 60 || r.width < 200) return
    if (r.bottom < 72 || r.top > window.innerHeight - 80) return
    // Use the right-centre blank area (left: 55%–85% of card, vertically centred top row)
    const x = r.left + r.width * 0.55 + rand(0, r.width * 0.25)
    const y = r.top  + r.height * 0.18 + rand(0, r.height * 0.3)
    zones.push({ x: Math.min(x, window.innerWidth - itemSize - 8), y })
  })

  if (zones.length > 0) return zones

  // Last resort: safe random position avoiding header + bottom nav
  const pad = 16
  return [{
    x: rand(pad, Math.max(pad + 1, window.innerWidth  - itemSize - pad)),
    y: rand(80, Math.max(82,        window.innerHeight - itemSize - 84)),
  }]
}

function pickZone(itemSize: number): { x: number; y: number } {
  const zones = findBlankZones(itemSize)
  return pick(zones)
}

// ─────────────────────────────────────────────────────────────────────────────
// BALL POP SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

type Phase = "idle" | "mount" | "in" | "out"

function BallPopSystem() {
  const [active, setActive] = useState<{ ball: BallDef; x: number; y: number; rot: number } | null>(null)
  const [phase,  setPhase]  = useState<Phase>("idle")
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const alive  = useRef(true)
  const push = (t: ReturnType<typeof setTimeout>) => timers.current.push(t)
  const clearAll = () => { timers.current.forEach(clearTimeout); timers.current = [] }

  const trigger = useCallback(() => {
    if (!alive.current) return
    const ball = pick(BALLS)
    const { x, y } = pickZone(ball.size)
    setActive({ ball, x, y, rot: rand(-35, 35) })
    setPhase("mount")
    requestAnimationFrame(() =>
      requestAnimationFrame(() => { if (alive.current) setPhase("in") })
    )
    // visible 0.5–2s, then out
    push(setTimeout(() => {
      if (!alive.current) return
      setPhase("out")
      push(setTimeout(() => {
        if (!alive.current) return
        setActive(null)
        setPhase("idle")
        push(setTimeout(trigger, rand(500, 7000))) // next: 0.5–7s → total ≤10s
      }, 380))
    }, rand(500, 2000)))
  }, [])

  useEffect(() => {
    alive.current = true
    push(setTimeout(trigger, rand(800, 3000)))
    return () => { alive.current = false; clearAll() }
  }, [trigger])

  if (!active || phase === "idle") return null
  const { ball, x, y, rot } = active
  const on = phase === "in"

  return (
    <div
      aria-hidden="true"
      style={{
        position:      "fixed",
        zIndex:        9997,
        pointerEvents: "none",
        left:  x,
        top:   y,
        width:  ball.size,
        height: ball.size,
        transform: on ? `scale(1.3) rotate(${rot}deg)` : "scale(0) rotate(0deg)",
        opacity:   on ? 1 : 0,
        transition: on
          ? "transform 340ms cubic-bezier(0.34, 1.7, 0.64, 1), opacity 180ms ease"
          : "transform 360ms cubic-bezier(0.55, 0, 0.4, 1), opacity 280ms ease",
        willChange: "transform, opacity",
        filter:     "drop-shadow(0 10px 20px rgba(0,0,0,0.55))",
      }}
    >
      <ball.Component size={ball.size} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QUIRK MASCOT POPS — targets real card blank zones
// ─────────────────────────────────────────────────────────────────────────────

function QuirkMascotPops() {
  const [pop,   setPop]   = useState<{ mood: Mood; x: number; y: number } | null>(null)
  const [phase, setPhase] = useState<Phase>("idle")
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const alive  = useRef(true)
  const push = (t: ReturnType<typeof setTimeout>) => timers.current.push(t)
  const clearAll = () => { timers.current.forEach(clearTimeout); timers.current = [] }

  const trigger = useCallback(() => {
    if (!alive.current) return
    const mood = pick(MOODS)
    const { x, y } = pickZone(mood.size)
    setPop({ mood, x, y })
    setPhase("mount")
    requestAnimationFrame(() =>
      requestAnimationFrame(() => { if (alive.current) setPhase("in") })
    )
    // visible 0.5–2s, then out; next pop 0.5–7s after → max ~10s total
    push(setTimeout(() => {
      if (!alive.current) return
      setPhase("out")
      push(setTimeout(() => {
        if (!alive.current) return
        setPop(null)
        setPhase("idle")
        push(setTimeout(trigger, rand(500, 7000)))
      }, 240))
    }, rand(500, 2000)))
  }, [])

  useEffect(() => {
    alive.current = true
    push(setTimeout(trigger, rand(500, 2500)))
    return () => { alive.current = false; clearAll() }
  }, [trigger])

  if (!pop || phase === "idle") return null
  const { mood, x, y } = pop
  const on = phase === "in"

  return (
    <div
      aria-hidden="true"
      style={{
        position:      "fixed",
        zIndex:        9998,
        pointerEvents: "none",
        left:  x,
        top:   y,
        width:  mood.size,
        height: mood.size,
        transform: on ? "scale(1) rotate(0deg)" : "scale(0) rotate(-180deg)",
        opacity:   on ? 1 : 0,
        transition: "transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease",
        filter:    mood.shadow,
        willChange: "transform, opacity",
      }}
    >
      <Image
        src={mood.src}
        alt={mood.alt}
        width={mood.size}
        height={mood.size}
        className={`h-full w-full select-none object-cover ${
          mood.id === "bat" ? "rounded-lg object-top" : "rounded-full"
        }`}
        style={{ animation: on ? mood.animation : "none" }}
        unoptimized
        priority={false}
      />
      {mood.ring && on && (
        <span
          aria-hidden="true"
          style={{
            position:     "absolute",
            inset:        -8,
            borderRadius: "50%",
            border:       "2.5px solid rgba(92,184,39,0.65)",
            animation:    "spin 0.18s linear infinite",
          }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QUIRK NOTIFICATION BURST
// ─────────────────────────────────────────────────────────────────────────────

function QuirkNotificationBurst() {
  const [visible, setVisible] = useState(false)
  const [label,   setLabel]   = useState("")
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function onNotification(e: Event) {
      const detail = (e as CustomEvent).detail
      setLabel(detail?.title ?? "New update!")
      setVisible(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setVisible(false), 2800)
    }
    window.addEventListener("sf:notification", onNotification)
    return () => {
      window.removeEventListener("sf:notification", onNotification)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (
    <div
      aria-live="polite"
      style={{
        position:      "fixed",
        zIndex:        9999,
        pointerEvents: "none",
        top:           58,
        right:         10,
        display:       "flex",
        flexDirection: "column",
        alignItems:    "flex-end",
        gap:           4,
        transform:     visible ? "translateY(0) scale(1)" : "translateY(-18px) scale(0.6)",
        opacity:       visible ? 1 : 0,
        transition:    "transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 220ms ease",
        willChange:    "transform, opacity",
      }}
    >
      {label && (
        <div style={{
          background:   "var(--primary, #5cb827)",
          color:        "#fff",
          fontSize:     11,
          fontWeight:   700,
          borderRadius: 10,
          padding:      "4px 10px",
          whiteSpace:   "nowrap",
          maxWidth:     180,
          overflow:     "hidden",
          textOverflow: "ellipsis",
          boxShadow:    "0 4px 14px rgba(0,0,0,0.4)",
        }}>
          {label}
        </div>
      )}
      <Image
        src="/quirk.png"
        alt="Quirk has an update"
        width={60}
        height={60}
        style={{
          animation:  visible ? "quirk-bounce 0.4s ease-in-out infinite alternate" : "none",
          filter:     "drop-shadow(0 6px 16px rgba(92,184,39,0.75))",
          userSelect: "none",
        }}
        unoptimized
        priority={false}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────

/** No-op stub kept for backwards compat with TV page refs */
export function useQuirkSlot(_id: string) {
  return useRef<HTMLDivElement>(null)
}

function QuirkPopInInner() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(loadAppSettings().quirkyAnimations)
    // Re-check whenever storage changes (e.g. settings page toggle)
    function onStorage(e: StorageEvent) {
      if (e.key === "sf_app_settings") setEnabled(loadAppSettings().quirkyAnimations)
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  if (!enabled) return null

  return (
    <>
      <BallPopSystem />
      <QuirkMascotPops />
      <QuirkNotificationBurst />
    </>
  )
}

export function QuirkPopIn() {
  return <QuirkPopInInner />
}
