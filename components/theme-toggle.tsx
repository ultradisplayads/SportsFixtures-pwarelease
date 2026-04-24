"use client"

import { useEffect, useRef, useState } from "react"
import { Moon, Sun, Disc3 } from "lucide-react"
import { useTheme, DISCO_COLORS, type DiscoColor } from "./theme-provider"
import { triggerHaptic } from "@/lib/haptic-feedback"

// Tiny Web Audio API synth for disco sound (no external assets needed)
function useDiscoSound() {
  const ctxRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<number | undefined>(undefined)

  const start = () => {
    if (typeof window === "undefined") return
    if (!ctxRef.current) ctxRef.current = new AudioContext()
    const ctx = ctxRef.current

    const BPM = 128
    const beat = 60 / BPM

    const kick = (time: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(200, time)
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15)
      gain.gain.setValueAtTime(1.2, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18)
      osc.start(time)
      osc.stop(time + 0.18)
    }

    const hihat = (time: number) => {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.25
      const src = ctx.createBufferSource()
      src.buffer = buf
      const gain = ctx.createGain()
      src.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0.6, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04)
      src.start(time)
    }

    const synth = (time: number, freq: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sawtooth"
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.12, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15)
      osc.start(time)
      osc.stop(time + 0.15)
    }

    const NOTES = [523, 659, 784, 1047] // C5 E5 G5 C6 — major chord

    const scheduleBeat = () => {
      const now = ctx.currentTime
      kick(now)
      hihat(now + beat * 0.5)
      NOTES.forEach((n, i) => synth(now + (i * beat) / 4, n))
    }

    scheduleBeat()
    intervalRef.current = window.setInterval(scheduleBeat, beat * 1000 * 2)
  }

  const stop = () => {
    clearInterval(intervalRef.current)
    ctxRef.current?.close()
    ctxRef.current = null
  }

  return { start, stop }
}

export function ThemeToggle() {
  const { theme, setTheme, discoColor, setDiscoColor } = useTheme()
  const { start, stop } = useDiscoSound()
  const [soundOn, setSoundOn] = useState(false)

  const pick = (t: "light" | "dark" | "disco") => {
    triggerHaptic("light")
    setTheme(t)
    if (t !== "disco") {
      setSoundOn(false)
      stop()
    }
  }

  const toggleSound = () => {
    triggerHaptic("medium")
    if (soundOn) { stop(); setSoundOn(false) }
    else { start(); setSoundOn(true) }
  }

  const pickColor = (c: DiscoColor) => {
    triggerHaptic("light")
    setDiscoColor(c)
  }

  // Clean up on unmount
  useEffect(() => () => stop(), [])

  const activeBtn = (active: boolean) =>
    `flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-2.5 text-xs font-medium transition-all ${
      active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:bg-accent text-muted-foreground"
    }`

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">Appearance</h3>

      {/* Mode buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => pick("light")} className={activeBtn(theme === "light")}>
          <Sun className="h-5 w-5" />
          Light
        </button>
        <button onClick={() => pick("dark")} className={activeBtn(theme === "dark")}>
          <Moon className="h-5 w-5" />
          Dark
        </button>
        <button
          onClick={() => pick("disco")}
          className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-2.5 text-xs font-medium transition-all ${
            theme === "disco"
              ? "border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-400 shadow-[0_0_12px_2px_rgba(217,70,239,0.35)]"
              : "border-border bg-card hover:bg-accent text-muted-foreground"
          }`}
        >
          <Disc3 className={`h-5 w-5 ${theme === "disco" ? "animate-spin" : ""}`} style={{ animationDuration: "2s" }} />
          Disco
        </button>
      </div>

      {/* Disco options — only visible in disco mode */}
      {theme === "disco" && (
        <div className="space-y-3 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-3 animate-in fade-in slide-in-from-bottom-4 duration-300">

          {/* Color bar */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Party colour</p>
            <div className="flex gap-2">
              {DISCO_COLORS.map((c) => (
                <button
                  key={c.label}
                  title={c.label}
                  onClick={() => pickColor(c)}
                  className={`h-7 flex-1 rounded-full transition-all ${
                    discoColor.label === c.label
                      ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-background"
                      : "opacity-70 hover:opacity-100"
                  }`}
                  style={{ background: c.primary }}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>

          {/* Sound toggle */}
          <button
            onClick={toggleSound}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              soundOn
                ? "bg-fuchsia-500 text-white shadow-[0_0_12px_2px_rgba(217,70,239,0.5)]"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-base">{soundOn ? "🔊" : "🔇"}</span>
              {soundOn ? "Sound ON — Vibe check!" : "Enable party sound"}
            </span>
            {soundOn && (
              <span className="flex gap-0.5">
                {[1,2,3,4].map((i) => (
                  <span
                    key={i}
                    className="inline-block w-1 rounded-full bg-white"
                    style={{
                      height: `${8 + i * 4}px`,
                      animation: `light-bar-pulse ${0.4 + i * 0.1}s ease-in-out infinite`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </span>
            )}
          </button>

          <p className="text-center text-[10px] text-muted-foreground">
            Speakers required for party audio
          </p>
        </div>
      )}
    </div>
  )
}
