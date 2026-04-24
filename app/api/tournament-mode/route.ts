// GET /api/tournament-mode
// Section 14 — Tournament Mode API Route
//
// Returns the normalized TournamentModeState derived from the control-plane snapshot.
// The frontend must consume this route — it must not infer tournament mode from
// competition names, feature flags alone, or any other indirect signal.
//
// This route is a thin adapter: it reads the control plane and converts
// TournamentModeDto → TournamentModeState via lib/tournament-mode.ts.

import { NextResponse } from "next/server"
import type { TournamentModeApiResponse } from "@/types/tournament-mode"
import { fetchControlPlaneSnapshot } from "@/lib/control-plane"
import { tournamentDtoToState } from "@/lib/tournament-mode"

export async function GET() {
  try {
    const snapshot = await fetchControlPlaneSnapshot()
    const state = tournamentDtoToState(snapshot.tournamentMode ?? null)

    const response: TournamentModeApiResponse = {
      state,
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json(response, {
      headers: {
        // Tournament mode doesn't change frequently — cache for 60s, stale 30s
        "Cache-Control": "s-maxage=60, stale-while-revalidate=30",
      },
    })
  } catch {
    // Never let a broken control plane crash this route.
    // Return a safe "off" state so the frontend can render normally.
    const { TOURNAMENT_MODE_OFF } = await import("@/lib/tournament-mode")
    const response: TournamentModeApiResponse = {
      state: TOURNAMENT_MODE_OFF,
      generatedAt: new Date().toISOString(),
    }
    return NextResponse.json(response, { status: 200 })
  }
}
