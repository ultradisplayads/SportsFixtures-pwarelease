// lib/control-plane-defaults.ts
// Section 12 — Canonical control-plane safe defaults.
//
// Re-exports the authoritative defaults from lib/control-plane.ts so that any
// module that only needs the default values (e.g. admin panels, unit tests)
// can import them without pulling in the full service layer (Strapi fetch,
// validation helpers, etc.).
//
// Do NOT duplicate values here — always re-export from lib/control-plane.ts.

export {
  DEFAULT_TICKER_CONTROL,
  DEFAULT_HOMEPAGE_MODULES,
  DEFAULT_TOURNAMENT_MODE,
  EMPTY_SNAPSHOT,
} from "@/lib/control-plane"
