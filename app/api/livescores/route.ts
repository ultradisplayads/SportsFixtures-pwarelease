import { NextResponse } from "next/server"
import { makeSuccessEnvelope, makeEmptyEnvelope } from "@/lib/contracts"
import { buildWarning } from "@/lib/validation"
import { cachedProviderJson } from "@/lib/provider-cache"
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
      source: "internal",
      unavailableReason: "Live scores are not available from the configured SportsFixtures data feed.",
    })
    return NextResponse.json(envelope)
  }

  try {
    const text = await cachedProviderJson({
      provider: "sportsdb-v2",
      endpoint: `GET:livescore/${sport}`,
      ttlSeconds: 15,
      cacheNull: true,
      fetcher: async () => {
        const res = await fetch(`${API_BASE_V2}/livescore/${sport}`, {
          headers: { "X-API-KEY": SPORTSDB_API_KEY },
          cache: "no-store",
        })

        if (!res.ok) return null
        return res.text()
      },
    })

    if (text == null) {
      const envelope: NormalizedEnvelope<{ livescores: unknown[] }> = makeEmptyEnvelope({
        source: "internal",
        unavailableReason: "Live scores are temporarily unavailable.",
      })
      return NextResponse.json(envelope)
    }
    if (!text || text.trim() === "" || text.trim() === "null") {
      const envelope: NormalizedEnvelope<{ livescores: unknown[] }> = makeSuccessEnvelope({
        data: { livescores: [] },
        source: "internal",
        fetchedAt,
        maxAgeSeconds: 30,
        live: true,
        warnings: [buildWarning("EMPTY_RESPONSE", "The live-score feed returned an empty body")],
      })
      return NextResponse.json(envelope)
    }

    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      const envelope: NormalizedEnvelope<{ livescores: unknown[] }> = makeEmptyEnvelope({
        source: "internal",
        unavailableReason: "Failed to parse livescores response JSON",
      })
      return NextResponse.json(envelope)
    }

    const livescores = data?.livescores ?? []
    const envelope: NormalizedEnvelope<{ livescores: unknown[] }> = makeSuccessEnvelope({
      data: { livescores },
      source: "internal",
      fetchedAt,
      maxAgeSeconds: 30,
      live: true,
    })

    return NextResponse.json(envelope, {
      headers: { "Cache-Control": "no-store" },
    })
  } catch (err) {
    const envelope: NormalizedEnvelope<{ livescores: unknown[] }> = makeEmptyEnvelope({
      source: "internal",
      unavailableReason: err instanceof Error ? err.message : "Network error",
    })
    return NextResponse.json(envelope)
  }
}
