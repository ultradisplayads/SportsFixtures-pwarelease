"use client"

// Section 10 — Native Handoff Note
// Internal dev-only reference component.
// Never rendered in production — strictly a developer reference surface.
//
// Shows:
// - Shared-core route contract
// - Browser-only feature isolation points and their abstraction status
// - Push payload expectations
// - Session/auth assumptions

import { useState } from "react"
import { HANDOFF_BOUNDARIES, SESSION_ASSUMPTIONS, NATIVE_HANDOFF_ROUTES } from "@/lib/native-handoff"

export function NativeHandoffNote() {
  const [section, setSection] = useState<"routes" | "boundaries" | "session">("routes")

  if (process.env.NODE_ENV !== "development") return null

  return (
    <div className="fixed bottom-4 left-4 z-50 max-h-[80vh] w-80 overflow-auto rounded border border-amber-600 bg-slate-900 p-3 font-mono text-xs text-slate-300 shadow-2xl">
      <p className="mb-2 font-semibold text-amber-400">Native Handoff Reference [DEV]</p>

      {/* Section tabs */}
      <div className="mb-3 flex gap-1">
        {(["routes", "boundaries", "session"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`rounded px-2 py-0.5 capitalize ${
              section === s
                ? "bg-amber-700 text-amber-100"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Routes */}
      {section === "routes" && (
        <div>
          <p className="mb-1 text-slate-400">Stable deep-link routes</p>
          {NATIVE_HANDOFF_ROUTES.map((r) => (
            <div key={r.pattern} className="flex items-center justify-between border-b border-slate-800 py-0.5 last:border-0">
              <span className="text-slate-200">{r.pattern}</span>
              <span className="text-slate-500">{r.kind}</span>
            </div>
          ))}
        </div>
      )}

      {/* Boundaries */}
      {section === "boundaries" && (
        <div className="space-y-2">
          {HANDOFF_BOUNDARIES.map((b) => (
            <div key={b.id} className="border-b border-slate-800 pb-2 last:border-0">
              <p className="flex items-center gap-1 font-semibold text-slate-100">
                <span className={b.abstracted ? "text-green-400" : "text-red-400"}>
                  {b.abstracted ? "[A]" : "[!]"}
                </span>
                {b.label}
              </p>
              <p className="text-slate-500">{b.location}</p>
            </div>
          ))}
          <p className="text-slate-600">[A] = abstracted, [!] = needs wrapping</p>
        </div>
      )}

      {/* Session */}
      {section === "session" && (
        <div className="space-y-1">
          {Object.entries(SESSION_ASSUMPTIONS).map(([k, v]) => (
            <div key={k} className="border-b border-slate-800 py-0.5 last:border-0">
              <span className="text-slate-400">{k}: </span>
              <span className="text-slate-200">{String(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
