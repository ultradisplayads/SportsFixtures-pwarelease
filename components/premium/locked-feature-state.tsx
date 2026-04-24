"use client"

import { Lock } from "lucide-react"
import Link from "next/link"
import type { ModuleGate } from "@/types/monetization"
import { cn } from "@/lib/utils"

interface LockedFeatureStateProps {
  title: string
  body: string
  href?: string
  /** Pass a gate directly when using useEntitlements() */
  gate?: ModuleGate
  className?: string
}

export function LockedFeatureState({
  title,
  body,
  href = "/premium",
  gate,
  className,
}: LockedFeatureStateProps) {
  // If a gate is supplied and it isn't locked, render nothing
  if (gate && !gate.locked) return null

  const resolvedHref = gate?.upgradeCta?.href ?? href
  const resolvedLabel = gate?.upgradeCta?.label ?? "See Premium"

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card/50 p-4",
        className,
      )}
      role="region"
      aria-label={title}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
          <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground/90">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
        </div>
      </div>
      <Link
        href={resolvedHref}
        className="mt-3 inline-flex items-center rounded-xl border border-primary/30 bg-primary/8 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
      >
        {resolvedLabel}
      </Link>
    </div>
  )
}
