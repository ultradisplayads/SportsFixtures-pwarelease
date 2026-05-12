import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/server/admin-auth"

const STRAPI = () =>
  (process.env.SF_API_URL || "http://localhost:1337")
    .replace(/\/api-docs\/?$/, "")
    .replace(/\/$/, "")

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminSession(req)
  if (!session.ok) return session.response

  try {
    const { id } = await context.params  // ← await params in Next.js 15

    const res = await fetch(
      `${STRAPI()}/api/watch-venues/${id}/xibo/push`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.jwt}`,
          "Content-Type": "application/json",
        },
      }
    )
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Push failed" }, { status: 500 })
  }
}
