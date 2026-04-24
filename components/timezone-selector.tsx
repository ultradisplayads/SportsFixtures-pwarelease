"use client"

import { useState, useEffect } from "react"
import { Globe, ChevronDown } from "lucide-react"
import { triggerHaptic } from "@/lib/haptic-feedback"

const POPULAR_TIMEZONES = [
  { label: "Local time", value: "local" },
  { label: "UTC", value: "UTC" },
  { label: "London (GMT)", value: "Europe/London" },
  { label: "Bangkok (ICT)", value: "Asia/Bangkok" },
  { label: "Dubai (GST)", value: "Asia/Dubai" },
  { label: "New York (ET)", value: "America/New_York" },
  { label: "Los Angeles (PT)", value: "America/Los_Angeles" },
  { label: "Sydney (AEDT)", value: "Australia/Sydney" },
  { label: "Tokyo (JST)", value: "Asia/Tokyo" },
  { label: "Mumbai (IST)", value: "Asia/Kolkata" },
  { label: "Berlin (CET)", value: "Europe/Berlin" },
  { label: "São Paulo (BRT)", value: "America/Sao_Paulo" },
]

const TZ_KEY = "sf_display_timezone"

export function getDisplayTimezone(): string {
  if (typeof window === "undefined") return "local"
  return localStorage.getItem(TZ_KEY) || "local"
}

export function formatInTimezone(date: Date | string, tz: string): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date
    if (isNaN(d.getTime())) return ""
    const opts: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz === "local" ? Intl.DateTimeFormat().resolvedOptions().timeZone : tz,
    }
    return new Intl.DateTimeFormat(undefined, opts).format(d)
  } catch {
    return ""
  }
}

export function TimezoneSelector() {
  const [current, setCurrent] = useState("local")
  const [open, setOpen] = useState(false)
  const [localLabel, setLocalLabel] = useState("Local time")

  useEffect(() => {
    const saved = getDisplayTimezone()
    setCurrent(saved)
    // Show the actual local timezone name
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const short = new Intl.DateTimeFormat(undefined, { timeZoneName: "short", timeZone: localTz })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value ?? ""
    setLocalLabel(`Local (${short})`)
  }, [])

  const select = (value: string) => {
    triggerHaptic("selection")
    setCurrent(value)
    localStorage.setItem(TZ_KEY, value)
    setOpen(false)
    // Dispatch event so fixtures-list can re-render times
    window.dispatchEvent(new CustomEvent("sf:timezone-change", { detail: { tz: value } }))
  }

  const label = current === "local"
    ? localLabel
    : POPULAR_TIMEZONES.find((t) => t.value === current)?.label ?? current

  return (
    <div className="relative">
      <button
        onClick={() => { triggerHaptic("light"); setOpen((o) => !o) }}
        className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
        aria-label="Change display timezone"
      >
        <Globe className="h-3.5 w-3.5 text-primary" />
        <span className="max-w-[110px] truncate">{label}</span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-border bg-card shadow-xl">
          <div className="max-h-72 overflow-y-auto p-1">
            {POPULAR_TIMEZONES.map((tz) => (
              <button
                key={tz.value}
                onClick={() => select(tz.value)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                  current === tz.value ? "bg-primary/10 font-semibold text-primary" : "text-foreground"
                }`}
              >
                {tz.value === "local" ? <span className="text-primary">*</span> : <span className="w-4" />}
                {tz.value === "local" ? `* ${localLabel}` : tz.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
