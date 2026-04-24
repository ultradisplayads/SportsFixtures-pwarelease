"use client"

// components/live-ticker.tsx
// Section 15.A — Public entry point for the live ticker.
//
// LiveTicker is the stable public export consumed by the app shell (HeaderMenu,
// layout). All rendering logic has been extracted into TickerShell and the
// individual rail components. This file is intentionally thin so the ticker
// can be refactored without touching call sites.

import { TickerShell } from "@/components/ticker/ticker-shell"

export function LiveTicker() {
  return <TickerShell sport="soccer" />
}
