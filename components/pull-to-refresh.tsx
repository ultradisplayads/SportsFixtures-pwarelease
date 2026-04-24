"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { RefreshCw } from "lucide-react"

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const threshold = 80

  const handleTouchStart = (e: TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (startY.current === 0 || isRefreshing) return

    const currentY = e.touches[0].clientY
    const distance = currentY - startY.current

    // Only allow pull down
    if (distance > 0 && containerRef.current && containerRef.current.scrollTop === 0) {
      setPullDistance(Math.min(distance, threshold * 1.5))
      // Prevent default scroll when pulling
      if (distance > 10) {
        e.preventDefault()
      }
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      await onRefresh()
      setIsRefreshing(false)
    }
    setPullDistance(0)
    startY.current = 0
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("touchstart", handleTouchStart, { passive: true })
    container.addEventListener("touchmove", handleTouchMove, { passive: false })
    container.addEventListener("touchend", handleTouchEnd)

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [pullDistance, isRefreshing])

  const progress = Math.min(pullDistance / threshold, 1)
  const rotation = progress * 360

  return (
    <div ref={containerRef} className="relative h-full overflow-y-auto">
      {/* Pull indicator */}
      <div
        className="absolute left-1/2 top-0 z-50 -translate-x-1/2 transition-transform"
        style={{
          transform: `translateX(-50%) translateY(${Math.max(pullDistance - 40, 0)}px)`,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
      >
        <div className="rounded-full bg-card p-2 shadow-lg">
          <RefreshCw
            className={`h-6 w-6 ${isRefreshing ? "animate-spin" : ""}`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
            }}
          />
        </div>
      </div>

      {children}
    </div>
  )
}
