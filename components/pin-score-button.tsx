"use client"

import { useEffect, useState } from "react"
import { Pin } from "lucide-react"
import { triggerHaptic } from "@/lib/haptic-feedback"
import {
  isScorePinned,
  onPinnedScoresChange,
  togglePinnedScore,
  type PinnedScore,
} from "@/lib/pinned-scores"

type PinScoreButtonProps = {
  score: Omit<PinnedScore, "updatedAt">
  compact?: boolean
}

export function PinScoreButton({ score, compact = false }: PinScoreButtonProps) {
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    setPinned(isScorePinned(score.id))
    return onPinnedScoresChange(() => setPinned(isScorePinned(score.id)))
  }, [score.id])

  return (
    <button
      type="button"
      aria-label={pinned ? `Unpin ${score.home} vs ${score.away}` : `Pin ${score.home} vs ${score.away} to home screen`}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        triggerHaptic("light")
        const result = togglePinnedScore(score)
        setPinned(result.pinned)
      }}
      className={`inline-flex items-center justify-center gap-1 rounded-md border text-[10px] font-bold transition-colors ${
        compact ? "h-7 w-7 px-0" : "px-2 py-1"
      } ${
        pinned
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/60 hover:text-primary"
      }`}
    >
      <Pin className={`h-3 w-3 ${pinned ? "fill-current" : ""}`} />
      {!compact && <span>{pinned ? "Pinned" : "Pin"}</span>}
    </button>
  )
}
