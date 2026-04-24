import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

type CheckState = "ok" | "degraded" | "down"

function toState(result: PromiseSettledResult<Response>): CheckState {
  if (result.status !== "fulfilled") return "down"
  if (result.value.ok) return "ok"
  return "degraded"
}

export async function GET(request: Request) {
  const SF_API_URL = (process.env.SF_API_URL || "https://staging-api.sportsfixtures.net")
    .replace(/\/api-docs\/?$/, "")
    .replace(/\/$/, "")

  const SF_API_TOKEN = process.env.SF_API_TOKEN || ""
  const SPORTSDB_API_KEY = process.env.SPORTSDB_API_KEY || "3"
  const STATUS_API_TOKEN = process.env.STATUS_API_TOKEN || ""

  const isProduction = process.env.NODE_ENV === "production"
  const internalToken = request.headers.get("x-status-token")
  const isInternal = Boolean(STATUS_API_TOKEN) && internalToken === STATUS_API_TOKEN

  const checks = await Promise.allSettled([
    fetch(`${SF_API_URL}/api/sports`, {
      headers: SF_API_TOKEN ? { Authorization: `Bearer ${SF_API_TOKEN}` } : {},
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    }),
    fetch(`https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/all_leagues.php`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    }),
  ])

  const [sfResult, sportsDbResult] = checks
  const sfState = toState(sfResult)
  const sportsDbState = toState(sportsDbResult)
  const overall: "ok" | "degraded" = sfState === "ok" && sportsDbState === "ok" ? "ok" : "degraded"

  const publicPayload = {
    status: overall,
    timestamp: new Date().toISOString(),
    services: { sf_api: sfState, sportsdb: sportsDbState },
  }

  if (!isProduction || isInternal) {
    return NextResponse.json(
      {
        ...publicPayload,
        internal: {
          sf_api_url: SF_API_URL,
          has_sf_token: Boolean(SF_API_TOKEN),
          has_sportsdb_key: Boolean(process.env.SPORTSDB_API_KEY),
          has_next_public_sf_api_url: Boolean(process.env.NEXT_PUBLIC_SF_API_URL),
          sportsdb_key_type: SPORTSDB_API_KEY === "3" ? "free" : "paid",
        },
      },
      { status: overall === "ok" ? 200 : 207 },
    )
  }

  return NextResponse.json(publicPayload, { status: overall === "ok" ? 200 : 207 })
}
