"use client"

// Section 10 — Platform Capability Note
// Dev-only component showing the current platform capability matrix.
// Never rendered in production unless showInProd is explicitly set.

import { useState } from "react"
import { usePlatformTarget } from "@/hooks/use-platform-target"

interface PlatformCapabilityNoteProps {
  showInProd?: boolean
}

export function PlatformCapabilityNote({ showInProd }: PlatformCapabilityNoteProps) {
  const [open, setOpen] = useState(false)
  const { target, capabilities, isStandalone } = usePlatformTarget()

  if (process.env.NODE_ENV !== "development" && !showInProd) return null

  const rows: Array<[string, boolean | string]> = [
    ["Target",             target],
    ["Standalone",         isStandalone],
    ["Install prompt",     capabilities.installPrompt],
    ["Browser push",       capabilities.browserPush],
    ["Native push ready",  capabilities.nativePushReady],
    ["Share intent",       capabilities.shareIntentReady],
    ["Deep-link ready",    capabilities.deepLinkReady],
  ]

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono text-xs">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded bg-slate-800 px-2 py-1 text-slate-200 opacity-70 hover:opacity-100"
      >
        {open ? "Hide" : "Platform"}
      </button>

      {open && (
        <div className="mt-1 rounded border border-slate-700 bg-slate-900 p-3 text-slate-300 shadow-xl">
          <p className="mb-2 font-semibold text-slate-100">Platform Capabilities</p>
          <table className="w-full border-collapse">
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} className="border-b border-slate-700 last:border-0">
                  <td className="py-0.5 pr-4 text-slate-400">{label}</td>
                  <td className={typeof value === "boolean"
                    ? value ? "text-green-400" : "text-red-400"
                    : "text-slate-200"
                  }>
                    {typeof value === "boolean" ? (value ? "yes" : "no") : String(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
