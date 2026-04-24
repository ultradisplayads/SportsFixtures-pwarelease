"use client"

// components/admin/control-plane-key-value.tsx
// Section 12 — Label/value row for admin inspection panels.
//
// Two variants:
//   KVRow  — single label + value row with top-border separator
//   StatusBadge — enabled/disabled pill used by all admin panels

import { CheckCircle, XCircle } from "lucide-react"

// ── Status Badge ──────────────────────────────────────────────────────────────

export function StatusBadge({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-600 dark:text-green-400">
      <CheckCircle className="h-3 w-3" aria-hidden="true" />
      ON
    </span>
  ) : (
    <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
      <XCircle className="h-3 w-3" aria-hidden="true" />
      OFF
    </span>
  )
}

// ── Key-Value Row ─────────────────────────────────────────────────────────────

type KVRowProps = {
  label: string
  value: React.ReactNode
  /** Renders value in a monospace font (for IDs, codes, etc.) */
  mono?: boolean
}

export function KVRow({ label, value, mono = false }: KVRowProps) {
  const empty = value === null || value === undefined || value === ""
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border/50 pt-2.5 first:border-t-0 first:pt-0">
      <span className="min-w-[140px] shrink-0 text-xs text-muted-foreground">
        {label}
      </span>
      <span
        className={`text-right text-xs font-medium ${mono ? "font-mono" : ""}`}
      >
        {empty ? <span className="text-muted-foreground">—</span> : value}
      </span>
    </div>
  )
}

// ── KV Group ─────────────────────────────────────────────────────────────────

/** Wraps multiple KVRow entries with consistent vertical spacing. */
export function KVGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-0">{children}</div>
}
