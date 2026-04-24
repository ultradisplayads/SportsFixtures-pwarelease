"use client"

/**
 * components/reminder-button.tsx
 *
 * Section 02 — Canonical reminder button using the unified subscription model.
 *
 * Uses useNotifications().subscribe / unsubscribe directly.
 * All subscription payloads use the DB-native NotificationSubscription shape.
 *
 * Reminder offsets are typed ReminderOffset values — "0m" is NOT supported
 * here because kickoff is modelled as an AlertCategory ("kickoff"), not an offset.
 *
 * Props:
 *   eventId      — TheSportsDB event ID string
 *   homeTeam     — home team name
 *   awayTeam     — away team name
 *   league?      — league/competition name
 *   size?        — "sm" | "md" | "lg"  (default: "md")
 *   iconOnly?    — show only the bell, no label (default: true)
 *   className?
 *
 * Behaviour:
 *   - Short tap: toggle subscription on/off
 *   - Long press (>420ms): open reminder-offset picker
 *   - Haptic on all interactions
 */

import { useState, useRef, useCallback } from "react"
import { Bell, Check, Clock } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import { triggerHaptic } from "@/lib/haptic-feedback"
import { REMINDER_OPTIONS, REMINDER_LABELS } from "@/lib/alerts"
import type { ReminderOffset } from "@/types/notifications"

// ── Reminder offset ladder (full — from lib/alerts.ts) ────────────────────────
// "0m" intentionally excluded: kickoff is the "kickoff" AlertCategory, not an offset.

const OFFSETS: { label: string; value: ReminderOffset }[] = REMINDER_OPTIONS.map((v) => ({
  value: v,
  label: REMINDER_LABELS[v],
}))

// ── Default event categories sent when creating a subscription ────────────────
const DEFAULT_EVENT_CATEGORIES = [
  "match_reminder",
  "kickoff",
  "lineups",
  "full_time",
] as const

const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "h-7 rounded-lg text-xs",
  md: "h-8 rounded-xl text-sm",
  lg: "h-10 rounded-xl text-base",
}

const ICON_SIZES: Record<"sm" | "md" | "lg", number> = { sm: 14, md: 16, lg: 18 }

interface ReminderButtonProps {
  eventId:      string
  homeTeam:     string
  awayTeam:     string
  league?:      string
  size?:        "sm" | "md" | "lg"
  iconOnly?:    boolean
  className?:   string
}

export function ReminderButton({
  eventId,
  homeTeam,
  awayTeam,
  size = "md",
  iconOnly = true,
  className = "",
}: ReminderButtonProps) {
  const { subscriptions, subscribe, unsubscribe, preferences } = useNotifications()
  const [showOffsets, setShowOffsets] = useState(false)
  const [busy, setBusy] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentSub = subscriptions.find(
    (s) => s.entity_type === "event" && s.entity_id === eventId,
  )
  const isSubscribed = Boolean(currentSub)

  // ── Long-press → open offset picker ─────────────────────────────────────────
  const handlePointerDown = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      triggerHaptic("medium")
      setShowOffsets(true)
    }, 420)
  }, [])

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }, [])

  // ── Short tap → toggle subscribe/unsubscribe ─────────────────────────────────
  const handleToggle = useCallback(async () => {
    if (busy) return
    setBusy(true)
    triggerHaptic("selection")

    try {
      if (isSubscribed) {
        await unsubscribe("event", eventId)
      } else {
        await subscribe({
          entity_type: "event",
          entity_id:   eventId,
          entity_name: `${homeTeam} vs ${awayTeam}`,
          categories:  [...DEFAULT_EVENT_CATEGORIES],
          reminder_offsets: preferences.default_reminder_offsets,
          tier: "tier2",
        })
      }
    } finally {
      setBusy(false)
    }
  }, [busy, isSubscribed, eventId, homeTeam, awayTeam, subscribe, unsubscribe, preferences])

  // ── Toggle a single offset in the picker ────────────────────────────────────
  const toggleOffset = useCallback(
    async (offset: ReminderOffset) => {
      triggerHaptic("selection")
      const current = (currentSub?.reminder_offsets ?? preferences.default_reminder_offsets) as ReminderOffset[]
      const next = current.includes(offset)
        ? current.filter((o) => o !== offset)
        : [...current, offset]
      if (next.length === 0) return // must keep at least one

      if (isSubscribed) {
        await unsubscribe("event", eventId)
        await subscribe({
          entity_type:      "event",
          entity_id:        eventId,
          entity_name:      `${homeTeam} vs ${awayTeam}`,
          categories:       currentSub?.categories ?? [...DEFAULT_EVENT_CATEGORIES],
          reminder_offsets: next,
          tier:             currentSub?.tier ?? "tier2",
        })
      }
    },
    [currentSub, preferences, isSubscribed, eventId, homeTeam, awayTeam, subscribe, unsubscribe],
  )

  const activeOffsets = (currentSub?.reminder_offsets ?? preferences.default_reminder_offsets) as ReminderOffset[]

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        aria-label={isSubscribed ? "Remove reminder" : "Set reminder"}
        aria-pressed={isSubscribed}
        disabled={busy}
        className={[
          "flex items-center justify-center gap-1.5 border transition-all duration-200 px-3",
          SIZE_CLASSES[size],
          isSubscribed
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary",
          busy ? "opacity-50 cursor-wait" : "cursor-pointer",
          className,
        ].join(" ")}
      >
        <Bell
          className={isSubscribed ? "fill-current" : ""}
          style={{ width: ICON_SIZES[size], height: ICON_SIZES[size] }}
        />
        {!iconOnly && (
          <span className="font-medium">{isSubscribed ? "Reminded" : "Remind me"}</span>
        )}
      </button>

      {/* Offset picker popover */}
      {showOffsets && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowOffsets(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-border bg-card shadow-lg p-1.5">
            <p className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Remind me before kick-off
            </p>
            {OFFSETS.map(({ label, value }) => {
              const active = activeOffsets.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => toggleOffset(value)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {label}
                  </div>
                  {active && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
