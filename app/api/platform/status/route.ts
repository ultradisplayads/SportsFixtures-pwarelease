import { NextResponse } from "next/server"

// app/api/platform/status/route.ts
// Section 09 — Lightweight platform health endpoint.
// The SW (and monitoring tools) can poll this to confirm the origin is reachable.
// Returns a minimal JSON payload with server timestamp and build metadata.
// Must never be cached — it is network-only per the SW cache rules.

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      ts: new Date().toISOString(),
      env: process.env.NEXT_PUBLIC_APP_ENV ?? "production",
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? null,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  )
}
