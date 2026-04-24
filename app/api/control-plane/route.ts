// GET /api/control-plane
// Section 12 — Normalized operator configuration snapshot.
//
// Returns a validated ControlPlaneSnapshot.
// All sections fall back to safe defaults if Strapi is unavailable.
// This is the single endpoint the frontend reads — never fetch individual
// config documents from multiple routes.
//
// Cache: 5 minutes (s-maxage=300) with 60s stale-while-revalidate.
// Operators should see changes within ~5 minutes without developer intervention.

import { NextResponse } from "next/server"
import type { ControlPlaneSnapshot } from "@/types/control-plane"
import { fetchControlPlaneSnapshot } from "@/lib/control-plane"

export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse<ControlPlaneSnapshot>> {
  const snapshot = await fetchControlPlaneSnapshot()

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
    },
  })
}
