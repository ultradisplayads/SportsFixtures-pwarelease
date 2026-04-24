"use client"

// components/debug/support-state-chip.tsx
// Section 11 — Inline chip that visualises a CoverageLevel for debug/admin surfaces.
// Renders nothing in production unless NEXT_PUBLIC_DEBUG_COVERAGE is set.

import type { CoverageLevel } from "@/types/coverage"

interface SupportStateChipProps {
  level: CoverageLevel
  label?: string
  className?: string
}

const LEVEL_STYLES: Record<CoverageLevel, string> = {
  full:         "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  partial:      "bg-amber-500/15 text-amber-400 border-amber-500/30",
  limited:      "bg-orange-500/15 text-orange-400 border-orange-500/30",
  unavailable:  "bg-red-500/15 text-red-400 border-red-500/30",
  none:         "bg-red-500/10 text-red-500/60 border-red-500/20",
  unknown:      "bg-white/10 text-white/40 border-white/20",
}

const LEVEL_LABEL: Record<CoverageLevel, string> = {
  full:         "Full",
  partial:      "Partial",
  limited:      "Limited",
  unavailable:  "None",
  none:         "None",
  unknown:      "Unknown",
}

export function SupportStateChip({ level, label, className = "" }: SupportStateChipProps) {
  if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_DEBUG_COVERAGE) {
    return null
  }

  return (
    <span
      className={[
        "inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[9px] leading-none uppercase tracking-wide",
        LEVEL_STYLES[level] ?? LEVEL_STYLES.none,
        className,
      ].join(" ")}
      title={`Coverage: ${level}`}
    >
      {label ?? LEVEL_LABEL[level] ?? level}
    </span>
  )
}
