"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Loader2, Radio, Users } from "lucide-react"
import { triggerHaptic } from "@/lib/haptic-feedback"

type CrowdLabel = "Quiet" | "Getting busy" | "Busy" | "Packed"

interface Props {
  venueId: string
  eventId?: string
  initialCheckins?: number
  initialWatchers?: number
  initialCrowdLabel?: CrowdLabel
}

function crowdLabelFromCount(count: number): CrowdLabel {
  if (count >= 80) return "Packed"
  if (count >= 35) return "Busy"
  if (count >= 12) return "Getting busy"
  return "Quiet"
}

export function VenuePresencePanel({
  venueId,
  eventId,
  initialCheckins = 0,
  initialWatchers = 0,
  initialCrowdLabel,
}: Props) {
  const [checkins, setCheckins] = useState(initialCheckins)
  const [watchers, setWatchers] = useState(initialWatchers)
  const [checkedIn, setCheckedIn] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadPresence() {
      const checkinUrl = `/api/venue-checkins?venueId=${encodeURIComponent(venueId)}`
      const watcherUrl = `/api/venue-watchers?venueId=${encodeURIComponent(venueId)}${
        eventId ? `&eventId=${encodeURIComponent(eventId)}` : ""
      }`

      const [checkinRes, watcherRes] = await Promise.allSettled([
        fetch(checkinUrl, { cache: "no-store" }).then((res) => res.json()),
        fetch(watcherUrl, { cache: "no-store" }).then((res) => res.json()),
      ])

      if (cancelled) return
      if (checkinRes.status === "fulfilled" && Number.isFinite(checkinRes.value?.count)) {
        setCheckins(Number(checkinRes.value.count))
      }
      if (watcherRes.status === "fulfilled" && Number.isFinite(watcherRes.value?.count)) {
        setWatchers(Number(watcherRes.value.count))
      }
    }

    loadPresence().catch(() => {})
    return () => {
      cancelled = true
    }
  }, [eventId, venueId])

  const crowdLabel = useMemo(
    () => initialCrowdLabel ?? crowdLabelFromCount(checkins + watchers),
    [checkins, initialCrowdLabel, watchers],
  )

  async function checkIn() {
    if (checkedIn || busy) return
    setBusy(true)
    triggerHaptic("medium")

    try {
      await fetch("/api/venue-checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, eventId }),
      })
      setCheckins((value) => value + 1)
      setCheckedIn(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Watching Here</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Live crowd signal for this venue</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {crowdLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-border bg-muted/40 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
            Check-ins
          </div>
          <p className="mt-1 text-2xl font-bold">{checkins.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Users className="h-4 w-4 text-primary" aria-hidden="true" />
            Watching
          </div>
          <p className="mt-1 text-2xl font-bold">{watchers.toLocaleString()}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={checkIn}
        disabled={checkedIn || busy}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Radio className="h-4 w-4" aria-hidden="true" />}
        {checkedIn ? "You're checked in" : "I'm watching here"}
      </button>
    </section>
  )
}
