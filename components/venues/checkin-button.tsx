"use client"

import { useState } from "react"
import { MapPin, Loader2 } from "lucide-react"
import { triggerHaptic } from "@/lib/haptic-feedback"

interface CheckinButtonProps {
  venueId: string
  eventId?: string
  /** Whether the current user has already checked in */
  active?: boolean
  /** Called with the new checked-in state after a successful API call */
  onToggle?: (checkedIn: boolean) => void
}

export function CheckinButton({ venueId, eventId, active = false, onToggle }: CheckinButtonProps) {
  const [checkedIn, setCheckedIn] = useState(active)
  const [pending, setPending] = useState(false)

  async function handleClick() {
    if (pending) return
    triggerHaptic("selection")
    setPending(true)
    try {
      const body: Record<string, string> = { venueId }
      if (eventId) body.eventId = eventId

      const res = await fetch("/api/venue-checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const next = !checkedIn
        setCheckedIn(next)
        onToggle?.(next)
        triggerHaptic("medium")
      }
    } catch {
      // silent — user will see no state change
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-pressed={checkedIn}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
        checkedIn
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-primary/10 text-primary hover:bg-primary/20"
      } disabled:opacity-50`}
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
      ) : (
        <MapPin className="h-3 w-3" aria-hidden="true" />
      )}
      {checkedIn ? "Checked in" : "Check in here"}
    </button>
  )
}
