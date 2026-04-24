import { NextResponse } from "next/server"
import { makeSuccessEnvelope, makeEmptyEnvelope } from "@/lib/contracts"
import { buildWarning } from "@/lib/validation"
import type { NormalizedEnvelope } from "@/types/contracts"

const SPORTSDB_API_KEY = process.env.SPORTSDB_API_KEY || "3"
const API_BASE_V2 = "https://www.thesportsdb.com/api/v2/json"

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get("sport") || "soccer"
  const fetchedAt = new Date().toISOString()

  // Free key "3" does not have access to v2 livescores
  if (SPORTSDB_API_KEY === "3") {
    const envelope: NormalizedEnvelope<{ livescores: unknown[] }> = makeEmptyEnvelope({
      source: "thesportsdb",
      unavailableReason: "Free API key (3) does not have access to v2 live scores. A paid SPORTSDB_API_KEY is required.",
    })
    return NextResponse.json(envelope)
  }

  try {
    const res = await fetch(`${API_BASE_V2}/livescore/${sport}`, {
      headers: { "X-API-KEY": SPORTSDB_API_KEY },
      cache: "no-store",
    })

    if (!res.ok) {
      const envelope: NormalizedEnvelope<{ livescores: unknown[] }> = makeEmptyEnvelope({
        source: "thesportsdb",
        unavailableReason: `TheSportsDB returned HTTP ${res.status}`,
      })
      return NextResponse.json(envelope)
    }

    const text = await res.text()
    if (!text || text.trim() === "" || text.trim() === "null") {
      const envelope: NormalizedEnvelope<{ livescores: unknown[] }> = makeSuccessEnvelope({
        data: { livescores: [] },
        source: "thesportsdb",
        fetchedAt,
        maxAgeSeconds: 30,
        live: true,
        warnings: [buildWarning("EMPTY_RESPONSE", "TheSportsDB returned an empty body for livescores")],
      })
      return NextResponse.json(envelope)
    }

    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      const envelope: NormalizedEnvelope<{ livescores: unknown[] }> = makeEmptyEnvelope({
        source: "thesportsdb",
        unavailableReason: "Failed to parse livescores response JSON",
      })
      return NextResponse.json(envelope)
    }

    const livescores = data?.livescores ?? []
    const envelope: NormalizedEnvelope<{ livescores: unknown[] }> = makeSuccessEnvelope({
      data: { livescores },
      source: "thesportsdb",
      fetchedAt,
      maxAgeSeconds: 30,
      live: true,
    })

    return NextResponse.json(envelope, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (err) {
    const envelope: NormalizedEnvelope<{ livescores: unknown[] }> = makeEmptyEnvelope({
      source: "thesportsdb",
      unavailableReason: err instanceof Error ? err.message : "Network error",
    })
    return NextResponse.json(envelope)
  }
}
