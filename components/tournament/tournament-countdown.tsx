"use client"

// components/tournament/tournament-countdown.tsx
// Section 14 — Tournament Countdown
//
// Rules:
//   - only renders if countdownEnabled=true AND tournamentStartIso is a real future date
//   - must NOT fake urgency — if the start is in the past, renders nothing
//   - operator-controlled: disappears cleanly when tournament mode is off
//   - updates every second via requestAnimationFrame loop

import { useEffect, useRef, useState } from "react"
import type { TournamentModeState } from "@/types/tournament-mode"
import { getTournamentMsRemaining } from "@/lib/tournament-mode"
import { cn } from "@/lib/utils"

type Props = {
  state: TournamentModeState
  className?: string
}

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function msToTimeLeft(ms: number): TimeLeft {
  const totalSec = Math.floor(ms / 1000)
  const days    = Math.floor(totalSec / 86400)
  const hours   = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  return { days, hours, minutes, seconds }
}

function Segment({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="min-w-[2.25rem] rounded-lg bg-primary/10 px-2 py-1 text-center text-xl font-bold tabular-nums text-primary">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

export function TournamentCountdown({ state, className }: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    function tick() {
      const ms = getTournamentMsRemaining(state)
      if (ms === null || ms <= 0) {
        setTimeLeft(null)
        return
      }
      setTimeLeft(msToTimeLeft(ms))
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [state.tournamentStartIso]) // re-run only if start time changes

  // Gate: must be enabled + have a real future start time
  if (!state.countdownEnabled || !state.tournamentStartIso || timeLeft === null) {
    return null
  }

  const label = state.shortName ?? state.displayName ?? "Tournament"

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-4",
        className,
      )}
      role="timer"
      aria-label={`Countdown to ${label}`}
      aria-live="polite"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label} starts in
      </p>
      <div className="flex items-center gap-3">
        {timeLeft.days > 0 && <Segment value={timeLeft.days}    label="days"    />}
        <Segment value={timeLeft.hours}   label="hrs"  />
        <Segment value={timeLeft.minutes} label="min"  />
        <Segment value={timeLeft.seconds} label="sec"  />
      </div>
      {state.hostLocation && (
        <p className="text-xs text-muted-foreground">{state.hostLocation}</p>
      )}
    </div>
  )
}
