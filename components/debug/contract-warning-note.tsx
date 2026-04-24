"use client"

// components/debug/contract-warning-note.tsx
// Dev-only internal component — renders contract warnings from a
// NormalizedEnvelope so developers can see data-quality issues without
// polluting the production UI.
//
// Render rules:
//   - Only renders when NODE_ENV === "development" OR showInProd prop is set
//   - Collapsed by default; click to expand
//   - Never renders in production unless explicitly opted in

import { useState } from "react"
import type { ContractWarning, NormalizedEnvelope, DataAvailability, DataFreshness } from "@/types/contracts"

const AVAILABILITY_COLOR: Record<DataAvailability, string> = {
  full: "bg-green-900/40 text-green-300 border-green-700",
  partial: "bg-yellow-900/40 text-yellow-300 border-yellow-700",
  empty: "bg-zinc-800 text-zinc-400 border-zinc-600",
  unavailable: "bg-red-900/40 text-red-300 border-red-700",
  unsupported: "bg-purple-900/40 text-purple-300 border-purple-700",
}

const FRESHNESS_COLOR: Record<DataFreshness, string> = {
  live:      "text-green-400",
  near_live: "text-lime-400",
  cached:    "text-blue-400",
  stale:     "text-yellow-400",
  static:    "text-zinc-400",
  unknown:   "text-zinc-500",
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  envelope: NormalizedEnvelope<any>
  label?: string
  showInProd?: boolean
}

export function ContractWarningNote({ envelope, label, showInProd }: Props) {
  const [open, setOpen] = useState(false)

  const isDev = process.env.NODE_ENV === "development"
  if (!isDev && !showInProd) return null

  const hasWarnings = (envelope.warnings?.length ?? 0) > 0
  const colorClass = AVAILABILITY_COLOR[envelope.availability] ?? AVAILABILITY_COLOR.unavailable

  return (
    <div
      className={`my-2 rounded border text-xs font-mono ${colorClass}`}
      role="note"
      aria-label="Contract debug note"
    >
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-1.5"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-semibold">
          {label ? `[contract] ${label}` : "[contract]"}{" "}
          <span className="opacity-60">{envelope.source}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className={`font-medium ${FRESHNESS_COLOR[envelope.freshness]}`}>
            {envelope.freshness}
          </span>
          <span className="opacity-60">{envelope.availability}</span>
          {hasWarnings && (
            <span className="rounded bg-yellow-500/20 px-1 text-yellow-300">
              {envelope.warnings!.length}W
            </span>
          )}
          <span>{open ? "▲" : "▼"}</span>
        </span>
      </button>

      {open && (
        <div className="border-t border-current/20 px-3 py-2 space-y-1">
          <div className="opacity-70">
            fetchedAt: {envelope.fetchedAt ?? "—"} | staleAt: {envelope.staleAt ?? "—"}
          </div>
          {envelope.unavailableReason && (
            <div className="text-red-300">reason: {envelope.unavailableReason}</div>
          )}
          {hasWarnings && (
            <ul className="mt-1 space-y-0.5">
              {envelope.warnings!.map((w: ContractWarning, i: number) => (
                <li key={i} className="text-yellow-300">
                  [{w.code}]{w.field ? ` (${w.field})` : ""}: {w.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
