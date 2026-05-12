import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/server/admin-auth"

const STRAPI = () =>
  (process.env.SF_API_URL || "http://localhost:1337")
    .replace(/\/api-docs\/?$/, "")
    .replace(/\/$/, "")

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession(req)
  if (!session.ok) return session.response

  try {
    const { id } = await context.params

    const res = await fetch(
      `${STRAPI()}/api/watch-venues/${id}/xibo/status`,
      {
        cache: "no-store",
        headers: { Authorization: `Bearer ${session.jwt}` },
        // No auth header — endpoint is public
      }
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Failed to fetch display advertising status" }, { status: 500 })
  }
}
