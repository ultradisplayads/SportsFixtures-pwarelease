"use client"

// components/platform/app-shell-safe-area.tsx
// Section 09 — Safe-area padding wrapper for standalone/installed PWA.
// Adds env(safe-area-inset-*) padding on the specified edges so content
// does not sit under the iOS notch or Android navigation bar.
// Renders a plain div with no visual treatment — pure layout primitive.

import type { CSSProperties, ReactNode } from "react"

type Edge = "top" | "bottom" | "left" | "right"

interface AppShellSafeAreaProps {
  children: ReactNode
  /** Which edges should receive safe-area padding. Defaults to all four. */
  edges?: Edge[]
  className?: string
}

const DEFAULT_EDGES: Edge[] = ["top", "bottom", "left", "right"]

export function AppShellSafeArea({
  children,
  edges = DEFAULT_EDGES,
  className,
}: AppShellSafeAreaProps) {
  const style: CSSProperties = {}

  for (const edge of edges) {
    const prop = `padding${edge.charAt(0).toUpperCase()}${edge.slice(1)}` as keyof CSSProperties
    style[prop] = `env(safe-area-inset-${edge}, 0px)` as any
  }

  return (
    <div style={style} className={className}>
      {children}
    </div>
  )
}
