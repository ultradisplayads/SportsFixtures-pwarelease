"use client"

// components/debug/provider-note.tsx
// Section 13 — Dev-only provider routing disclosure shown alongside API-fetched data.
// Renders nothing in production unless NEXT_PUBLIC_DEBUG_COVERAGE is set.

import type { ProviderRoute } from "@/types/provider-matrix"

interface ProviderNoteProps {
  route: ProviderRoute
  className?: string
}

export function ProviderNote({ route, className = "" }: ProviderNoteProps) {
  if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_DEBUG_COVERAGE) {
    return null
  }

  return (
    <aside
      className={[
        "rounded border border-white/10 bg-white/5 p-3 font-mono text-[10px] text-white/50",
        className,
      ].join(" ")}
      aria-label="Provider routing debug note"
    >
      <div className="mb-1.5 text-white/30 uppercase tracking-widest text-[9px]">
        Provider Routing
      </div>

      <ul className="space-y-0.5">
        <li className="flex gap-2">
          <span className="w-20 shrink-0 text-white/30">primary</span>
          <span className="text-white/60">{route.primary}</span>
        </li>
        {route.fallback && (
          <li className="flex gap-2">
            <span className="w-20 shrink-0 text-white/30">fallback</span>
            <span className="text-white/40">{route.fallback}</span>
          </li>
        )}
        <li className="flex gap-2">
          <span className="w-20 shrink-0 text-white/30">strategy</span>
          <span className="text-white/50">{route.strategy}</span>
        </li>
        {route.reason && (
          <li className="flex gap-2">
            <span className="w-20 shrink-0 text-white/30">reason</span>
            <span className="text-white/40 break-all">{route.reason}</span>
          </li>
        )}
      </ul>
    </aside>
  )
}
