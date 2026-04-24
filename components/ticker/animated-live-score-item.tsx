"use client"

// components/ticker/animated-live-score-item.tsx
// Section 15.C — Framer-motion score animation for live score ticker items.
//
// Uses useItemScoreAnimation to detect real score changes (home or away)
// between renders. On change: a brief scale-pulse plays on the score badge
// and a ring radiates outward (framer-motion AnimatePresence).
//
// Rules:
//   - Never animates on first mount.
//   - Reads homeScore / awayScore (canonical fields) with fallback to
//     scoreHome / scoreAway (legacy fields) for backward compatibility.
//   - Parent MUST NOT set scorePulsing=true unless the score actually changed.

import { AnimatePresence, motion } from "framer-motion"
import type { TickerItem } from "@/types/ticker"
import { useItemScoreAnimation } from "@/hooks/use-live-score-animation"
import { TickerScoreDisplay } from "@/components/ticker/ticker-score-display"

interface AnimatedLiveScoreItemProps {
  item: TickerItem
  /**
   * Optional external pulse flag — overrides the internal detection.
   * When omitted the component detects score changes itself via
   * useItemScoreAnimation.
   */
  scorePulsing?: boolean
}

export function AnimatedLiveScoreItem({ item, scorePulsing }: AnimatedLiveScoreItemProps) {
  // Prefer canonical homeScore/awayScore; fall back to legacy scoreHome/scoreAway
  const home = item.homeScore ?? item.scoreHome ?? null
  const away = item.awayScore ?? item.scoreAway ?? null

  const { pulsing: internalPulsing } = useItemScoreAnimation(home, away)
  const shouldPulse = scorePulsing ?? internalPulsing

  return (
    <span
      className="relative inline-flex items-center"
      aria-live={shouldPulse ? "polite" : undefined}
      aria-atomic={shouldPulse ? "true" : undefined}
    >
      {/* Radiating ring on score change */}
      <AnimatePresence>
        {shouldPulse && (
          <motion.span
            key="pulse-ring"
            className="pointer-events-none absolute inset-0 rounded bg-white/25"
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Score badge — briefly scales up on change */}
      <motion.span
        animate={shouldPulse ? { scale: [1, 1.15, 1] } : { scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <TickerScoreDisplay item={item} />
      </motion.span>
    </span>
  )
}
