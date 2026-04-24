"use client"

// components/ticker/ticker-marquee-track.tsx
// Section 15.A — RAF-based horizontal marquee track.
//
// Extracted from PrimaryTickerRail in live-ticker.tsx.
//
// The track duplicates children 3× so the loop appears seamless: when the
// scroll position reaches 1/3 of the total width it resets to 0 making the
// repeat invisible. The speed is fixed at ~24px/s (0.4px per 60fps frame).
//
// Pause-on-hover is managed via a ref so it never triggers a re-render.
// Scroll position resets to 0 whenever children change (new feed data).

import { useEffect, useRef, type ReactNode } from "react"

interface TickerMarqueeTrackProps {
  children: ReactNode
  /** Items length — used as a reset signal when content changes. */
  itemCount: number
  className?: string
}

export function TickerMarqueeTrack({ children, itemCount, className }: TickerMarqueeTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const animRef  = useRef<number | null>(null)
  const posRef   = useRef(0)
  const pausedRef = useRef(false)

  // Reset position on content change so new items start from the left edge
  useEffect(() => {
    posRef.current = 0
  }, [itemCount])

  useEffect(() => {
    const track = trackRef.current
    if (!track || itemCount === 0) return

    const step = () => {
      if (!pausedRef.current) {
        posRef.current -= 0.4 // ~24px/s at 60fps
        // totalWidth is scrollWidth/3 because children are tripled by the parent
        const totalWidth = track.scrollWidth / 3
        if (Math.abs(posRef.current) >= totalWidth) {
          posRef.current = 0
        }
        track.style.transform = `translateX(${posRef.current}px)`
      }
      animRef.current = requestAnimationFrame(step)
    }

    animRef.current = requestAnimationFrame(step)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [itemCount])

  return (
    <div
      className={className}
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
    >
      <div
        ref={trackRef}
        className="flex will-change-transform"
        style={{ transform: "translateX(0)" }}
      >
        {/* Children are rendered 3× by the parent to create the loop */}
        {children}
      </div>
    </div>
  )
}
