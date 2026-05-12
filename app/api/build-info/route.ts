import { headers } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    app: "SportsFixtures PWA canonical",
    host: (await headers()).get("host") || "unknown",
    canonicalPort: 3010,
    revision:
      process.env.NEXT_PUBLIC_REVISION ||
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
      "local-dev",
    updatedAt: process.env.NEXT_PUBLIC_BUILD_TIME || "2026-05-07 local",
  })
}
