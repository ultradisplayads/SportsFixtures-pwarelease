import { NextRequest, NextResponse } from "next/server"

const STRAPI = () =>
  (process.env.SF_API_URL || "http://localhost:1337")
    .replace(/\/api-docs\/?$/, "")
    .replace(/\/$/, "")

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const res = await fetch(
      `${STRAPI()}/api/watch-venues/${id}/xibo/status`,
      {
        cache: "no-store",
        // No auth header — endpoint is public
      }
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Failed to fetch Xibo status" }, { status: 500 })
  }
}