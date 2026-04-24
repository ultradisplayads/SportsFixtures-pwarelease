// app/api/debug/assets/route.ts
// Section 08.F — Asset audit debug endpoint (hardened).
//
// Dev-only route (blocked in production) that fetches live entities, runs them
// through the normalization + audit layer, and returns:
//   - A NormalizedEnvelope wrapping the audit results
//   - Per-entity findings with severity, code, and source-field traces
//
// Usage:
//   GET /api/debug/assets
//   GET /api/debug/assets?type=teams&q=Manchester
//   GET /api/debug/assets?type=competitions
//   GET /api/debug/assets?type=venues
//
// Returns: NormalizedEnvelope<{ results: AssetAuditResult[], summary }>

import { NextRequest, NextResponse } from "next/server";
import { getTopLeagues, getSFVenues, searchSFTeams } from "@/lib/sf-api";
import {
  buildTeamAssetContract,
  buildCompetitionAssetContract,
  buildVenueAssetContract,
} from "@/lib/asset-normalization";
import { auditAssetBatch, type AssetAuditResult } from "@/lib/asset-audit";
import { makeEnvelope } from "@/lib/contracts";
import { deriveFreshness, deriveAvailability } from "@/lib/freshness";

// ── Guard — production block ───────────────────────────────────────────────

function isProd(): boolean {
  return process.env.NODE_ENV === "production" && !process.env.DEBUG_ASSETS_ENABLED;
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (isProd()) {
    return NextResponse.json(
      { error: "Asset debug endpoint is disabled in production." },
      { status: 403 },
    );
  }

  const { searchParams } = req.nextUrl;
  const type  = searchParams.get("type") ?? "competitions";
  const query = searchParams.get("q") ?? "";

  const validTypes = ["competitions", "teams", "venues"] as const;
  if (!validTypes.includes(type as typeof validTypes[number])) {
    return NextResponse.json(
      { error: `Unknown type "${type}". Valid values: competitions, teams, venues.` },
      { status: 400 },
    );
  }

  const fetchedAt = new Date().toISOString();
  let results: AssetAuditResult[] = [];

  try {
    if (type === "competitions") {
      const leagues = await getTopLeagues();
      results = auditAssetBatch(
        leagues.map((l) => ({
          label: l.name ?? l.strLeague ?? "Unknown league",
          contract: buildCompetitionAssetContract(l as unknown as Record<string, unknown>),
        })),
      );
    } else if (type === "teams") {
      const teams = await searchSFTeams(query || "United");
      results = auditAssetBatch(
        teams.map((t) => ({
          label: t.name ?? t.strTeam ?? "Unknown team",
          contract: buildTeamAssetContract(t as unknown as Record<string, unknown>),
        })),
      );
    } else {
      const venues = await getSFVenues();
      results = auditAssetBatch(
        venues.map((v) => ({
          label: v.name ?? "Unknown venue",
          contract: buildVenueAssetContract(v as unknown as Record<string, unknown>),
        })),
      );
    }
  } catch (err) {
    const envelope = makeEnvelope({
      data: null,
      source: "internal",
      freshness: "unknown",
      availability: "unavailable",
      confidence: "low",
      fetchedAt,
      unavailableReason: String(err),
    });
    return NextResponse.json(
      { ...envelope, type, query: query || null },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  const summary = {
    total:    results.length,
    errors:   results.filter((r) => r.hasErrors).length,
    warnings: results.filter((r) => r.hasWarnings && !r.hasErrors).length,
    ok:       results.filter((r) => !r.hasErrors && !r.hasWarnings).length,
  };

  const data = { type, query: query || null, summary, results };
  const availability = deriveAvailability({ data: results });

  const envelope = makeEnvelope({
    data,
    source: "internal",
    freshness: deriveFreshness({ fetchedAt, maxAgeSeconds: 0 }),
    availability,
    confidence: "high",
    fetchedAt,
  });

  return NextResponse.json(envelope, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "X-Debug-Asset-Audit": "true",
    },
  });
}
